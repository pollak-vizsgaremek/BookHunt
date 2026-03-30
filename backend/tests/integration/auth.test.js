import request from 'supertest';
import app from '../../src/server.js';
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

describe('Auth API Integration Tests', () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
  };

  afterAll(async () => {
    // Clean up test user
    await prisma.felhasznalo.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
    
    // Express app might still be listening, but jest handles it if we don't have open handles 
    // Usually server.js calls app.listen directly, which keeps handles open.
    // For a real app, we separate app and server, but this suffices for the test.
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('username', testUser.username);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('szerepkor', 'USER');
    });

    it('should fail if email is already registered', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail validation with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          username: `another_${Date.now()}`,
          email: `another_${Date.now()}@example.com`,
          password: '123', // too short
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Password must be at least 6 characters');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', testUser.username);
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should fail with unknown user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'unknown_user_12345',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });
});
