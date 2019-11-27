const routeMiddleware = require("../routeMiddleware");
const resultFields = require("../resultFields");
const findRecord = require("../findRecord");
const hook = require("../hook");
const getFromSchema = require("../getFromSchema");
const getOnlySelectedFields = require("../getOnlySelectedFields");

module.exports = schema => {
  const router = require("express").Router();

  router.delete(
    "/:id",
    routeMiddleware(schema.middleware, "delete"),
    async (req, res, next) => {
      try {
        const {
          routeFields,
          model,
          fields,
          routeKeys,
          route
        } = await getFromSchema(schema, req, "delete");

        await hook("before", { schema, req, fields, route, res });

        // find the record from the database
        let record = await findRecord(
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

        // delete the record
        await record.deleteOne();

        const result = await resultFields(
          req,
          routeFields,
          route,
          record,
          schema,
          fields
        );

        const response = getOnlySelectedFields({
          req,
          fields: result
        });

        await hook("beforeResponse", {
          schema,
          req,
          fields,
          route,
          result,
          record,
          response,
          res
        });

        res.json(response);

        await hook("after", {
          schema,
          req,
          fields,
          route,
          result,
          record,
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
