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
                    type
                } = await getFromSchema(schema, req, "single");

                await hook("before", { schema, req, fields, type, res });

                const record = await findRecord(
                    req,
                    model,
                    routeKeys,
                    fields,
                    schema,
                    type
                );

                if (!record) {
                    return next();
                }

                const result = await resultFields(
                    req,
                    routeFields,
                    type,
                    record,
                    schema,
                    fields
                );

                const response = getOnlySelectedFields({ fields: result, req });

                await hook("beforeResponse", {
                    schema,
                    req,
                    fields,
                    type,
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
                    type,
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
