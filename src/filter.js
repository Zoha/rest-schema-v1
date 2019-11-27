const _ = require("lodash");
const convert = require("./typeConverter");
const decode = require("urldecode");

const convertToFieldType = (value, { type }) => {
  return convert(value).to(type || String);
};

module.exports = async (
  model,
  req,
  {
    filters,
    defaultFilters,
    filterable,
    sortable,
    sort,
    limit,
    minLimit,
    maxLimit
  }
) => {
  let finalFilters = _.cloneDeep(defaultFilters) || {};

  // filters
  for (let fieldKey in filterable) {
    if (req.query[fieldKey]) {
      let field = filterable[fieldKey];

      if (/^\/.+\/.*$/.test(req.query[fieldKey])) {
        let regexResult = /^\/(.+)\/(.*)$/.exec(req.query[fieldKey]);
        finalFilters[fieldKey] = new RegExp(
          regexResult[1],
          regexResult[2] || ""
        );
      } else if (/^(gte?|lte?|ne|n?in|has)\:(.+)$/.test(req.query[fieldKey])) {
        let regexResult = /^(gte?|lte?|ne|n?in|has)\:(.+)$/.exec(
          req.query[fieldKey]
        );
        let value;
        if (["in", "nin"].includes(regexResult[1])) {
          let items = regexResult[2].split(",");
          value = [];
          for (let item of items) {
            value.push(convertToFieldType(decode(item), field));
          }
        } else {
          value = convertToFieldType(decode(regexResult[2]), field);
        }

        if (regexResult[1] === "has" && field.type === Array) {
          if (field.branches && field.branches[0] && field.branches[0].type) {
            value[0] = convertToFieldType(value[0], field.branches[0]);
          }
          finalFilters[fieldKey] = value[0];
        } else {
          finalFilters[fieldKey] = {
            ["$" + regexResult[1]]: value
          };
        }
      } else {
        finalFilters[fieldKey] = convertToFieldType(
          decode(req.query[fieldKey]),
          field
        );
      }
    }
  }

  // sorts
  if (req.query.sort) {
    let sortsArray = [];
    let requestedSorts = req.query.sort.split(" ");
    for (let requestedSort of requestedSorts) {
      if (sortable.includes(requestedSort.replace(/^\-/, ""))) {
        let orderOperator = "";
        if (/^\-/.test(requestedSort)) {
          orderOperator = "-";
        }
        sortsArray.push(orderOperator + requestedSort.replace(/^\-/, ""));
      }
    }
    sort = sortsArray.join(" ");
  }

  // limit
  limit =
    req.query.limit &&
    parseInt(req.query.limit) >= minLimit &&
    parseInt(req.query.limit) <= maxLimit
      ? parseInt(req.query.limit)
      : limit;

  return await model.paginate(
    {
      ...finalFilters,
      ...filters
    },
    {
      sort,
      limit,
      ...(req.query.page
        ? { page: req.query.page }
        : req.query.offset
        ? { offset: req.query.offset }
        : { page: 1 })
    }
  );
};
