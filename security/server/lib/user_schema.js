import Joi from 'joi';

export default {
  username: Joi.string().required(),
  password: Joi.string().required(),
  roles: Joi.array().items(Joi.string()),
  full_name: Joi.string().allow(null).allow(''),
  email: Joi.string().allow(null).allow(''),
  metadata: Joi.object()
};
