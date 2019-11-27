const app = require("express")();
const request = require("supertest");
const resource = require("../../src/restSchema");
const mongoose = require("../../src/mongoose");
const { expect } = require("chai");
const mongoosePaginate = require("mongoose-paginate-v2");

// define temp model
const schema = new mongoose.Schema({
  name: String,
  hide1: String,
  hide2: String,
  hide3: String,
  boolean: String,
  somethingElse: String,
  custom: String,
  id: {
    type: Number,
    default: 1
  }
});
schema.plugin(mongoosePaginate);
const Model = mongoose.model("Schema2", schema);

// define temp routes
app.use(
  "/default",
  resource({
    model: mongoose.model("Schema2"),
    fields: async ({ req, schema, route }) => {
      return {
        name: {
          type: String
        },
        hide1: {
          type: String,
          hide: {
            global: true
          }
        },
        hide2: {
          type: String,
          hide: {
            single: true
          }
        },
        hide3: {
          type: String,
          hide: {
            index: true
          },
          get: "hide3"
        },
        boolean: {
          type: Boolean
        },
        id: {
          type: Number,
          get: 1,
          set: 1
        },
        custom: {
          type: String,
          get: (value, { req, record, route }) => {
            return "custom_" + record.name;
          },
          set: (value, { req, record, route }) => {
            return "custom_" + record.name;
          }
        }
      };
    },
    routeKeys: ["name", "id"]
  })
);

describe("single route of schema resource", () => {
  beforeEach(async () => {
    await Model.deleteMany({});
  });

  it("check that wrong key will return 404 error", async () => {
    let record = await Model.create({
      name: "name",
      somethingElse: "somethingElse"
    });
    await request(app)
      .get("/default/somethingElse")
      .expect(404);
  });

  it("it will return fields that are in schema", async () => {
    let record = await Model.create({
      name: "name",
      somethingElse: "somethingElse"
    });
    await request(app)
      .get("/default/name")
      .expect(200)
      .expect("Content-type", /json/)
      .expect(res => {
        const response = JSON.parse(res.text);
        expect(response).to.be.an("object");
        expect(response).to.haveOwnProperty("name");
        expect(response.name).to.be.equal("name");
        expect(response).to.not.haveOwnProperty("somethingElse");
      });
  });

  it("will hide properties that are hidden in global or single", async () => {
    let record = await Model.create({
      id: 1,
      name: "name",
      hide1: "hide1",
      hide2: "hide2"
    });
    await request(app)
      .get("/default/1")
      .expect(200)
      .expect("Content-type", /json/)
      .expect(res => {
        const response = JSON.parse(res.text);
        expect(response).to.be.an("object");
        expect(response).to.haveOwnProperty("name");
        expect(response.name).to.be.equal("name");
        expect(response).to.haveOwnProperty("hide3");
        expect(response).to.not.haveOwnProperty("hide1");
        expect(response).to.not.haveOwnProperty("hide2");
      });
  });

  it("will convert properties to given type in result", async () => {
    let record = await Model.create({
      name: "name",
      boolean: "boolean"
    });
    await request(app)
      .get("/default/name")
      .expect(200)
      .expect("Content-type", /json/)
      .expect(res => {
        const response = JSON.parse(res.text);
        expect(response).to.be.an("object");
        expect(response).to.haveOwnProperty("boolean");
        expect(response.boolean).to.be.a("boolean");
        expect(response.boolean).to.be.equal(true);
      });
  });

  it("will return custom values for properties that have it", async () => {
    let record = await Model.create({
      name: "name"
    });
    await request(app)
      .get("/default/name")
      .expect(200)
      .expect("Content-type", /json/)
      .expect(res => {
        const response = JSON.parse(res.text);
        expect(response).to.be.an("object");
        expect(response).to.haveOwnProperty("custom");
        expect(response.custom).to.be.equal("custom_name");
      });
  });

  it("it will return selected fields only", async () => {
    let record = await Model.create({
      name: "name",
      somethingElse: "somethingElse"
    });
    await request(app)
      .get("/default/name?select=somethingElse")
      .expect(200)
      .expect("Content-type", /json/)
      .expect(res => {
        const response = JSON.parse(res.text);
        expect(response).to.be.an("object");
        expect(response).to.not.haveOwnProperty("name");
        expect(response).to.not.haveOwnProperty("somethingElse");
      });
  });
});
