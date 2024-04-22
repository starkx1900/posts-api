import * as postService from '../services/post.service.js';

export const getPost = async (req, res) => {
  const { id } = req.params;
  const post = await postService.getPost(id);
  if (post) {
    return res.status(200).json({
      success: true,
      message: 'Successfully retrieved Post',
      data: { post },
    });
  } else {
    return res.status(404).json({
      message: 'Post not found',
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 20;

    const { orderBy, order } = req.query;

    const { data, meta } = await postService.getAllPosts(
      page,
      limit,
      orderBy,
      order
    );
    res.json({ message: 'Get all posts', data, meta });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, body } = req.body;
    const userId = req.user._id;
    const newPost = await postService.create(userId, title, body);
    res.status(201).json({
      message: 'Post created successfully',
      data: {
        post: newPost,
      },
    });
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    console.log('Params', (userId, id, req.body));
    const post = await postService.updatePost(userId, id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Successfully updated Post',
      data: { post },
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    await postService.deletePost(userId, id);
    return res.status(204).json({});
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};
