import Joi from 'joi';

export default {
  username: Joi.string().required(),
  password: Joi.string().required(),
  roles: Joi.array().items(Joi.string())
};
