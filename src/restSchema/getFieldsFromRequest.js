const convert = require("../typeConverter");

const getFieldsFromRequest = async (
  req,
  validFields,
  route,
  body,
  record,
  schema,
  fields,
  isArray = false
) => {
  let result = {};
  if (isArray) {
    result = [];
  }
  for (let fieldName in validFields) {
    const field = validFields[fieldName];
    let value;

    if (body && (body[fieldName] || field.type === Boolean)) {
      value = convert(body[fieldName]).to(field.type || String);
    }
    if (value && field.isBranched) {
      let branches = field.branches;
      if (field.isArrayBranched) {
        branches = [];
        for (let i = 0; i < value.length; i++) {
          branches.push(field.branches[0]);
        }
      }
      value = await getFieldsFromRequest(
        req,
        branches,
        route,
        value,
        record,
        schema,
        fields,
        !!field.isArrayBranched
      );
    }
    if (field.set) {
      if (typeof field.set === "function") {
        value = await field.set(value, {
          req,
          schema,
          fields,
          record,
          route
        });
      } else {
        value = field.set;
      }
    } else if (!value && field.required) {
      throw new Error(`${fieldName} not exists in body`);
    }
    result[fieldName] = value;
  }
  return result;
};

module.exports = getFieldsFromRequest;
