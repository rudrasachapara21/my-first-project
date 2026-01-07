/*
 * downloads the tiny face detector model files from the face-api.js repo (raw GitHub)
 * into ./models. This script fetches the manifest then downloads each referenced shard/weights file.
 *
 * Usage:
 *   node scripts/download_face_models.js
 *
 * Notes:
 * - Requires network access to GitHub raw URLs. If your environment blocks this, download the files
 *   manually into diamond-connect-api/models and keep the same filenames.
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const MODELS_DIR = path.join(__dirname, '..', 'models');
const BASE_RAW = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const MANIFEST = 'tiny_face_detector_model-weights_manifest.json';

async function ensureModelsDir() {
  if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(arrayBuffer));
}

async function run() {
  try {
    await ensureModelsDir();
    console.log('Downloading manifest...');
    const manifestUrl = `${BASE_RAW}/${MANIFEST}`;
    const manifestRes = await fetch(manifestUrl);
    if (!manifestRes.ok) throw new Error(`Failed to fetch manifest: ${manifestRes.status}`);
    const manifestJson = await manifestRes.json();
    const destManifest = path.join(MODELS_DIR, MANIFEST);
    fs.writeFileSync(destManifest, JSON.stringify(manifestJson, null, 2));
    console.log(`Saved manifest to ${destManifest}`);

    // Download all files referenced in the manifest (relative to BASE_RAW)
    const files = [];
    // Manifest can be an array of entries. Try several common fields.
    if (Array.isArray(manifestJson)) {
      manifestJson.forEach(entry => {
        if (!entry) return;
        // common TFJS manifest uses 'paths' array
        if (Array.isArray(entry.paths)) {
          entry.paths.forEach(p => { if (p) files.push(p); });
        }
        // some manifests include weights with 'uri' or 'file'
        if (Array.isArray(entry.weights)) {
          entry.weights.forEach(w => {
            if (!w) return;
            if (typeof w.uri === 'string') files.push(w.uri);
            else if (typeof w.file === 'string') files.push(w.file);
            else if (typeof w.path === 'string') files.push(w.path);
          });
        }
      });
    }

    // Fallback: if parsing yielded nothing, hardcode the tiny face detector shards
    if (files.length === 0) {
      console.warn('Could not parse manifest entries; falling back to hardcoded tiny face detector shard names.');
      files.push('tiny_face_detector_model-shard1');
      files.push('tiny_face_detector_model-shard2');
    }

    for (const fileName of files) {
      if (!fileName || typeof fileName !== 'string') {
        console.warn('Skipping invalid file entry from manifest:', fileName);
        continue;
      }
      const fileUrl = `${BASE_RAW}/${fileName}`;
      const destPath = path.join(MODELS_DIR, fileName);
      console.log(`Downloading ${fileName} from ${fileUrl}...`);
      try {
        await download(fileUrl, destPath);
        console.log(`Saved ${destPath}`);
      } catch (dErr) {
        // Try common alternative extensions (.bin, .weights.bin) if first attempt failed
        const tried = [];
        let saved = false;
        const altExts = ['.bin', '.weights.bin'];
        for (const ext of altExts) {
          const altFileName = fileName.endsWith(ext) ? fileName : `${fileName}${ext}`;
          const altUrl = `${BASE_RAW}/${altFileName}`;
          const altDest = path.join(MODELS_DIR, altFileName);
          tried.push(altUrl);
          try {
            await download(altUrl, altDest);
            console.log(`Saved ${altDest}`);
            saved = true;
            break;
          } catch (altErr) {
            // continue trying
          }
        }
        if (!saved) {
          console.error(`Failed to download ${fileName} and alternatives (${tried.join(', ')}):`, dErr && dErr.message ? dErr.message : dErr);
        }
      }
    }

    console.log('All tiny face detector model files downloaded.');
  } catch (err) {
    console.error('Error downloading models:', err.message || err);
    process.exit(1);
  }
}

run();
