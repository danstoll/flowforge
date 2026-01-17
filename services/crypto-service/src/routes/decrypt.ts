import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Joi from 'joi';
import { validate } from '../middleware/validation';
import { createError } from '../middleware/error-handler';

const router = Router();

const SUPPORTED_ALGORITHMS = ['aes-128-gcm', 'aes-256-gcm', 'aes-256-cbc'];

const decryptSchema = Joi.object({
  encrypted: Joi.string().required(),
  key: Joi.string().required(),
  iv: Joi.string().required(),
  tag: Joi.string().when('algorithm', {
    is: Joi.string().pattern(/gcm/),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  algorithm: Joi.string().valid(...SUPPORTED_ALGORITHMS).default('aes-256-gcm'),
});

const getKeyBuffer = (key: string, algorithm: string): Buffer => {
  const keyLength = algorithm.includes('128') ? 16 : 32;
  const hash = crypto.createHash('sha256').update(key).digest();
  return hash.slice(0, keyLength);
};

// POST /api/v1/crypto/decrypt
router.post('/decrypt', validate(decryptSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { encrypted, key, iv, tag, algorithm } = req.body;
    
    const keyBuffer = getKeyBuffer(key, algorithm);
    const ivBuffer = Buffer.from(iv, 'base64');
    
    const decipher = crypto.createDecipheriv(
      algorithm as crypto.CipherGCMTypes,
      keyBuffer,
      ivBuffer
    );
    
    // Set auth tag for GCM mode
    if (algorithm.includes('gcm') && tag) {
      const tagBuffer = Buffer.from(tag, 'base64');
      (decipher as crypto.DecipherGCM).setAuthTag(tagBuffer);
    }
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    res.json({
      success: true,
      data: {
        decrypted,
        algorithm,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unsupported state or unable to authenticate')) {
      next(createError('Decryption failed: Invalid key, IV, or authentication tag', 400, 'DECRYPTION_AUTH_ERROR'));
    } else {
      next(createError('Decryption failed', 500, 'DECRYPTION_ERROR'));
    }
  }
});

export { router as decryptRoutes };
