const { validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next({ statusCode: 400, errors: errors.array() });
  }
  return next();
}

module.exports = handleValidation;












