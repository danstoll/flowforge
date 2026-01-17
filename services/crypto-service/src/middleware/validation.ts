import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './error-handler';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(createError(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        details
      ));
    }

    req.body = value;
    next();
  };
};
