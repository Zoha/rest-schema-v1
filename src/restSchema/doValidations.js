const { validationResult } = require("express-validator");
const fieldsValidations = require("./fieldsValidations");

module.exports = async (req, res, fields, check, type) => {
    for (let validation of await fieldsValidations(fields, check, type)) {
        await new Promise(async (resolve, reject) => {
            await validation(req, res, e => {
                if (e) {
                    return reject(e);
                }
                resolve();
            });
        });
    }
    // validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            message: "some input validations failed",
            validations: errors.array()
        });
        return true;
    }
    return false;
};
