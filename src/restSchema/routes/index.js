const collect = require("collect.js");
const { query } = require("../../validate");
const filter = require("../../filter");
const routeMiddleware = require("../routeMiddleware");
const resultFields = require("../resultFields");
const doValidations = require("../doValidations");
const hook = require("../hook");
const getFromSchema = require("../getFromSchema");
const getOnlySelectedFields = require("../getOnlySelectedFields");

module.exports = schema => {
  const router = require("express").Router();

  router.get(
    "/",
    routeMiddleware(schema.middleware, "index"),
    async (req, res, next) => {
      try {
        const { routeFields, model, fields, route } = await getFromSchema(
          schema,
          req,
          "index"
        );

        await hook("before", { schema, req, fields, route, res });

        if (await doValidations(req, res, fields, query, route)) {
          return;
        }

        // get paginate paginationResult
        // for paginate we using filter module and paginate plugin for mongoose

        const paginationResult = await filter(model, req, {
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
            ...(schema.filters.index
              ? typeof schema.filters.index === "function"
                ? await schema.filters.index({
                    req,
                    schema,
                    fields,
                    route
                  })
                : schema.filters.index
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

        const docs = [];
        for (let record of paginationResult["docs"]) {
          docs.push(
            await resultFields(req, routeFields, route, record, schema, fields)
          );
        }
        paginationResult["docs"] = docs;

        const range = {
          start: paginationResult.offset
            ? paginationResult.offset
            : (paginationResult.page - 1) * paginationResult.limit,
          end: paginationResult.offset
            ? paginationResult.offset + paginationResult.docs.length
            : (paginationResult.page - 1) * paginationResult.limit +
              paginationResult.docs.length
        };

        const result = paginationResult.docs;

        const response = result.map(i => {
          return getOnlySelectedFields({ fields: i, req });
        });

        await hook("beforeResponse", {
          schema,
          req,
          fields,
          route,
          result,
          response,
          paginationResult,
          res
        });

        res
          .set({
            "x-total": paginationResult.totalDocs,
            "x-range": `${range.start}-${range.end}/${paginationResult.totalDocs}`,
            "x-limit": paginationResult.limit,
            "x-offset": paginationResult.offset,
            "x-page": paginationResult.page,
            "x-prev-page": paginationResult.prevPage,
            "x-next-page": paginationResult.nextPage,
            "x-has-prev-page": paginationResult.hasPrevPage,
            "x-has-next-page": paginationResult.hasNextPage,
            "x-total": paginationResult.totalDocs,
            "Access-Control-Expose-Headers":
              "x-total, x-range, x-limit, x-offset, x-page, x-prev-page, x-next-page, x-total , x-has-next-page, x-has-prev-page"
          })
          .json(response);

        await hook("after", {
          schema,
          req,
          fields,
          route,
          result,
          response,
          paginationResult
        });

        return;
      } catch (e) {
        next(e);
      }
    }
  );

  return router;
};
