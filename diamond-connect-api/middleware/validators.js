let validateDemand;

try {
  const { body, validationResult } = require('express-validator');

  validateDemand = [
    body('size').optional().isFloat({ gt: 0 }).withMessage('size must be a positive number'),
    body('clarity').optional().isString().withMessage('clarity must be a string'),
    body('price_per_caret').optional().isFloat({ gt: 0 }).withMessage('price_per_caret must be a positive number'),
    body('quantity').optional().isInt({ gt: 0 }).withMessage('quantity must be a positive integer'),
    body('require_till').optional().isISO8601().withMessage('require_till must be a valid date'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ];
} catch (err) {
  // If express-validator isn't installed, export a no-op middleware and warn.
  console.warn('express-validator not installed — request validation disabled. Run `npm install` in diamond-connect-api to enable it.');
  validateDemand = [(req, res, next) => next()];
}

module.exports = { validateDemand };
