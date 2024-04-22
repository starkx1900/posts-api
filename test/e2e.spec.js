import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect } from '../src/database/connection.js';
import app from '../src/app.js';

// const TEST_DB = "mongodb://localhost:55003/alt_app_test";

describe('E2E tests', () => {
  let mongodb, accessToken, postId;
  const fakePostId = '662436698e385002e6a2e316';

  const samplePostData = {
    title: 'First Post',
    body: 'Lorem ipsum dolor sit amet, consectetur adip id el aspect et non proident',
  };

  const clearDB = async () => {
    if (mongodb) {
      const collections = await mongodb.connection.db.collections();
      for (let collection of collections) {
        await collection.deleteMany();
      }
    }
  };

  beforeAll(async () => {
    const mongoServer = await MongoMemoryServer.create();
    const TEST_DB = mongoServer.getUri();
    mongodb = await connect(TEST_DB);
  });

  beforeEach(async () => {
    // jest.resetAllMocks();
  });

  afterAll(async () => {
    await mongodb.connection.close();
  });

  it('should not be able to login', async () => {
    await clearDB();
    const res = await request(app).post('/auth/login').send({
      email: 'test@yopmail.com',
      password: 'password',
    });
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('Username or Password is incorrect');
  });

  it('should be able to register', async () => {
    await clearDB();
    const res = await request(app).post('/auth/register').send({
      name: 'Test User',
      email: 'test@yopmail.com',
      password: 'password',
      confirmPassword: 'password',
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('User created successfully');
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user).toHaveProperty('name');
    expect(res.body.data.user.name).toEqual('Test User');
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).toHaveProperty('email');
    expect(res.body.data.user.email).toEqual('test@yopmail.com');
  });

  it('should be able to login', async () => {
    // to set header add .set({ 'Authorization': 'Bearer ' + token }) before .send
    await clearDB();
    mongodb.connection.db.collection('users').insertOne({
      email: 'test@yopmail.com',
      password: await bcrypt.hash('password', 10),
    });

    const res = await request(app).post('/auth/login').send({
      email: 'test@yopmail.com',
      password: 'password',
    });
    accessToken = res.body.data.accessToken;

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Login successful');
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('should not be able to login - invalid payload', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'test@yopmail.com',
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Validation error');
    expect(res.body).toHaveProperty('errors');
  });

  it('should return empty post list - no post post', async () => {
    const res = await request(app).get('/posts');

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Get all posts');
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(res.body.meta.total).toEqual(0);
  });

  it('should not return a post - post does not exists', async () => {
    const res = await request(app).get(`/posts/${fakePostId}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual('Post not found');
    expect(res.body).not.toHaveProperty('data');
  });

  it('should not be able to create post - unauthenticated user', async () => {
    const res = await request(app).post('/posts').send(samplePostData);

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('Unauthorized');
  });

  it('should be able to create post - missing required fields', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        body: 'This is a test post post',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Validation error');
    expect(res.body).toHaveProperty('errors');
    expect(res.body).not.toHaveProperty('data');
  });

  it('should be able to create post - authenticated user', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(samplePostData);

    postId = res.body.data.post.id;

    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toEqual('Post created successfully');
    expect(res.body.data.post).toHaveProperty('id');
    expect(res.body.data.post).toHaveProperty('user');
    expect(res.body.data.post.title).toEqual(samplePostData.title);
  });

  it('should not create post - duplicate title', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(samplePostData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Post already with the title exists');
  });

  it('should not update post - unauthenticated user', async () => {
    const res = await request(app)
      .patch(`/posts/${postId}`)
      .send({ title: 'New post Title', body: 'This is a new post content' });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('Unauthorized');
  });

  it('should not update post - post does not exist (invalid postId)', async () => {
    const res = await request(app)
      .patch(`/posts/${fakePostId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'New post Title', body: 'This is a new post content' });

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual('Post not found');
  });

  it('should update post - authenticated user', async () => {
    const res = await request(app)
      .patch(`/posts/${postId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'New post Title', body: 'This is a new post content' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.post).toHaveProperty('user');
    expect(res.body.data.post.title).toEqual('New post Title');
    expect(res.body.data.post.body).toEqual('This is a new post content');
    expect(res.body.message).toEqual('Successfully updated Post');
  });

  it('should not delete the post - unauthenticated user', async () => {
    const res = await request(app).delete(`/posts/${postId}`);

    expect(res.statusCode).toEqual(401);
    expect(res.body).not.toHaveProperty('data');
  });

  it('should delete the post - authenticated user', async () => {
    const res = await request(app)
      .delete(`/posts/${postId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toEqual(204);
    expect(res.body).toEqual({});
  });
});
