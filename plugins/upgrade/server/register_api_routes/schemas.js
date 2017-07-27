import Joi from 'joi';


export const indexNameSchema = Joi.string()
  .regex(/^[^\\/?"<>| ,*]+$/);

export const taskIdSchema = Joi.string();
