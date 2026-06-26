import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Blog/CMS API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let categoryId: number;
  let postId: number;
  let commentId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('POST /api/auth/register - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'test@test.com', password: 'password123', role: 'reader' })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.username).toBe('testuser');
          authToken = res.body.access_token;
        });
    });

    it('POST /api/auth/register - should register an admin user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: 'admin', email: 'admin@test.com', password: 'password123', role: 'admin' })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          adminToken = res.body.access_token;
        });
    });

    it('POST /api/auth/register - should reject duplicate username', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'other@test.com', password: 'password123', role: 'reader' })
        .expect(409);
    });

    it('POST /api/auth/login - should login successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
        });
    });

    it('POST /api/auth/login - should reject wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' })
        .expect(201)
        .expect((res) => {
          expect(res.body.statusCode).toBe(401);
        });
    });

    it('GET /api/auth/profile - should return current user', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.username).toBe('testuser');
        });
    });

    it('GET /api/auth/profile - should reject unauthenticated', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });
  });

  describe('Categories', () => {
    it('POST /api/categories - admin can create category', () => {
      return request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Technology', description: 'Tech posts' })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('Technology');
          expect(res.body.slug).toBe('technology');
          categoryId = res.body.id;
        });
    });

    it('POST /api/categories - reader cannot create category', () => {
      return request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Science' })
        .expect(403);
    });

    it('GET /api/categories - public access', () => {
      return request(app.getHttpServer())
        .get('/api/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('GET /api/categories/:id - public access', () => {
      return request(app.getHttpServer())
        .get(`/api/categories/${categoryId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Technology');
        });
    });

    it('PATCH /api/categories/:id - admin can update', () => {
      return request(app.getHttpServer())
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Tech & Innovation' })
        .expect(200)
        .expect((res) => {
          expect(res.body.slug).toBe('tech-innovation');
        });
    });
  });

  describe('Posts', () => {
    it('POST /api/posts - editor can create post', () => {
      return request(app.getHttpServer())
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'First Post', content: 'Hello World', categoryId })
        .expect(201)
        .expect((res) => {
          expect(res.body.slug).toBe('first-post');
          postId = res.body.id;
        });
    });

    it('POST /api/posts - reader cannot create post', () => {
      return request(app.getHttpServer())
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Unauthorized Post', content: 'Content' })
        .expect(403);
    });

    it('GET /api/posts - public access', () => {
      return request(app.getHttpServer())
        .get('/api/posts')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('GET /api/posts - filter by status', () => {
      return request(app.getHttpServer())
        .get('/api/posts?status=published')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBe(0);
        });
    });

    it('GET /api/posts/:id - public access', () => {
      return request(app.getHttpServer())
        .get(`/api/posts/${postId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('First Post');
        });
    });

    it('PATCH /api/posts/:id - author can update', () => {
      return request(app.getHttpServer())
        .patch(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Post', status: 'published' })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Post');
          expect(res.body.slug).toBe('updated-post');
        });
    });
  });

  describe('Comments', () => {
    it('POST /api/comments - authenticated user can create', () => {
      return request(app.getHttpServer())
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Great post!', postId })
        .expect(201)
        .expect((res) => {
          expect(res.body.content).toBe('Great post!');
          commentId = res.body.id;
        });
    });

    it('POST /api/comments - unauthenticated cannot create', () => {
      return request(app.getHttpServer())
        .post('/api/comments')
        .send({ content: 'Anonymous comment', postId })
        .expect(401);
    });

    it('GET /api/comments/post/:postId - public access', () => {
      return request(app.getHttpServer())
        .get(`/api/comments/post/${postId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('PATCH /api/comments/:id - owner can update', () => {
      return request(app.getHttpServer())
        .patch(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Updated comment!' })
        .expect(200)
        .expect((res) => {
          expect(res.body.content).toBe('Updated comment!');
        });
    });

    it('DELETE /api/comments/:id - owner can delete', () => {
      return request(app.getHttpServer())
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('DELETE /api/posts/:id - author can delete', () => {
      return request(app.getHttpServer())
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Users', () => {
    it('GET /api/users - admin can list users', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('GET /api/users - reader cannot list users', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });
});
