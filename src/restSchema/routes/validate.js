const collect = require("collect.js");
const { body } = require("../../validate");
const routeMiddleware = require("../routeMiddleware");
const checkUniqueFields = require("../checkUniqueFields");
const hook = require("../hook");
const getFromSchema = require("../getFromSchema");
const _ = require("lodash");
const doValidations = require("../doValidations");

module.exports = schema => {
  const router = require("express").Router();

  router.post(
    "/validate/:field",
    routeMiddleware(schema.middleware, "validate"),
    async (req, res, next) => {
      try {
        const { model, fields, route } = await getFromSchema(
          schema,
          req,
          "validate"
        );

        const fieldsToValidate = collect(_.cloneDeep(fields))
          .filter(
            (i, k) => k === req.params.field && i.validationRoute === true
          )
          .all();

        if (!collect(fieldsToValidate).count()) {
          return next();
        }

        fieldsToValidate[req.params.field].required = true;

        await hook("before", {
          schema,
          req,
          fieldsToValidate,
          route,
          res
        });

        if (await doValidations(req, res, fieldsToValidate, body, route)) {
          return;
        }

        if (
          await checkUniqueFields(
            req,
            res,
            fieldsToValidate,
            model,
            schema,
            route
          )
        ) {
          return;
        }

        const response = {
          message: "input is valid"
        };

        await hook("beforeResponse", {
          schema,
          req,
          fields,
          route,
          response,
          res
        });

        res.json(response);

        await hook("after", {
          schema,
          req,
          fields,
          route,
          response
        });

        return;
      } catch (e) {
        next(e);
      }
    }
  );

  return router;
};
