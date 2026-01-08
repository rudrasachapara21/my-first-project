const { body, validationResult } = require('express-validator');

/**
 * Validates the diamond demand posting request.
 * Synchronizes frontend fields (size, price_per_caret) with 
 * backend logic requirements.
 */
const validateDemand = [
  // Validate 'size' (Ct) - Required for DB columns 'min_carat' and 'max_carat'
  body('size')
    .notEmpty().withMessage('Size (Ct) is required')
    .isFloat({ gt: 0 }).withMessage('Size must be a positive number'),

  // Validate 'price_per_caret' - Required for DB column 'max_price'
  body('price_per_caret')
    .notEmpty().withMessage('Price/Ct is required')
    .isFloat({ gt: 0 }).withMessage('Price per carat must be a positive number'),

  body('clarity')
    .notEmpty().withMessage('Clarity is required')
    .isString().withMessage('Clarity must be a string')
    .trim(),

  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),

  // Optional fields with checkFalsy to handle empty strings from the React UI
  body('require_till')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Required By must be a valid date'),

  body('payment_duration')
    .optional({ checkFalsy: true })
    .isString()
    .trim(),

  body('private_name')
    .optional({ checkFalsy: true })
    .isString()
    .trim(),

  // Middleware to catch validation errors and return a clean response
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return the first specific error message to display in the frontend toast
      return res.status(400).json({ 
        message: errors.array()[0].msg 
      });
    }
    next();
  }
];

module.exports = { validateDemand };