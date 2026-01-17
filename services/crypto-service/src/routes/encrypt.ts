import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Joi from 'joi';
import { validate } from '../middleware/validation';
import { createError } from '../middleware/error-handler';

const router = Router();

const SUPPORTED_ALGORITHMS = ['aes-128-gcm', 'aes-256-gcm', 'aes-256-cbc'];

const encryptSchema = Joi.object({
  data: Joi.string().required().max(10000000),
  key: Joi.string().required(),
  algorithm: Joi.string().valid(...SUPPORTED_ALGORITHMS).default('aes-256-gcm'),
});

const getKeyBuffer = (key: string, algorithm: string): Buffer => {
  const keyLength = algorithm.includes('128') ? 16 : 32;
  const hash = crypto.createHash('sha256').update(key).digest();
  return hash.slice(0, keyLength);
};

// POST /api/v1/crypto/encrypt
router.post('/encrypt', validate(encryptSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, key, algorithm } = req.body;
    
    const keyBuffer = getKeyBuffer(key, algorithm);
    const iv = crypto.randomBytes(algorithm.includes('gcm') ? 12 : 16);
    
    const cipher = crypto.createCipheriv(
      algorithm as crypto.CipherGCMTypes,
      keyBuffer,
      iv
    );
    
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const response: {
      encrypted: string;
      iv: string;
      algorithm: string;
      tag?: string;
    } = {
      encrypted,
      iv: iv.toString('base64'),
      algorithm,
    };
    
    // GCM mode provides authentication tag
    if (algorithm.includes('gcm')) {
      const authTag = (cipher as crypto.CipherGCM).getAuthTag();
      response.tag = authTag.toString('base64');
    }
    
    res.json({
      success: true,
      data: response,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(createError('Encryption failed', 500, 'ENCRYPTION_ERROR'));
  }
});

export { router as encryptRoutes };
