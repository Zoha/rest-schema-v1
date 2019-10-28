const {
    validationResult,
    body,
    check,
    param,
    query
} = require("express-validator");

module.exports.validate = validations => {
    return [
        validations,
        (req, res, next) => {
            // validation check
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).send({
                    message: "some input validations failed",
                    validations: errors.array()
                });
            }
            next();
        }
    ];
};

module.exports.body = body;
module.exports.check = check;
module.exports.param = param;
module.exports.query = query;
