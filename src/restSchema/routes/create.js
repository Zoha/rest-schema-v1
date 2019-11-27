const collect = require("collect.js");
const convert = require("../../typeConverter");
const { body } = require("../../validate");
const routeMiddleware = require("../routeMiddleware");
const resultFields = require("../resultFields");
const checkUniqueFields = require("../checkUniqueFields");
const doValidations = require("../doValidations");
const hook = require("../hook");
const getFromSchema = require("../getFromSchema");
const _ = require("lodash");
const getFieldsFromRequest = require("../getFieldsFromRequest");
const getOnlySelectedFields = require("../getOnlySelectedFields");

const getCreatableFields = originalFields => {
  let fields = _.cloneDeep(originalFields);
  let creatableFields = {};
  for (let fieldKey in fields) {
    let field = fields[fieldKey];

    if (field.creatable !== false) {
      creatableFields[fieldKey] = field;
      if (field.isBranched) {
        creatableFields[fieldKey].branches = getCreatableFields(field.branches);
      }
    }
  }
  return creatableFields;
};

module.exports = schema => {
  const router = require("express").Router();

  router.post(
    "/",
    routeMiddleware(schema.middleware, "create"),
    async (req, res, next) => {
      try {
        const { routeFields, model, fields, route } = await getFromSchema(
          schema,
          req,
          "create"
        );

        await hook("before", { schema, req, fields, route, res });

        if (await doValidations(req, res, fields, body, route)) {
          return;
        }

        if (await checkUniqueFields(req, res, fields, model, schema, route)) {
          return;
        }

        // create the record
        const creatableFields = getCreatableFields(fields);
        const record = await model.create(
          await getFieldsFromRequest(
            req,
            creatableFields,
            route,
            req.body,
            {},
            schema,
            fields
          )
        );

        const result = await resultFields(
          req,
          routeFields,
          route,
          record,
          schema,
          fields
        );

        const response = getOnlySelectedFields({ req, fields: result });

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
