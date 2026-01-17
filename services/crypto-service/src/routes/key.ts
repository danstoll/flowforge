import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Joi from 'joi';
import { validate } from '../middleware/validation';
import { createError } from '../middleware/error-handler';

const router = Router();

const generateKeySchema = Joi.object({
  length: Joi.number().integer().min(8).max(256).default(32),
  encoding: Joi.string().valid('hex', 'base64').default('hex'),
});

const generateUuidSchema = Joi.object({
  version: Joi.string().valid('v4').default('v4'),
  count: Joi.number().integer().min(1).max(100).default(1),
});

// POST /api/v1/crypto/generate-key
router.post('/generate-key', validate(generateKeySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { length, encoding } = req.body;
    
    const key = crypto.randomBytes(length).toString(encoding as BufferEncoding);
    
    res.json({
      success: true,
      data: {
        key,
        length,
        encoding,
        bytes: length,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(createError('Failed to generate key', 500, 'KEY_GENERATION_ERROR'));
  }
});

// POST /api/v1/crypto/generate-uuid
router.post('/generate-uuid', validate(generateUuidSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { count } = req.body;
    
    const uuids: string[] = [];
    for (let i = 0; i < count; i++) {
      uuids.push(crypto.randomUUID());
    }
    
    res.json({
      success: true,
      data: {
        uuids: count === 1 ? uuids[0] : uuids,
        count,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(createError('Failed to generate UUID', 500, 'UUID_GENERATION_ERROR'));
  }
});

// POST /api/v1/crypto/random-bytes
router.post('/random-bytes', validate(generateKeySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { length, encoding } = req.body;
    
    const bytes = crypto.randomBytes(length).toString(encoding as BufferEncoding);
    
    res.json({
      success: true,
      data: {
        bytes,
        length,
        encoding,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(createError('Failed to generate random bytes', 500, 'RANDOM_BYTES_ERROR'));
  }
});

export { router as keyRoutes };
