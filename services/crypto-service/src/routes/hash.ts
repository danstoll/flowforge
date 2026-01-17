import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Joi from 'joi';
import { validate } from '../middleware/validation';
import { createError } from '../middleware/error-handler';

const router = Router();

const SUPPORTED_ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha384', 'sha512'];
const SUPPORTED_ENCODINGS = ['hex', 'base64'];

const hashSchema = Joi.object({
  data: Joi.string().required().max(10000000),
  algorithm: Joi.string().valid(...SUPPORTED_ALGORITHMS).default('sha256'),
  encoding: Joi.string().valid(...SUPPORTED_ENCODINGS).default('hex'),
});

const hmacSchema = Joi.object({
  data: Joi.string().required().max(10000000),
  key: Joi.string().required().min(1),
  algorithm: Joi.string().valid(...SUPPORTED_ALGORITHMS).default('sha256'),
  encoding: Joi.string().valid(...SUPPORTED_ENCODINGS).default('hex'),
});

// POST /api/v1/crypto/hash
router.post('/hash', validate(hashSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, algorithm, encoding } = req.body;
    
    const hash = crypto
      .createHash(algorithm)
      .update(data)
      .digest(encoding as crypto.BinaryToTextEncoding);
    
    res.json({
      success: true,
      data: {
        hash,
        algorithm,
        encoding,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(createError('Failed to generate hash', 500, 'HASH_ERROR'));
  }
});

// POST /api/v1/crypto/hmac
router.post('/hmac', validate(hmacSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, key, algorithm, encoding } = req.body;
    
    const hmac = crypto
      .createHmac(algorithm, key)
      .update(data)
      .digest(encoding as crypto.BinaryToTextEncoding);
    
    res.json({
      success: true,
      data: {
        hmac,
        algorithm,
        encoding,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(createError('Failed to generate HMAC', 500, 'HMAC_ERROR'));
  }
});

// GET /api/v1/crypto/algorithms
router.get('/algorithms', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      hash: SUPPORTED_ALGORITHMS,
      encodings: SUPPORTED_ENCODINGS,
    },
    timestamp: new Date().toISOString(),
  });
});

export { router as hashRoutes };
