import { Router, Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import Joi from 'joi';
import { validate } from '../middleware/validation';
import { createError } from '../middleware/error-handler';
import { config } from '../config';

const router = Router();

const generateSchema = Joi.object({
  payload: Joi.object().required(),
  secret: Joi.string().min(32).optional(),
  options: Joi.object({
    algorithm: Joi.string().valid('HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512').default('HS256'),
    expiresIn: Joi.alternatives().try(
      Joi.string().pattern(/^\d+[smhd]$/),
      Joi.number().integer().positive()
    ).default('1h'),
    issuer: Joi.string().optional(),
    audience: Joi.string().optional(),
    subject: Joi.string().optional(),
    jwtid: Joi.string().optional(),
    notBefore: Joi.alternatives().try(
      Joi.string().pattern(/^\d+[smhd]$/),
      Joi.number().integer()
    ).optional(),
  }).default({}),
});

const verifySchema = Joi.object({
  token: Joi.string().required(),
  secret: Joi.string().min(32).optional(),
  options: Joi.object({
    algorithms: Joi.array().items(
      Joi.string().valid('HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512')
    ).default(['HS256']),
    issuer: Joi.string().optional(),
    audience: Joi.string().optional(),
    subject: Joi.string().optional(),
    ignoreExpiration: Joi.boolean().default(false),
    clockTolerance: Joi.number().integer().min(0).max(300).default(0),
  }).default({}),
});

const decodeSchema = Joi.object({
  token: Joi.string().required(),
  complete: Joi.boolean().default(false),
});

const refreshSchema = Joi.object({
  token: Joi.string().required(),
  secret: Joi.string().min(32).optional(),
  newExpiresIn: Joi.alternatives().try(
    Joi.string().pattern(/^\d+[smhd]$/),
    Joi.number().integer().positive()
  ).default('1h'),
});

// POST /api/v1/crypto/jwt/generate
router.post('/jwt/generate', validate(generateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { payload, secret, options } = req.body;
    const signingSecret = secret || config.jwtSecret;

    if (!signingSecret) {
      return next(createError('JWT secret is required', 400, 'JWT_SECRET_REQUIRED'));
    }

    const signOptions: SignOptions = {
      algorithm: options.algorithm || 'HS256',
      expiresIn: options.expiresIn || '1h',
    };

    if (options.issuer) signOptions.issuer = options.issuer;
    if (options.audience) signOptions.audience = options.audience;
    if (options.subject) signOptions.subject = options.subject;
    if (options.jwtid) signOptions.jwtid = options.jwtid;
    if (options.notBefore) signOptions.notBefore = options.notBefore;

    const token = jwt.sign(payload, signingSecret, signOptions);

    // Decode to get expiration info
    const decoded = jwt.decode(token, { complete: true }) as {
      header: { alg: string; typ: string };
      payload: JwtPayload;
    };

    res.json({
      success: true,
      data: {
        token,
        expiresAt: decoded.payload.exp ? new Date(decoded.payload.exp * 1000).toISOString() : null,
        issuedAt: decoded.payload.iat ? new Date(decoded.payload.iat * 1000).toISOString() : null,
        algorithm: decoded.header.alg,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(createError('Failed to generate JWT', 500, 'JWT_GENERATION_ERROR'));
  }
});

// POST /api/v1/crypto/jwt/verify
router.post('/jwt/verify', validate(verifySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, secret, options } = req.body;
    const verifySecret = secret || config.jwtSecret;

    if (!verifySecret) {
      return next(createError('JWT secret is required', 400, 'JWT_SECRET_REQUIRED'));
    }

    const verifyOptions: VerifyOptions = {
      algorithms: options.algorithms || ['HS256'],
      ignoreExpiration: options.ignoreExpiration || false,
      clockTolerance: options.clockTolerance || 0,
    };

    if (options.issuer) verifyOptions.issuer = options.issuer;
    if (options.audience) verifyOptions.audience = options.audience;
    if (options.subject) verifyOptions.subject = options.subject;

    const decoded = jwt.verify(token, verifySecret, verifyOptions) as JwtPayload;

    res.json({
      success: true,
      data: {
        valid: true,
        payload: decoded,
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
        issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const errorMessages: Record<string, { message: string; code: string }> = {
      TokenExpiredError: { message: 'Token has expired', code: 'JWT_EXPIRED' },
      JsonWebTokenError: { message: 'Invalid token', code: 'JWT_INVALID' },
      NotBeforeError: { message: 'Token not yet active', code: 'JWT_NOT_ACTIVE' },
    };

    const errorInfo = errorMessages[error.name] || { message: 'Token verification failed', code: 'JWT_VERIFICATION_FAILED' };

    res.status(401).json({
      success: false,
      data: {
        valid: false,
        error: errorInfo.code,
        message: errorInfo.message,
        expiredAt: error.expiredAt ? new Date(error.expiredAt).toISOString() : undefined,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/v1/crypto/jwt/decode (decode without verification)
router.post('/jwt/decode', validate(decodeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, complete } = req.body;

    const decoded = jwt.decode(token, { complete });

    if (!decoded) {
      return next(createError('Invalid JWT format', 400, 'JWT_INVALID_FORMAT'));
    }

    res.json({
      success: true,
      data: complete ? decoded : { payload: decoded },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(createError('Failed to decode JWT', 400, 'JWT_DECODE_ERROR'));
  }
});

// POST /api/v1/crypto/jwt/refresh
router.post('/jwt/refresh', validate(refreshSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, secret, newExpiresIn } = req.body;
    const signingSecret = secret || config.jwtSecret;

    if (!signingSecret) {
      return next(createError('JWT secret is required', 400, 'JWT_SECRET_REQUIRED'));
    }

    // Decode the current token (allow expired tokens for refresh)
    const decoded = jwt.verify(token, signingSecret, { ignoreExpiration: true }) as JwtPayload;

    // Remove standard claims that will be regenerated
    const { iat, exp, nbf, jti, ...payload } = decoded;

    // Generate new token with same payload but new expiration
    const newToken = jwt.sign(payload, signingSecret, {
      expiresIn: newExpiresIn,
      algorithm: 'HS256',
    });

    const newDecoded = jwt.decode(newToken, { complete: true }) as {
      payload: JwtPayload;
    };

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresAt: newDecoded.payload.exp ? new Date(newDecoded.payload.exp * 1000).toISOString() : null,
        issuedAt: newDecoded.payload.iat ? new Date(newDecoded.payload.iat * 1000).toISOString() : null,
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError('Invalid token', 401, 'JWT_INVALID'));
    }
    next(createError('Failed to refresh JWT', 500, 'JWT_REFRESH_ERROR'));
  }
});

export { router as jwtRoutes };
