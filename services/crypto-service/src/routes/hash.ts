import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import argon2 from 'argon2';
import Joi from 'joi';
import { validate } from '../middleware/validation';
import { createError } from '../middleware/error-handler';

const router = Router();

const CRYPTO_ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha384', 'sha512'];
const PASSWORD_ALGORITHMS = ['bcrypt', 'argon2'];
const SUPPORTED_ALGORITHMS = [...CRYPTO_ALGORITHMS, ...PASSWORD_ALGORITHMS];
const SUPPORTED_ENCODINGS = ['hex', 'base64'];

const hashSchema = Joi.object({
  data: Joi.string().required().max(10000000),
  algorithm: Joi.string().valid(...SUPPORTED_ALGORITHMS).default('sha256'),
  encoding: Joi.string().valid(...SUPPORTED_ENCODINGS).default('hex'),
  options: Joi.object({
    rounds: Joi.number().integer().min(4).max(16).default(10), // bcrypt rounds
    memoryCost: Joi.number().integer().min(1024).max(1048576).default(65536), // argon2 memory
    timeCost: Joi.number().integer().min(1).max(10).default(3), // argon2 iterations
    parallelism: Joi.number().integer().min(1).max(16).default(4), // argon2 threads
  }).default({}),
});

const verifyHashSchema = Joi.object({
  data: Joi.string().required().max(10000000),
  hash: Joi.string().required(),
  algorithm: Joi.string().valid(...PASSWORD_ALGORITHMS).required(),
});

const hmacSchema = Joi.object({
  data: Joi.string().required().max(10000000),
  key: Joi.string().required().min(1),
  algorithm: Joi.string().valid(...CRYPTO_ALGORITHMS).default('sha256'),
  encoding: Joi.string().valid(...SUPPORTED_ENCODINGS).default('hex'),
});

// POST /api/v1/crypto/hash
router.post('/hash', validate(hashSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, algorithm, encoding, options } = req.body;
    
    let hash: string;
    
    if (algorithm === 'bcrypt') {
      hash = await bcrypt.hash(data, options.rounds || 10);
    } else if (algorithm === 'argon2') {
      hash = await argon2.hash(data, {
        memoryCost: options.memoryCost || 65536,
        timeCost: options.timeCost || 3,
        parallelism: options.parallelism || 4,
      });
    } else {
      hash = crypto
        .createHash(algorithm)
        .update(data)
        .digest(encoding as crypto.BinaryToTextEncoding);
    }
    
    res.json({
      success: true,
      data: {
        hash,
        algorithm,
        encoding: PASSWORD_ALGORITHMS.includes(algorithm) ? 'encoded' : encoding,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(createError('Failed to generate hash', 500, 'HASH_ERROR'));
  }
});

// POST /api/v1/crypto/hash/verify - Verify bcrypt/argon2 hashes
router.post('/hash/verify', validate(verifyHashSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, hash, algorithm } = req.body;
    
    let valid: boolean;
    
    if (algorithm === 'bcrypt') {
      valid = await bcrypt.compare(data, hash);
    } else if (algorithm === 'argon2') {
      valid = await argon2.verify(hash, data);
    } else {
      return next(createError('Algorithm not supported for verification', 400, 'INVALID_ALGORITHM'));
    }
    
    res.json({
      success: true,
      data: {
        valid,
        algorithm,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Invalid hash format or verification error
    res.json({
      success: true,
      data: {
        valid: false,
        algorithm: req.body.algorithm,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
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
