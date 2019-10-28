const convert = require("../typeConverter");

module.exports = async (req, model, routeKeys, fields, schema, type) => {
    return await model.findOne({
        $or: routeKeys.map(i => ({
            [i]: convert(req.params.id).to(
                fields[i] ? fields[i].type || String : String
            )
        })),
        ...(schema.filters.global
            ? typeof schema.filters.global === "function"
                ? await schema.filters.global({ req, schema, fields, type })
                : schema.filters.global
            : {}),
        ...(schema.filters[type]
            ? typeof schema.filters[type] === "function"
                ? await schema.filters[type]({ req, schema, fields, type })
                : schema.filters[type]
            : {})
    });
};
