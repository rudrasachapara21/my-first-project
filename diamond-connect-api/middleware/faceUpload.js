/**
 * Middleware: faceUpload
 * - Uses multer memoryStorage to capture the uploaded profile photo into memory
 * - Attempts to run face detection (if optional libraries are installed and models available)
 * - If detection passes (exactly 1 face) uploads buffer to Cloudinary and sets req.file.path
 * - If detection fails, responds with 400 and an explanatory message
 * - If face detection libraries are not installed, falls back to direct upload (non-blocking)
 */

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { PassThrough } = require('stream');

const storage = multer.memoryStorage();
// Allow up to 50MB uploads and accept standard image mime types
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Explicitly allow high-quality web formats commonly used for portraits
    // (jpeg, png, webp, tiff, heic). Reject other file types to avoid accidental uploads.
    const allowed = /image\/(jpeg|png|webp|tiff|heic)/i;
    if (file && file.mimetype && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
}).single('profilePhoto');

// Configure cloudinary using existing env config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to upload a buffer to cloudinary and return a promise that resolves with result
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    const stream = new PassThrough();
    stream.end(buffer);
    stream.pipe(uploadStream);
  });
}

async function detectFacesInBuffer(buffer, modelsPath) {
  // Try to require optional heavy dependencies. If unavailable, throw to let caller fallback.
  const faceapi = require('@vladmandic/face-api');
  const canvas = require('canvas');
  const tf = require('@tensorflow/tfjs-node');

  // Patch face-api environment for node
  const { Canvas, Image, ImageData } = canvas;
  faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

  // Load tiny face detector model from modelsPath (expects models to be downloaded)
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath);

  // Create an image from buffer
  const img = await canvas.loadImage(buffer);
  
  // Try Tiny Face Detector first with larger input size to detect small faces in full-body photos
  // Increase scoreThreshold to reduce false positives (shadows/clothing mistaken as faces)
  const tinyOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.6 });
  try {
    const detections = await faceapi.detectAllFaces(img, tinyOptions);
    if (detections && detections.length > 0) return detections.length;
  } catch (e) {
    // if tiny detector isn't available or fails, we'll try fallback below
    console.warn('Tiny face detector failed or unavailable:', e.message || e);
  }

  // Fallback: try SSD MobileNet (deeper) if available - can detect small faces too
  try {
    if (!faceapi.nets.ssdMobilenetv1 || !faceapi.nets.ssdMobilenetv1.params) {
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
    }
    // Use a higher minConfidence for SSD fallback as well to avoid hallucinations
    const ssdOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 });
    const ssdDetections = await faceapi.detectAllFaces(img, ssdOptions);
    if (ssdDetections && ssdDetections.length > 0) return ssdDetections.length;
  } catch (e) {
    console.warn('SSD MobileNet fallback failed or unavailable:', e.message || e);
  }

  // No faces detected by any method
  return 0;
}

module.exports = async function faceUploadMiddleware(req, res, next) {
  // Run multer to populate req.file (in memory)
  upload(req, res, async function (err) {
    if (err) return next(err);

    // If no file provided, continue (profile update may not include photo)
    if (!req.file || !req.file.buffer) return next();

    const buffer = req.file.buffer;

    // Attempt face detection if optional libs and models are present
    let faceCount = null;
    try {
      // models are expected at ./models relative to this middleware file
      const path = require('path');
      const modelsPath = path.join(__dirname, '..', 'models');
      faceCount = await detectFacesInBuffer(buffer, modelsPath);
    } catch (e) {
      console.warn('Face detection skipped (optional libs/models missing or error):', e.message || e);
      faceCount = null; // indicate detection skipped
    }

    // If face detection couldn't run and strict mode is requested, fail fast.
    // Set FACE_DETECTION_STRICT=true in production environments where you require server-side detection.
    const strictMode = process.env.FACE_DETECTION_STRICT === 'true';
    if (faceCount === null && strictMode) {
      console.error('Face detection strict mode enabled but detection is unavailable.');
      return res.status(503).json({ message: 'Face detection unavailable on server. Install optional libs/models or disable FACE_DETECTION_STRICT.' });
    }

    // If detection was performed, enforce rules with exact JSON error shapes required by frontend
    if (faceCount !== null) {
      if (faceCount === 0) {
        return res.status(400).json({ error: 'No face detected' });
      }
      if (faceCount > 1) {
        return res.status(400).json({ error: 'Multiple faces detected' });
      }
      // Exactly 1 face — proceed to upload
    }

    // Upload to Cloudinary (same folder/transformation as previous storage)
    try {
      const uploadResult = await uploadBufferToCloudinary(buffer, {
        folder: 'diamond-connect/profile-photos',
        transformation: [{ width: 300, height: 300, crop: 'fill' }]
      });

      // Normalize to existing expected field: req.file.path
      req.file.path = uploadResult.secure_url || uploadResult.url;
      // Keep other metadata for compatibility
      req.file.cloudinary = uploadResult;
      next();
    } catch (uploadErr) {
      console.error('Profile photo upload failed:', uploadErr);
      return next(uploadErr);
    }
  });
};
