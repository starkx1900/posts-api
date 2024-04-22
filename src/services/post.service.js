import Post from '../database/schema/post.schema.js';
import { ErrorWithStatus } from '../exceptions/error-with-status.exception.js';

export const getPost = async (postId) => {
  const post = await Post.findById(postId).populate('user', '-password');
  return post;
};

export const getAllPosts = async (
  page = 1,
  limit = 20,
  orderBy = 'createdAt',
  order = 'desc'
) => {
  try {
    const skip = (page - 1) * limit;
    const posts = await Post.find()
      .populate('user', '-password')
      .skip(skip)
      .limit(limit)
      .sort([[orderBy, order]]);
    const total = await Post.countDocuments();
    return { data: posts, meta: { page, limit, total } };
  } catch (error) {
    console.log(error);
    throw new ErrorWithStatus(error.message, error.status || 500);
  }
};

export const create = async (userId, title, body) => {
  // Check if post with same title exists
  const post = await Post.findOne({ title });
  if (post) {
    throw new ErrorWithStatus('Post already with the title exists', 400);
  }

  // Create new post
  const newPost = await new Post({
    title,
    body,
    user: userId,
  }).populate('user', '-password');
  await newPost.save();

  return newPost;
};

export const updatePost = async (userId, postId, payload) => {
  try {
    const postExists = await Post.findById(postId);
    console.log('Post exists', postExists);
    if (!postExists) throw new ErrorWithStatus('Post not found', 404);

    const post = await Post.findOneAndUpdate(
      { _id: postId, user: userId },
      { $set: payload },
      { new: true }
    ).populate('user', '-password');

    if (!post) throw new ErrorWithStatus('Unauthorized', 401);
    return post;
  } catch (error) {
    if (error.code === 11000) {
      throw new ErrorWithStatus('Post with same title already exists', 400);
    }
    throw new ErrorWithStatus(error.message, error.status || 500);
  }
};

export const deletePost = async (userId, postId) => {
  try {
    const postExists = await Post.findById(postId);
    if (!postExists) throw new ErrorWithStatus('Post not found', 404);

    const post = await Post.findOneAndDelete({
      _id: postId,
      user: userId,
    });

    if (!post) throw new ErrorWithStatus('Unauthorized', 401);
    return post;
  } catch (error) {
    throw new ErrorWithStatus(error.message, error.status || 500);
  }
};
