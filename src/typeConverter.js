const types = require("mongoose").Schema.Types;
const ObjectId = require("mongoose").Types.ObjectId;

module.exports = value => {
    return {
        to: to => {
            if (value === undefined) {
                return undefined;
            }
            switch (to) {
                case Boolean:
                    if (typeof value === "string" && value === "false") {
                        return false;
                    }
                    return !!value;
                case Object:
                    if (typeof value === "object") {
                        return value;
                    }
                    return { value };
                case String:
                    return typeof value === "string"
                        ? value
                        : value.toString
                        ? value.toString()
                        : undefined;
                case Number:
                    return parseInt(value) ? parseInt(value) : null;
                case Array:
                    return Array.isArray(value) ? value : [value];
                case types.ObjectId:
                    return ObjectId.isValid(value)
                        ? ObjectId(value)
                        : ObjectId();
                case "ignore":
                default:
                    return value;
            }
        }
    };
};
