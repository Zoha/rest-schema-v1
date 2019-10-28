const app = require("express")();
const request = require("supertest");
const resource = require("../../src/restSchema");
const mongoose = require("../../src/mongoose");
const { expect } = require("chai");
const mongoosePaginate = require("mongoose-paginate-v2");
const moment = require("moment");

// define temp model
const schema = new mongoose.Schema({
    name: String,
    hide1: String,
    hide2: String,
    notFilterable: String,
    boolean: Boolean,
    notSortable: String,
    array: Array,
    number: Number,
    date: Date
});
schema.plugin(mongoosePaginate);
const Model = mongoose.model("Schema", schema);

// define temp routes
app.use(
    "/default",
    resource({
        name: "default",
        model: mongoose.model("Schema"),
        fields: {
            name: {
                type: String
            },
            hide1: {
                type: String,
                hide: true
            },
            hide2: {
                type: String,
                hide: {
                    index: true
                }
            },
            notFilterable: {
                type: String,
                filterable: false
            },
            boolean: {
                type: Boolean
            },
            array: {
                type: [Number]
            },
            number: Number
        },
        hooks: {
            global: {
                before: async ({ res }) => {
                    res.set("x-hook-global-before", "ok");
                },
                beforeResponse: async ({ res }) => {
                    await new Promise(resolve => {
                        setTimeout(() => {
                            res.set("x-hook-global-before-response", "ok");
                            resolve();
                        }, 50);
                    });
                }
            },
            index: {
                before: async ({ res }) => {
                    res.set("x-hook-index-before", "ok");
                },
                beforeResponse: async ({ res }) => {
                    res.set("x-hook-index-before-response", "ok");
                }
            }
        }
    })
);

app.use(
    "/default2",
    resource({
        model: mongoose.model("Schema"),
        fields: {
            name: {
                type: String
            },
            hide1: {
                type: String
            },
            hide2: {
                type: String
            }
        },
        paginationMeta: {
            limit: 2,
            sort: "hide1",
            defaultFilters: {
                name: /2$/
            }
        }
    })
);

app.use(
    "/default3",
    resource({
        model: mongoose.model("Schema"),
        fields: {
            name: {
                type: String
            },
            hide1: {
                type: String
            },
            hide2: {
                type: String
            },
            notSortable: {
                type: String,
                sortable: false
            }
        },
        paginationMeta: {
            minLimit: 1,
            maxLimit: 3
        }
    })
);

app.use(
    "/default4",
    resource({
        model: mongoose.model("Schema"),
        fields: {
            name: {
                type: String
            },
            something: {
                type: String,
                get: async () => {
                    return await new Promise((resolve, reject) => {
                        setTimeout(() => {
                            resolve("custom");
                        }, 50);
                    });
                },
                set: async () => {
                    return await new Promise((resolve, reject) => {
                        setTimeout(() => {
                            resolve("custom");
                        }, 50);
                    });
                }
            },
            something2: {
                type: String,
                get: (value, { record, type }) => {
                    if (type === "index") return record.name;
                },
                set: (value, { record, type }) => {
                    if (type === "index") return record.name;
                }
            }
        },
        filters: {
            global: async () => {
                return await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve({
                            name: "something-2"
                        });
                    }, 50);
                });
            }
        }
    })
);

app.use(
    "/default5",
    resource({
        model: mongoose.model("Schema"),
        fields: {
            name: {
                type: String
            }
        },
        middleware: {
            global: [
                (req, res, next) => {
                    if (req.query.sort === "custom") {
                        return res.status(400).send("error");
                    }
                    next();
                }
            ],
            index: [
                (req, res, next) => {
                    if (req.query.sort === "custom2") {
                        return res.status(500).send("error");
                    }
                    next();
                }
            ]
        }
    })
);

app.use(
    "/default6",
    resource({
        model: mongoose.model("Schema"),
        fields: {
            name: {
                type: Boolean
            }
        }
    })
);

app.use(
    "/default7",
    resource({
        model: mongoose.model("Schema"),
        fields: {
            array: {
                type: Array
            }
        }
    })
);

app.use(
    "/default8",
    resource({
        model: mongoose.model("Schema"),
        fields: async () => {
            return await new Promise(resolve => {
                setTimeout(() => {
                    return resolve({
                        name: {
                            type: String,
                            validate: async val => {
                                return await new Promise((resolve, reject) => {
                                    setTimeout(() => {
                                        if (val === "name") {
                                            return resolve();
                                        }
                                        reject();
                                    }, 50);
                                });
                            }
                        }
                    });
                }, 50);
            });
        }
    })
);

app.use(
    "/default9",
    resource({
        model: mongoose.model("Schema"),
        fields: {
            name: {
                type: String
            },
            number: Number,
            date: Date
        },
        hooks: {
            global: {
                before: async ({ res }) => {
                    res.set("x-hook-global-before", "ok");
                },
                beforeResponse: async ({ res }) => {
                    await new Promise(resolve => {
                        setTimeout(() => {
                            res.set("x-hook-global-before-response", "ok");
                            resolve();
                        }, 50);
                    });
                }
            },
            index: {
                before: async ({ res }) => {
                    res.set("x-hook-index-before", "ok");
                },
                beforeResponse: async ({ res }) => {
                    res.set("x-hook-index-before-response", "ok");
                }
            }
        }
    })
);

describe("index route of schema resource", () => {
    beforeEach(async () => {
        await Model.deleteMany({});
    });
    it("returns json for index route", async () => {
        await request(app)
            .get("/default")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                expect(JSON.parse(res.text))
                    .to.be.an("array")
                    .and.lengthOf(0);
                expect(res.headers).to.haveOwnProperty("x-hook-global-before");
                expect(res.headers).to.haveOwnProperty(
                    "x-hook-global-before-response"
                );
                expect(res.headers).to.haveOwnProperty("x-hook-index-before");
                expect(res.headers).to.haveOwnProperty(
                    "x-hook-index-before-response"
                );
            });
    });
    it("returns fields that are in fields schema", async () => {
        let record = await Model.create({
            name: "something"
        });
        await request(app)
            .get("/default")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response)
                    .to.be.an("array")
                    .and.lengthOf(1);
                expect(response[0])
                    .to.be.an("object")
                    .and.to.haveOwnProperty("name");
                expect(response[0].name).to.be.equal(record.name);
            });
    });

    it("will hide inputs that are hidden in schema", async () => {
        await Model.create({
            name: "something",
            hide1: "hide1",
            hide2: "hide2"
        });
        await request(app)
            .get("/default")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response[0]).to.haveOwnProperty("name");
                expect(response[0]).to.not.haveOwnProperty("hide1");
                expect(response[0]).to.not.haveOwnProperty("hide2");
            });
    });

    it("will filter data with query string", async () => {
        await Model.create({
            name: "something-1",
            hide1: "hide1-1",
            hide2: "hide2-1",
            notFilterable: "something-3",
            boolean: false,
            array: [1, 2, 3],
            number: 5
        });
        await Model.create({
            name: "something-2",
            hide1: "hide1-2",
            hide2: "hide2-2",
            notFilterable: "something-4",
            boolean: true,
            array: [3, 4, 5],
            number: 10
        });

        // normal filter
        await request(app)
            .get("/default?name=something-1")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(1);
                expect(response[0]).to.haveOwnProperty("name");
                expect(response[0].name).to.be.equal("something-1");
            });

        // boolean filter
        await request(app)
            .get("/default?boolean=true")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(1);
                expect(response[0]).to.haveOwnProperty("name");
                expect(response[0].name).to.be.equal("something-2");
            });

        // not filterable test
        await request(app)
            .get("/default?notFilterable=something-1")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(2);
            });

        // regex filter
        await request(app)
            .get("/default")
            .query({
                name: "/SOME.+\\-1$/i"
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(1);
                expect(response[0].name).to.be.equal("something-1");
            });

        // in operator
        await request(app)
            .get("/default")
            .query({
                name: "in:something-1,something-2"
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(2);
                expect(response[0].name).to.be.equal("something-1");
                expect(response[1].name).to.be.equal("something-2");
            });

        // nin operator
        await request(app)
            .get("/default")
            .query({
                name: "nin:something-1,something-2"
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(0);
            });

        // has operator
        await request(app)
            .get("/default")
            .query({
                array: "has:2"
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(1);
            });
        await request(app)
            .get("/default")
            .query({
                array: "has:3"
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(2);
            });

        // lt operator
        await request(app)
            .get("/default")
            .query({
                number: "lt:10"
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(1);
            });
        await request(app)
            .get("/default")
            .query({
                number: "lte:10"
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(2);
            });
        // gt operator
        await request(app)
            .get("/default")
            .query({
                number: "gt:5"
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(1);
            });
        // gt operator
        await request(app)
            .get("/default")
            .query({
                number: "gte:5"
            })
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(2);
            });
    });

    it("will return expected result for default pagination meta", async () => {
        await Model.create({
            name: "something-1",
            hide1: "hide1-1",
            hide2: "hide2-1"
        });
        await Model.create({
            name: "something-2",
            hide1: "hide1-2",
            hide2: "hide2-2"
        });
        await Model.create({
            name: "something-2",
            hide1: "a",
            hide2: "hide2-4"
        });

        await request(app)
            .get("/default2")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(2);
                expect(response[0]).to.haveOwnProperty("name");
                expect(response[0]).to.haveOwnProperty("hide1");
                expect(response[0].name).to.be.equal("something-2");
                expect(response[0].hide2).to.be.equal("hide2-4");
                expect(res.headers["x-range"]).to.be.equals("0-2/2");
            });
    });

    it("will effected by query pagination meta", async () => {
        await Model.create({
            name: "something-1",
            hide1: "a",
            hide2: "a",
            notSortable: "a"
        });
        await Model.create({
            name: "something-2",
            hide1: "a",
            hide2: "b",
            notSortable: "b"
        });
        await Model.create({
            name: "something-3",
            hide1: "b",
            hide2: "c",
            notSortable: "c"
        });
        await Model.create({
            name: "something-4",
            hide1: "b",
            hide2: "d",
            notSortable: "d"
        });
        await Model.create({
            name: "something-5",
            hide1: "c",
            hide2: "e",
            notSortable: "e"
        });

        await request(app)
            .get("/default3?offset=2&sort=name&limit=1")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(1);
                expect(response[0].name).to.be.equal("something-3");
            });

        await request(app)
            .get("/default3?offset=2&sort=name&limit=1")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(1);
                expect(response[0].name).to.be.equal("something-3");
            });

        // multiple sort
        await request(app)
            .get("/default3?sort=hide1 -hide2")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(5);
                expect(response[0].name).to.be.equal("something-2");
            });

        // check not sortable
        await request(app)
            .get("/default3?sort=-notSortable")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(5);
                expect(response[0].name).to.be.equal("something-1");
            });

        // check max limit
        await request(app)
            .get("/default3?limit=4")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(5);
            });

        // check page and headers
        await request(app)
            .get("/default3?limit=2&page=2")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(2);
                expect(response[0].name).to.be.equal("something-3");
                expect(res.headers["x-total"]).to.be.equal("5");
                expect(res.headers["x-limit"]).to.be.equal("2");
                expect(res.headers["x-offset"]).to.be.equal("undefined");
                expect(res.headers["x-page"]).to.be.equal("2");
                expect(res.headers["x-has-next-page"]).to.be.equal("true");
                expect(res.headers["x-has-prev-page"]).to.be.equal("true");
                expect(res.headers["x-prev-page"]).to.be.equal("1");
                expect(res.headers["x-next-page"]).to.be.equal("3");
                expect(res.headers["x-range"]).to.be.equal("2-4/5");
            });
    });

    it("will be effected by custom filters of schema", async () => {
        await Model.create({
            name: "something-1"
        });
        await Model.create({
            name: "something-2"
        });

        await request(app)
            .get("/default4")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(1);
                expect(response[0].name).to.be.equal("something-2");
            });
    });

    it("will return custom values", async () => {
        await Model.create({
            name: "something-2"
        });
        await request(app)
            .get("/default4")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(1);
                expect(response[0].name).to.be.equal("something-2");
                expect(response[0].something).to.be.equal("custom");
                expect(response[0].something2).to.be.equal("something-2");
            });
    });

    it("will execute middleware", async () => {
        await Model.create({
            name: "something-1"
        });

        await request(app)
            .get("/default5?sort=custom")
            .expect(400);

        await request(app)
            .get("/default5?sort=custom2")
            .expect(500);
    });

    it("will convert json result by schema", async () => {
        await Model.create({
            name: "something-1"
        });
        await Model.create({
            name: false
        });

        await request(app)
            .get("/default6")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(2);
                expect(response[0].name)
                    .to.be.a("boolean")
                    .and.to.be.equal(true);
                expect(response[1].name)
                    .to.be.a("boolean")
                    .and.to.be.equal(false);
            });
    });

    it("will be filtered by array field", async () => {
        await Model.create({
            array: ["ok"]
        });
        await Model.create({
            array: "ok2"
        });

        await request(app)
            .get("/default7?array=ok2")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(1);
                expect(response[0].array).to.be.a("array");
                expect(response[0].array[0]).to.be.equal("ok2");
            });
    });

    it("will filter data with query operators", async () => {
        await Model.create({
            name: "ok1",
            number: 15,
            date: moment()
        });

        await Model.create({
            name: "ok2",
            number: 10,
            date: moment().subtract(5, "days")
        });

        await Model.create({
            name: "ok3",
            number: 5,
            date: moment().subtract(10, "days")
        });

        await request(app)
            .get("/default9?number=lte:10")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(2);
                expect(response[0].name).to.be.equal("ok2");
                expect(response[1].name).to.be.equal("ok3");
            });

        await request(app)
            .get(
                "/default9?date=gt:" +
                    moment()
                        .subtract(3, "days")
                        .format("YYYY-MM-DD")
            )
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(1);
                expect(response[0].name).to.be.equal("ok1");
            });
        await request(app)
            .get("/default9?name=in:ok1,ok2")
            .expect(200)
            .expect("Content-type", /json/)
            .expect(res => {
                const response = JSON.parse(res.text);
                expect(response).to.be.lengthOf(2);
                expect(response[0].name).to.be.equal("ok1");
                expect(response[1].name).to.be.equal("ok2");
            });
    });
});
