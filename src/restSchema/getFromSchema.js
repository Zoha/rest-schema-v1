const formatFields = require("./formatFields");
const getRouteFields = require("./getRouteFields");

module.exports = async (schema, req, route) => {
  const fields = await formatFields(schema.fields, req, schema, route);
  const routeFields = getRouteFields(fields, route);
  const { model } = schema;
  schema.routeFields = routeFields;
  schema.fields = fields;
  schema.route = route;
  return {
    routeFields,
    routeKeys: schema.routeKeys,
    schema,
    fields,
    model,
    route
  };
};
