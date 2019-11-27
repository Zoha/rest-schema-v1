const collect = require("collect.js");
const { query } = require("../../validate");
const filter = require("../../filter");
const routeMiddleware = require("../routeMiddleware");
const doValidations = require("../doValidations");
const hook = require("../hook");
const getFromSchema = require("../getFromSchema");

module.exports = schema => {
  const router = require("express").Router();

  router.get(
    "/count",
    routeMiddleware(schema.middleware, "count"),
    async (req, res, next) => {
      try {
        const { routeFields, model, fields, route } = await getFromSchema(
          schema,
          req,
          "count"
        );

        await hook("before", { schema, req, fields, route, res });

        if (await doValidations(req, res, fields, query, route)) {
          return;
        }

        // get paginate result
        // for paginate we using filter module and paginate plugin for mongoose

        const result = await filter(model, req, {
          filters: {
            ...(schema.filters.global
              ? typeof schema.filters.global === "function"
                ? await schema.filters.global({
                    req,
                    schema,
                    fields,
                    route
                  })
                : schema.filters.global
              : {}),
            ...(schema.filters.count
              ? typeof schema.filters.count === "function"
                ? await schema.filters.count({
                    req,
                    schema,
                    fields,
                    route
                  })
                : schema.filters.count
              : {})
          },
          filterable: collect(fields)
            .filter(i => i.filterable !== false)
            .all(),
          sortable: collect(fields)
            .filter(i => i.sortable !== false)
            .keys()
            .all(),
          ...schema.paginationMeta
        });

        const response = {
          total: result.totalDocs
        };

        await hook("beforeResponse", {
          schema,
          req,
          fields,
          route,
          response,
          result,
          res
        });

        res.json(response);

        await hook("after", {
          schema,
          req,
          fields,
          route,
          response,
          result
        });

        return;
      } catch (e) {
        next(e);
      }
    }
  );

  return router;
};
