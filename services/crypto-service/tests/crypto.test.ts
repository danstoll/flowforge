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
});
