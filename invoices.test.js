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
  it("Gets a list of invoices", async function() {
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
    expect(resp.body).toEqual({"invoice": {
      "id": invoice1.id,
      "amt": "10.00",
      "paid": false,
      "add_date": expect.any(String),
      "paid_date": null,
      "company": company
    }});
  });

  it("Fail to get an invoice that does not exist", async function () {
    const resp = await request(app).get("/invoices/0");

    expect(resp.statusCode).toEqual(404);
    expect(resp.body).toEqual({"error": {
      "message": "Invoice 0 not found",
      "status": 404
    }});
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

    expect(resp.body).toEqual({"invoice": {
      "id": expect.any(Number),
      "amt": "30.00",
      "paid": false,
      "add_date": expect.any(String),
      "paid_date": null,
      "comp_code": company.code
    }});

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
    expect(afterPostInvoices.length).toEqual(2)  ;  
  });   
});

//   describe("PUT /companies/:code", function () {
//     it("Updates a company's information", async function () {
//       const beforePut = await db.query(
//         `SELECT code, name, description
//               FROM companies`);
//       const beforePutCompanies = beforePut.rows;
//       expect(beforePutCompanies.length).toEqual(1);
  
//       const resp = await request(app).put("/companies/test").send({
//         name: "Test2",
//         description: "company test2",
//       });
//       expect(resp.body).toEqual({"company": {
//         "code": "test",
//         "name": "Test2",
//         "description": "company test2",
//       }});
  
//       const afterPut = await db.query(
//         `SELECT code, name, description
//               FROM companies`);
//       const afterPutCompanies = afterPut.rows; 
//       expect(afterPutCompanies.length).toEqual(1);
//     });
  
//     it("Fails to update if the company doesn't exist", async function () {
//       const beforePut = await db.query(
//         `SELECT code, name, description
//               FROM companies`);
//       const beforePutCompanies = beforePut.rows;
//       expect(beforePutCompanies.length).toEqual(1);
  
//       const resp = await request(app).put("/companies/doesnotexist").send({
//         name: "Test2",
//         description: "company test2",
//       });
//       expect(resp.statusCode).toEqual(404);
  
//       const afterPut = await db.query(
//         `SELECT code, name, description
//               FROM companies`);
//       const afterPutCompanies = afterPut.rows; 
//       expect(afterPutCompanies.length).toEqual(1);
//     });
//   });

//   describe("DELETE /companies/:code", function () {
//     it("Delete a company", async function () {
//       const beforeDelete = await db.query(
//         `SELECT code, name, description
//               FROM companies`);
//       const beforeDeleteCompanies = beforeDelete.rows;
//       expect(beforeDeleteCompanies.length).toEqual(1);
  
//       const resp = await request(app).delete("/companies/test");

//       expect(resp.body).toEqual({"status": "deleted"});
  
//       const afterDelete = await db.query(
//         `SELECT code, name, description
//               FROM companies`);
//       const afterDeleteCompanies = afterDelete.rows; 
//       expect(afterDeleteCompanies.length).toEqual(0);
//     });
  
//     it("Fails to delete if company cannot be found", async function () {
//       const beforeDelete = await db.query(
//         `SELECT code, name, description
//               FROM companies`);
//       const beforeDeleteCompanies = beforeDelete.rows;
//       expect(beforeDeleteCompanies.length).toEqual(1);
  
//       const resp = await request(app).delete("/companies/apple");

//       expect(resp.statusCode).toEqual(404);
  
//       const afterDelete = await db.query(
//         `SELECT code, name, description
//               FROM companies`);
//       const afterDeleteCompanies = afterDelete.rows; 
//       expect(afterDeleteCompanies.length).toEqual(1);  
//     });
//   });
// });

afterAll(async function () {
  await db.end();
});