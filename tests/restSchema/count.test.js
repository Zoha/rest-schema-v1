const app = require("express")();
const request = require("supertest");
const resource = require("../../src/restSchema");
const mongoose = require("../../src/mongoose");
const { expect } = require("chai");
const mongoosePaginate = require("mongoose-paginate-v2");
const bodyParser = require("body-parser");

// define temp model
const schema = new mongoose.Schema({
    name: String
});
schema.plugin(mongoosePaginate);
const Model = mongoose.model("Schema6", schema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// define temp routes
app.use(
    "/default",
    resource({
        model: mongoose.model("Schema6"),
        fields: {
            name: {
                type: String
            }
        },
        routes: ["count"]
    })
);

describe("count route of schema resource", () => {
    beforeEach(async () => {
        await Model.deleteMany({});
    });

    it("it will return total count of docs", async () => {
        await Model.create({
            name: "name"
        });
        await Model.create({
            name: "name2"
        });
        await Model.create({
            name: "name3"
        });
        await request(app)
            .get("/default/count?limit=1&page=2")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.an("object");
                expect(response).to.haveOwnProperty("total");
                expect(response.total).to.be.equal(3);
            });
    });
});
