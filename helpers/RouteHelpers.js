const Joi = require('joi');

module.exports = {
  validateBody: (schema) => {
    return (req, res, next) => {
      const result = Joi.validate(req.body, schema);

      if (result.error) {
        return res.status(400).json(result.error);
      }

      if (!req.value) req.value = {};
      req.value['body'] = result.value;
      next();
    }
  },

  schemas: {
    authSchema: Joi.object().keys({
      username: Joi.string().required(),
      password: Joi.string().required(), //Add more rules with joi
      name: Joi.string(),
      surname: Joi.string(),
    })
  },
}