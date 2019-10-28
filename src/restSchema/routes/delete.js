const routeMiddleware = require("../routeMiddleware");
const resultFields = require("../resultFields");
const findRecord = require("../findRecord");
const hook = require("../hook");
const getFromSchema = require("../getFromSchema");

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
                    type
                } = await getFromSchema(schema, req, "delete");

                await hook("before", { schema, req, fields, type, res });

                // find the record from the database
                let record = await findRecord(
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

                // delete the record
                await record.deleteOne();

                const response = await resultFields(
                    req,
                    routeFields,
                    type,
                    record,
                    schema,
                    fields
                );

                await hook("beforeResponse", {
                    schema,
                    req,
                    fields,
                    type,
                    record,
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
