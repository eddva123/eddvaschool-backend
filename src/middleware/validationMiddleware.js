import { validationResult } from 'express-validator';
import APIError from '../utils/APIError.js';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new APIError(errors.array()[0].msg, 400));
  }
  next();
};

export default validate;
