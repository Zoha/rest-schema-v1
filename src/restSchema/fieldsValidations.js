const collect = require("collect.js");
const convert = require("../typeConverter");
const { query } = require("../validate");

const convertToFieldType = field => {
  return value => {
    value = convert(value).to(field.type || String);

    // convert branches
    if (field.isBranched) {
      for (let branchKey in field.branches) {
        let fieldOptionsKey = branchKey;
        if (field.isArrayBranched) {
          fieldOptionsKey = 0;
        }
        if(value[branchKey] !== undefined){
            value[branchKey] = convertToFieldType(field.branches[fieldOptionsKey])(
                value[branchKey]
            );
        }
        
      }
    }
    return value;
  };
};

const applyCustomSanitizers = field => {
  return (value, options) => {
    if (field.sanitize) {
      value = field.sanitize(value, options);
    }

    if (field.isBranched) {
      for (let branchKey in field.branches) {
        let fieldOptionsKey = branchKey;
        if (field.isArrayBranched) {
          fieldOptionsKey = 0;
        }
          if (value[branchKey] !== undefined){
              value[branchKey] = applyCustomSanitizers(
                  field.branches[fieldOptionsKey]
              )(value[branchKey], options);
          }
        
      }
    }

    return value;
  };
};

const applyCustomValidations = async field => {
  return async (value, options) => {
    if (field.validate) {
      if (field.validate[Symbol.toStringTag] === "AsyncFunction") {
        await field.validate(value, options);
      } else {
        result = field.validate(value, options);
        if (!result) {
          throw new Error("invalid input");
        }
      }
    }

    if (field.isBranched) {
      for (let branchKey in field.branches) {
        let fieldOptionsKey = branchKey;
        if (field.isArrayBranched) {
          fieldOptionsKey = 0;
        }
          if (value[branchKey] !== undefined){
              const validation = await applyCustomValidations(
                  field.branches[fieldOptionsKey]
              );
              await validation(value[branchKey], options);
          }
        
      }
    }
  };
};

module.exports = async (fields, check, route) => {
  const validations = [];
  for (let key in fields) {
    let field = fields[key];
    let validation = check(key);
    const isGetRequest = route === "count" || route === "index";

    // check that field is required or not
    if (field.required && !isGetRequest) {
      validation = validation.exists({ checkNull: true });
    } else {
      validation = validation.optional();
    }

    // convert to expected route
    // if route of check is query (index and count)
    // convert will not be applied now.
    // because of operators and array logic
    // convert will happened in filter module
    if (!isGetRequest) {
      validation = validation.customSanitizer(convertToFieldType(field));
    }

    // sanitize
    if ((field.sanitize || field.isBranched) && !isGetRequest) {
      // if field has sanitizer apply it
      validation = validation.customSanitizer(applyCustomSanitizers(field));
    }

    // custom validations
    if ((field.validate || field.isBranched) && !isGetRequest) {
      validation = validation.custom(await applyCustomValidations(field));
    }

    validations.push(validation);
  }
  return validations;
};
