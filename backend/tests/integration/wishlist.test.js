import request from 'supertest';
import app from '../../src/server.js';
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

describe('Wishlist API Integration Tests', () => {
  const testUser = {
    username: `wishlistuser_${Date.now()}`,
    email: `wishlist_${Date.now()}@example.com`,
    password: 'password123',
  };

  let token;
  let userId;

  beforeAll(async () => {
    // Register and login to get JWT token
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(regRes.status).toBe(201);
    token = regRes.body.token;
    userId = regRes.body.user.id;
  });

  afterAll(async () => {
    // Clean up wishlist and test user
    if (userId) {
      await prisma.kivansaglista.deleteMany({
        where: { felhasznalo_id: userId },
      });
      await prisma.felhasznalo.delete({
        where: { felhasznalo_id: userId },
      });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/wishlist', () => {
    it('should successfully add a book to wishlist and truncate long ISBNs', async () => {
      // 60-character dummy ISBN that exceeds the VARCHAR(50) limit
      const longIsbn = 'A'.repeat(60);

      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({
          konyv_id: `libri_test_long_isbn_${Date.now()}`,
          cim: 'Gone Girl - Test Edition',
          szerzo: 'Gillian Flynn',
          boritokep_url: 'https://example.com/cover.jpg',
          isbn: longIsbn
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('isbn');
      // Verify truncated to 50 characters
      expect(response.body.isbn).toHaveLength(50);
      expect(response.body.isbn).toBe('A'.repeat(50));

      // Also verify database record directly
      const dbItem = await prisma.kivansaglista.findUnique({
        where: {
          unique_wishlist: {
            felhasznalo_id: userId,
            konyv_id: response.body.konyv_id
          }
        }
      });
      expect(dbItem).not.toBeNull();
      expect(dbItem.isbn).toHaveLength(50);
    });

    it('should successfully add a book with standard / short ISBN', async () => {
      const response = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({
          konyv_id: `libri_test_short_isbn_${Date.now()}`,
          cim: 'Gone Girl - Normal Edition',
          szerzo: 'Gillian Flynn',
          boritokep_url: 'https://example.com/cover.jpg',
          isbn: '1234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body.isbn).toBe('1234567890');
    });

    it('should successfully add a book with categories and retrieve it with categories', async () => {
      const bookId = `libri_test_cats_${Date.now()}`;
      const postRes = await request(app)
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({
          konyv_id: bookId,
          cim: 'Jujutsu Kaisen, Vol. 3',
          szerzo: 'Gege Akutami',
          boritokep_url: 'https://example.com/cover.jpg',
          isbn: '9781974719556',
          categories: ['Comic', 'Manga']
        });

      expect(postRes.status).toBe(201);
      expect(postRes.body.categories).toEqual(['Comic', 'Manga']);

      // Get wishlist and verify categories are returned as an array
      const getRes = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(200);
      const addedItem = getRes.body.find(item => item.konyv_id === bookId);
      expect(addedItem).toBeDefined();
      expect(addedItem.categories).toEqual(['Comic', 'Manga']);
    });
  });
});
