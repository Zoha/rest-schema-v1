const collect = require("collect.js");
const { query } = require("../../validate");
const filter = require("../../filter");
const routeMiddleware = require("../routeMiddleware");
const resultFields = require("../resultFields");
const doValidations = require("../doValidations");
const hook = require("../hook");
const getFromSchema = require("../getFromSchema");

module.exports = schema => {
    const router = require("express").Router();

    router.get(
        "/",
        routeMiddleware(schema.middleware, "index"),
        async (req, res, next) => {
            try {
                const {
                    routeFields,
                    model,
                    fields,
                    type
                } = await getFromSchema(schema, req, "index");

                await hook("before", { schema, req, fields, type, res });

                if (await doValidations(req, res, fields, query, type)) {
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
                                      type
                                  })
                                : schema.filters.global
                            : {}),
                        ...(schema.filters.index
                            ? typeof schema.filters.index === "function"
                                ? await schema.filters.index({
                                      req,
                                      schema,
                                      fields,
                                      type
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
                for (let record of result["docs"]) {
                    docs.push(
                        await resultFields(
                            req,
                            routeFields,
                            type,
                            record,
                            schema,
                            fields
                        )
                    );
                }
                result["docs"] = docs;

                const range = {
                    start: result.offset
                        ? result.offset
                        : (result.page - 1) * result.limit,
                    end: result.offset
                        ? result.offset + result.docs.length
                        : (result.page - 1) * result.limit + result.docs.length
                };

                const response = result.docs;

                await hook("beforeResponse", {
                    schema,
                    req,
                    fields,
                    type,
                    response,
                    result,
                    res
                });

                res.set({
                    "x-total": result.totalDocs,
                    "x-range": `${range.start}-${range.end}/${result.totalDocs}`,
                    "x-limit": result.limit,
                    "x-offset": result.offset,
                    "x-page": result.page,
                    "x-prev-page": result.prevPage,
                    "x-next-page": result.nextPage,
                    "x-has-prev-page": result.hasPrevPage,
                    "x-has-next-page": result.hasNextPage,
                    "x-total": result.totalDocs,
                    "Access-Control-Expose-Headers":
                        "x-total, x-range, x-limit, x-offset, x-page, x-prev-page, x-next-page, x-total , x-has-next-page, x-has-prev-page"
                }).json(response);

                await hook("after", {
                    schema,
                    req,
                    fields,
                    type,
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
