import { Router } from 'express';
import * as postController from '../controllers/post.controller.js';
import { generateMiddleWare } from '../middleware/route.middleware.js';
import {
  createPostSchema,
  updatePostSchema,
} from '../validation/post.validation.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const postRoute = Router();

postRoute.get('/', postController.getAllPosts);
postRoute.get('/:id', postController.getPost);
postRoute.post(
  '/',
  authMiddleware,
  generateMiddleWare(createPostSchema),
  postController.createPost
);
postRoute.patch(
  '/:id',
  authMiddleware,
  generateMiddleWare(updatePostSchema),
  postController.updatePost
);
postRoute.delete('/:id', authMiddleware, postController.deletePost);

export default postRoute;
