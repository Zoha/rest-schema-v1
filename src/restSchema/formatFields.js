const collect = require("collect.js");

isObject = function(a) {
  return !!a && a.constructor === Object;
};
isArray = function(a) {
  return !!a && a.constructor === Array;
};

const formatFields = async (fields, req, schema, route) => {
  if (typeof fields === "function") {
    fields = await fields({ req, schema, route: "create" });
  }

  let formattedFields = isObject(fields) ? {} : [];
  for (let fieldKey in fields) {
    let field = fields[fieldKey];
    if (!isObject(field) && !isArray(field)) {
      field = {
        type: field
      };
    } else if (isObject(field.type) || isArray(field.type)) {
      field.isBranched = true;
      field.isArrayBranched = isArray(field.type);
      field.isObjectBranched = isObject(field.type);
      field.branches = await formatFields(field.type, req, schema, route);
      field.type = isObject(field.type) ? Object : Array;
    }
    if (isObject(fields)) {
      formattedFields[fieldKey] = field;
    } else {
      formattedFields.push(field);
    }
  }
  return formattedFields;
};

module.exports = formatFields;
