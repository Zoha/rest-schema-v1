const routeMiddleware = require("../routeMiddleware");
const resultFields = require("../resultFields");
const findRecord = require("../findRecord");
const hook = require("../hook");
const getFromSchema = require("../getFromSchema");
const getOnlySelectedFields = require("../getOnlySelectedFields");

module.exports = schema => {
  const router = require("express").Router();

  router.get(
    "/:id",
    routeMiddleware(schema.middleware, "single"),
    async (req, res, next) => {
      try {
        const {
          routeFields,
          model,
          fields,
          routeKeys,
          route
        } = await getFromSchema(schema, req, "single");

        await hook("before", { schema, req, fields, route, res });

        const record = await findRecord(
          req,
          model,
          routeKeys,
          fields,
          schema,
          route
        );

        if (!record) {
          return next();
        }

        const result = await resultFields(
          req,
          routeFields,
          route,
          record,
          schema,
          fields
        );

        const response = getOnlySelectedFields({ fields: result, req });

        await hook("beforeResponse", {
          schema,
          req,
          fields,
          route,
          record,
          result,
          response,
          res
        });

        res.json(response);

        await hook("after", {
          schema,
          req,
          fields,
          route,
          record,
          result,
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
