const request = require("supertest");
const app = require("./app");
const db = require("./db");

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices");

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
    VALUES ('test', 'Test', 'company test')
    RETURNING code`);
  testCompany = results.rows[0];

  await db.query(
    `INSERT INTO invoices (comp_code, amt)
    VALUES ('test', '10'),
           ('test', '20')`);
})


describe("GET /companies", function () {
  it("Gets a list of companies", async function() {
    const resp = await request(app).get("/companies");

    expect(resp.body).toEqual({companies: [
      { code: "test", name: "Test", description: "company test"}]
    });
  });
});

describe("GET /companies/:code", function () {
  it("Gets a single company", async function () {
    const resp = await request(app).get("/companies/test");

    expect(resp.body).toEqual({"company": {
      "code": "test",
      "name": "Test",
      "description": "company test",
      "invoices": [expect.any(Number), expect.any(Number)]
    }});
  });

  it("Fail to get a company that does not exist", async function () {
    const resp = await request(app).get("/companies/apple");

    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({"error": {
      "message": "Company apple not found",
      "status": 404
    }});
  });
});

describe("POST /companies", function () {
  it("Adds a new company to companies", async function () {
    const resp = await request(app).post("/companies").send({
      code: "test2",
      name: "Test2",
      description: "company test2",
    });

    const results = await db.query(
      `SELECT code, name, description
            FROM companies`);
    const companies = results.rows; 

    expect(resp.body).toEqual({"company": {
      "code": "test2",
      "name": "Test2",
      "description": "company test2",
    }});
    expect(companies.length).toEqual(2);
  });
});