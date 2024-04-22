import Joi from 'joi';

export const createPostSchema = Joi.object({
  title: Joi.string().min(4).required(),
  body: Joi.string().min(10).required(),
});

export const updatePostSchema = Joi.object({
  title: Joi.string().min(4),
  body: Joi.string().min(10),
});
