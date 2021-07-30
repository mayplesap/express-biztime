const request = require("supertest");
const app = require("./app");
const db = require("./db");

let invoice1, invoice2, company;

beforeEach(async function () {
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");

    const companyResult = await db.query(
        `INSERT INTO companies (code, name, description)
    VALUES ('test', 'Test', 'company test')
    RETURNING code, name, description;`);
    company = companyResult.rows[0];

    const invoiceResults = await db.query(
        `INSERT INTO invoices (comp_code, amt)
    VALUES ('test', '10'),
           ('test', '20')
    RETURNING id, add_date`);
    invoice1 = invoiceResults.rows[0];
    invoice2 = invoiceResults.rows[1];
})


describe("GET /invoices", function () {
    it("Gets a list of invoices", async function () {
        const resp = await request(app).get("/invoices");

        expect(resp.body).toEqual({
            "invoices": [
                {
                    "id": invoice1.id,
                    "comp_code": "test"
                },
                {
                    "id": invoice2.id,
                    "comp_code": "test"
                }
            ]
        });
    });
});

describe("GET /invoices/:id", function () {
    it("Gets a single invoice", async function () {
        const resp = await request(app).get(`/invoices/${invoice1.id}`);
        expect(resp.body).toEqual({
            "invoice": {
                "id": invoice1.id,
                "amt": "10.00",
                "paid": false,
                "add_date": expect.any(String),
                "paid_date": null,
                "company": company
            }
        });
    });

    it("Fail to get an invoice that does not exist", async function () {
        const resp = await request(app).get("/invoices/0");

        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual({
            "error": {
                "message": "Invoice 0 not found",
                "status": 404
            }
        });
    });
});

describe("POST /invoices", function () {
    it("Adds a new invoice to invoices", async function () {
        const beforePost = await db.query(
            `SELECT id
            FROM invoices`);
        const beforePostInvoices = beforePost.rows;
        expect(beforePostInvoices.length).toEqual(2);

        const resp = await request(app).post("/invoices").send({
            comp_code: "test",
            amt: "30",
        });

        expect(resp.body).toEqual({
            "invoice": {
                "id": expect.any(Number),
                "amt": "30.00",
                "paid": false,
                "add_date": expect.any(String),
                "paid_date": null,
                "comp_code": company.code
            }
        });

        const afterPost = await db.query(
            `SELECT id
            FROM invoices`);
        const afterPostInvoices = afterPost.rows;
        expect(afterPostInvoices.length).toEqual(3);
    });

    it("Fails to add if invalid company code", async function () {
        const beforePost = await db.query(
            `SELECT id
            FROM invoices`);
        const beforePostInvoices = beforePost.rows;
        expect(beforePostInvoices.length).toEqual(2);

        const resp = await request(app).post("/invoices").send({
            comp_code: "notexist",
            amt: "30",
        });
        expect(resp.statusCode).toEqual(500);

        const afterPost = await db.query(
            `SELECT id
            FROM invoices`);
        const afterPostInvoices = afterPost.rows;
        expect(afterPostInvoices.length).toEqual(2);
    });
});

describe("PUT /invoices/:id", function () {
    it("Updates an invoices information", async function () {
        const beforePut = await db.query(
            `SELECT id
              FROM invoices`);
        const beforePutInvoices = beforePut.rows;
        expect(beforePutInvoices.length).toEqual(2);

        const resp = await request(app).put(`/invoices/${invoice1.id}`).send({
            amt: 20000,
        });
        expect(resp.body).toEqual({
            "invoice": {
                "id": invoice1.id,
                "amt": "20000.00",
                "paid": false,
                "add_date": expect.any(String),
                "paid_date": null,
                "comp_code": company.code
            }
        });

        const afterPut = await db.query(
            `SELECT id
            FROM invoices`);
        const afterPutInvoices = afterPut.rows;
        expect(afterPutInvoices.length).toEqual(2);
    });

    it("Fails to update if the invoice doesn't exist", async function () {
        const beforePut = await db.query(
            `SELECT id
              FROM invoices`);
        const beforePutInvoices = beforePut.rows;

        const resp = await request(app).put("/invoices/0").send({
            amt: 20000,
        });
        expect(resp.statusCode).toEqual(404);
    });
});

describe("DELETE /invoices/:id", function () {
    it("Delete an invoice", async function () {
        const beforeDelete = await db.query(
            `SELECT id
            FROM invoices`);
        const beforeDeleteInvoices = beforeDelete.rows;
        expect(beforeDeleteInvoices.length).toEqual(2);

        const resp = await request(app).delete(`/invoices/${invoice1.id}`);
        expect(resp.body).toEqual({ "status": "deleted" });

        const afterDelete = await db.query(
            `SELECT id
            FROM invoices`);
        const afterDeleteInvoices = afterDelete.rows;
        expect(afterDeleteInvoices.length).toEqual(1);
    });

    it("Fails to delete if company cannot be found", async function () {
        const beforeDelete = await db.query(
            `SELECT id
            FROM invoices`);
        const beforeDeleteInvoices = beforeDelete.rows;
        expect(beforeDeleteInvoices.length).toEqual(2);

        const resp = await request(app).delete("/invoices/0");

        expect(resp.statusCode).toEqual(404);

        const afterDelete = await db.query(
            `SELECT id
            FROM invoices`);
        const afterDeleteInvoices = afterDelete.rows;
        expect(afterDeleteInvoices.length).toEqual(2);
    });
});

afterAll(async function () {
    await db.end();
});