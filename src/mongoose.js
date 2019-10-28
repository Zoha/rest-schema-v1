const mongoose = require("mongoose");

mongoose.Promise = global.Promise;
mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false);
mongoose.connect("mongodb://127.0.0.1:27017/rest-schema", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

module.exports = mongoose;
