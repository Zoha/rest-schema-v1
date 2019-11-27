const convert = require("../typeConverter");

module.exports = async (req, model, routeKeys, fields, schema, route) => {
  return await model.findOne({
    $or: routeKeys.map(i => ({
      [i]: convert(req.params.id).to(
        fields[i] ? fields[i].type || String : String
      )
    })),
    ...(schema.filters.global
      ? typeof schema.filters.global === "function"
        ? await schema.filters.global({ req, schema, fields, route })
        : schema.filters.global
      : {}),
    ...(schema.filters[route]
      ? typeof schema.filters[route] === "function"
        ? await schema.filters[route]({ req, schema, fields, route })
        : schema.filters[route]
      : {})
  });
};
