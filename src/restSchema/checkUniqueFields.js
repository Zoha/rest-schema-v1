const collect = require("collect.js");

module.exports = async (
  req,
  res,
  fields,
  model,
  schema,
  route,
  record = null
) => {
  // find by unique values
  // and if is there any duplicate of unique values
  // 400 response with error messages like validation error
  // and return true
  const uniqueRouteFields = collect(fields)
    .filter(i =>
      route === "update"
        ? i.updatable !== false
        : route === "create"
        ? i.creatable !== false
        : true
    )
    .filter(i => i.unique)
    .keys()
    .map(i => ({ [i]: req.body[i] }))
    .all();
  if (uniqueRouteFields.length) {
    const recordsWithUniqueValues = await model.find({
      ...(record ? { _id: { $ne: record._id } } : {}),
      $or: uniqueRouteFields,
      ...(schema.filters.global
        ? typeof schema.filters.global === "function"
          ? await schema.filters.global({
              req,
              schema,
              fields,
              route,
              record
            })
          : schema.filters.global
        : {}),
      ...(schema.filters[route]
        ? typeof schema.filters[route] === "function"
          ? await schema.filters[route]({
              req,
              schema,
              fields,
              route,
              record
            })
          : schema.filters[route]
        : {})
    });
    if (recordsWithUniqueValues.length) {
      validations = [];
      const uniqueFields = collect(fields)
        .filter(i => i.unique)
        .all();
      for (let uniqueField in uniqueFields) {
        let duplicateWithThisUniqueField = recordsWithUniqueValues.filter(
          i => i[uniqueField] === req.body[uniqueField]
        );

        if (duplicateWithThisUniqueField.length) {
          validations.push({
            location: "body",
            msg: `this ${uniqueField} already exists`,
            param: uniqueField
          });
        }
      }
      res.status(400).json({
        message: "some input validations failed",
        validations
      });
      return true;
    }
    return false;
  }
};
