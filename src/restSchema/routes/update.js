const collect = require("collect.js");
const convert = require("../../typeConverter");
const { body } = require("../../validate");
const routeMiddleware = require("../routeMiddleware");
const resultFields = require("../resultFields");
const checkUniqueFields = require("../checkUniqueFields");
const findRecord = require("../findRecord");
const doValidations = require("../doValidations");
const hook = require("../hook");
const getFromSchema = require("../getFromSchema");
const _ = require("lodash");
const getFieldsFromRequest = require("../getFieldsFromRequest");
const getOnlySelectedFields = require("../getOnlySelectedFields");

const getUpdatableFields = originalFields => {
    let fields = _.cloneDeep(originalFields);
    let updatableFields = {};
    for (let fieldKey in fields) {
        let field = fields[fieldKey];

        if (field.updatable !== false) {
            updatableFields[fieldKey] = field;
            if (field.isBranched) {
                updatableFields[fieldKey].branches = getUpdatableFields(
                    field.branches
                );
            }
        }
    }
    return updatableFields;
};

module.exports = schema => {
    const router = require("express").Router();

    router.put(
        "/:id",
        routeMiddleware(schema.middleware, "update"),
        async (req, res, next) => {
            try {
                const {
                    routeFields,
                    model,
                    fields,
                    routeKeys,
                    type,
					route
                } = await getFromSchema(schema, req, "update");

                await hook("before", { schema, req, fields, type, res });

                if (await doValidations(req, res, fields, body, type)) {
                    return;
                }

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

                if (
                    await checkUniqueFields(
                        req,
                        res,
                        fields,
                        model,
                        schema,
                        type,
                        record
                    )
                ) {
                    return;
                }

                // update the record
                const updatableFields = getUpdatableFields(fields);
                await record.updateOne(
                    await getFieldsFromRequest(
                        req,
                        updatableFields,
                        type,
                        req.body,
                        record,
                        schema,
                        fields,
						route
                    )
                );

                record = await model.findOne({ _id: record._id });

                const result = await resultFields(
                    req,
                    routeFields,
                    type,
                    record,
                    schema,
                    fields
                );

                const response = getOnlySelectedFields({
                    fields: result,
                    req
                });

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
