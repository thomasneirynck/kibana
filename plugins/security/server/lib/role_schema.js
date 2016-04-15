import Joi from 'joi';

export default {
  name: Joi.string().required(),
  cluster: Joi.array().items(Joi.string()),
  indices: Joi.array().items({
    names: Joi.array().items(Joi.string()),
    fields: Joi.array().items(Joi.string()),
    privileges: Joi.array().items(Joi.string()),
    query: Joi.string().allow('')
  }),
  run_as: Joi.array().items(Joi.string())
};
