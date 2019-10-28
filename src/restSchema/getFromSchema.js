const formatFields = require("./formatFields");
const getRouteFields = require("./getRouteFields");

module.exports = async (schema, req, type) => {
    const fields = await formatFields(schema.fields, req, schema, type);
    const routeFields = getRouteFields(fields, type);
    const { model } = schema;
    schema.routeFields = routeFields;
    schema.fields = fields;
    schema.type = type;
    return {
        routeFields,
        routeKeys: schema.routeKeys,
        schema,
        fields,
        model,
        type
    };
};
