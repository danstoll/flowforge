import request from 'supertest';
import { app } from '../src/index';

describe('Crypto Service', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('crypto-service');
    });
  });

  describe('POST /api/v1/crypto/hash', () => {
    it('should hash data with SHA256', async () => {
      const res = await request(app)
        .post('/api/v1/crypto/hash')
        .send({
          data: 'Hello, World!',
          algorithm: 'sha256',
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hash).toBeDefined();
      expect(res.body.data.algorithm).toBe('sha256');
    });

    it('should hash data with MD5', async () => {
      const res = await request(app)
        .post('/api/v1/crypto/hash')
        .send({
          data: 'test',
          algorithm: 'md5',
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.hash).toBe('098f6bcd4621d373cade4e832627b4f6');
    });

    it('should hash data with bcrypt', async () => {
      const res = await request(app)
        .post('/api/v1/crypto/hash')
        .send({
          data: 'password123',
          algorithm: 'bcrypt',
          options: { rounds: 4 }, // Low rounds for fast test
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hash).toMatch(/^\$2[ab]\$\d{2}\$/);
      expect(res.body.data.algorithm).toBe('bcrypt');
    });

    it('should hash data with argon2', async () => {
      const res = await request(app)
        .post('/api/v1/crypto/hash')
        .send({
          data: 'password123',
          algorithm: 'argon2',
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hash).toMatch(/^\$argon2/);
      expect(res.body.data.algorithm).toBe('argon2');
    });

    it('should return validation error for missing data', async () => {
      const res = await request(app)
        .post('/api/v1/crypto/hash')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid algorithm', async () => {
      const res = await request(app)
        .post('/api/v1/crypto/hash')
        .send({
          data: 'test',
          algorithm: 'invalid',
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/crypto/hash/verify', () => {
    it('should verify bcrypt hash', async () => {
      // First create a hash
      const hashRes = await request(app)
        .post('/api/v1/crypto/hash')
        .send({
          data: 'password123',
          algorithm: 'bcrypt',
          options: { rounds: 4 },
        });
      
      // Then verify it
      const verifyRes = await request(app)
        .post('/api/v1/crypto/hash/verify')
        .send({
          data: 'password123',
          hash: hashRes.body.data.hash,
          algorithm: 'bcrypt',
        });
      
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.valid).toBe(true);
    });

    it('should reject invalid bcrypt password', async () => {
      const hashRes = await request(app)
        .post('/api/v1/crypto/hash')
        .send({
          data: 'password123',
          algorithm: 'bcrypt',
          options: { rounds: 4 },
        });
      
      const verifyRes = await request(app)
        .post('/api/v1/crypto/hash/verify')
        .send({
          data: 'wrongpassword',
          hash: hashRes.body.data.hash,
          algorithm: 'bcrypt',
        });
      
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.valid).toBe(false);
    });
  });

  describe('POST /api/v1/crypto/encrypt and /decrypt', () => {
    it('should encrypt and decrypt data', async () => {
      const originalData = 'Secret message';
      const key = 'my-super-secret-key';
      
      // Encrypt
      const encryptRes = await request(app)
        .post('/api/v1/crypto/encrypt')
        .send({
          data: originalData,
          key,
        });
      
      expect(encryptRes.status).toBe(200);
      expect(encryptRes.body.success).toBe(true);
      expect(encryptRes.body.data.encrypted).toBeDefined();
      expect(encryptRes.body.data.iv).toBeDefined();
      expect(encryptRes.body.data.tag).toBeDefined();
      
      // Decrypt
      const decryptRes = await request(app)
        .post('/api/v1/crypto/decrypt')
        .send({
          encrypted: encryptRes.body.data.encrypted,
          key,
          iv: encryptRes.body.data.iv,
          tag: encryptRes.body.data.tag,
        });
      
      expect(decryptRes.status).toBe(200);
      expect(decryptRes.body.success).toBe(true);
      expect(decryptRes.body.data.decrypted).toBe(originalData);
    });
  });

  describe('POST /api/v1/crypto/generate-key', () => {
    it('should generate a key', async () => {
      const res = await request(app)
        .post('/api/v1/crypto/generate-key')
        .send({
          length: 32,
          encoding: 'hex',
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.key).toBeDefined();
      expect(res.body.data.key.length).toBe(64); // 32 bytes = 64 hex chars
    });
  });

  describe('POST /api/v1/crypto/generate-uuid', () => {
    it('should generate a UUID', async () => {
      const res = await request(app)
        .post('/api/v1/crypto/generate-uuid')
        .send({});
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uuids).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate multiple UUIDs', async () => {
      const res = await request(app)
        .post('/api/v1/crypto/generate-uuid')
        .send({ count: 5 });
      
      expect(res.status).toBe(200);
      expect(res.body.data.uuids).toHaveLength(5);
    });
  });

  describe('JWT Operations', () => {
    const testSecret = 'this-is-a-test-secret-key-at-least-32-chars';

    describe('POST /api/v1/crypto/jwt/generate', () => {
      it('should generate a JWT token', async () => {
        const res = await request(app)
          .post('/api/v1/crypto/jwt/generate')
          .send({
            payload: { userId: '123', role: 'admin' },
            secret: testSecret,
            options: { expiresIn: '1h' },
          });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.token.split('.')).toHaveLength(3);
        expect(res.body.data.expiresAt).toBeDefined();
        expect(res.body.data.algorithm).toBe('HS256');
      });

      it('should require a payload', async () => {
        const res = await request(app)
          .post('/api/v1/crypto/jwt/generate')
          .send({
            secret: testSecret,
          });
        
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('POST /api/v1/crypto/jwt/verify', () => {
      it('should verify a valid JWT token', async () => {
        // First generate a token
        const genRes = await request(app)
          .post('/api/v1/crypto/jwt/generate')
          .send({
            payload: { userId: '123' },
            secret: testSecret,
          });
        
        // Then verify it
        const verifyRes = await request(app)
          .post('/api/v1/crypto/jwt/verify')
          .send({
            token: genRes.body.data.token,
            secret: testSecret,
          });
        
        expect(verifyRes.status).toBe(200);
        expect(verifyRes.body.data.valid).toBe(true);
        expect(verifyRes.body.data.payload.userId).toBe('123');
      });

      it('should reject an invalid token', async () => {
        const res = await request(app)
          .post('/api/v1/crypto/jwt/verify')
          .send({
            token: 'invalid.token.here',
            secret: testSecret,
          });
        
        expect(res.status).toBe(401);
        expect(res.body.data.valid).toBe(false);
        expect(res.body.data.error).toBe('JWT_INVALID');
      });

      it('should reject a token with wrong secret', async () => {
        const genRes = await request(app)
          .post('/api/v1/crypto/jwt/generate')
          .send({
            payload: { userId: '123' },
            secret: testSecret,
          });
        
        const verifyRes = await request(app)
          .post('/api/v1/crypto/jwt/verify')
          .send({
            token: genRes.body.data.token,
            secret: 'different-secret-key-at-least-32-chars-long',
          });
        
        expect(verifyRes.status).toBe(401);
        expect(verifyRes.body.data.valid).toBe(false);
      });
    });

    describe('POST /api/v1/crypto/jwt/decode', () => {
      it('should decode a JWT without verification', async () => {
        const genRes = await request(app)
          .post('/api/v1/crypto/jwt/generate')
          .send({
            payload: { userId: '456', name: 'Test' },
            secret: testSecret,
          });
        
        const decodeRes = await request(app)
          .post('/api/v1/crypto/jwt/decode')
          .send({
            token: genRes.body.data.token,
          });
        
        expect(decodeRes.status).toBe(200);
        expect(decodeRes.body.data.payload.userId).toBe('456');
        expect(decodeRes.body.data.payload.name).toBe('Test');
      });

      it('should return complete token with header when requested', async () => {
        const genRes = await request(app)
          .post('/api/v1/crypto/jwt/generate')
          .send({
            payload: { test: 'data' },
            secret: testSecret,
          });
        
        const decodeRes = await request(app)
          .post('/api/v1/crypto/jwt/decode')
          .send({
            token: genRes.body.data.token,
            complete: true,
          });
        
        expect(decodeRes.status).toBe(200);
        expect(decodeRes.body.data.header).toBeDefined();
        expect(decodeRes.body.data.header.alg).toBe('HS256');
      });
    });

    describe('POST /api/v1/crypto/jwt/refresh', () => {
      it('should refresh a JWT token', async () => {
        const genRes = await request(app)
          .post('/api/v1/crypto/jwt/generate')
          .send({
            payload: { userId: '789' },
            secret: testSecret,
            options: { expiresIn: '1m' },
          });
        
        const refreshRes = await request(app)
          .post('/api/v1/crypto/jwt/refresh')
          .send({
            token: genRes.body.data.token,
            secret: testSecret,
            newExpiresIn: '2h',
          });
        
        expect(refreshRes.status).toBe(200);
        expect(refreshRes.body.success).toBe(true);
        expect(refreshRes.body.data.token).toBeDefined();
        expect(refreshRes.body.data.token).not.toBe(genRes.body.data.token);
        
        // Verify the new token still has the payload
        const verifyRes = await request(app)
          .post('/api/v1/crypto/jwt/verify')
          .send({
            token: refreshRes.body.data.token,
            secret: testSecret,
          });
        
        expect(verifyRes.body.data.payload.userId).toBe('789');
      });
    });
  });
});
