const request = require("supertest");
const app = require("./app");
const db = require("./db");

let invoice1, invoice2;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM invoices"); 
  
  await db.query(
    `INSERT INTO companies (code, name, description)
    VALUES ('test', 'Test', 'company test')
    RETURNING code;`);

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
    VALUES ('test', '10'),
           ('test', '20')
    RETURNING id, comp_code, amt, paid, add_date, paid_date;`);
  console.log(results);
  invoice1 = results.rows[0];
  invoice2 = results.rows[1];
})


describe("GET /invoices", function () {
  it("Gets a list of invoices", async function() {
    const resp = await request(app).get("/invoices");
    console.log(resp);
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

// describe("GET /companies/:code", function () {
//   it("Gets a single company", async function () {
//     const resp = await request(app).get("/companies/test");

//     expect(resp.body).toEqual({"company": {
//       "code": "test",
//       "name": "Test",
//       "description": "company test",
//       "invoices": [expect.any(Number), expect.any(Number)]
//     }});
//   });

//   it("Fail to get a company that does not exist", async function () {
//     const resp = await request(app).get("/companies/apple");

//     expect(resp.statusCode).toEqual(404);
//     expect(resp.body).toEqual({"error": {
//       "message": "Company apple not found",
//       "status": 404
//     }});
//   });
// });

// describe("POST /companies", function () {
//   it("Adds a new company to companies", async function () {
//     const beforePost = await db.query(
//       `SELECT code, name, description
//             FROM companies`);
//     const beforePostCompanies = beforePost.rows;
//     expect(beforePostCompanies.length).toEqual(1);

//     const resp = await request(app).post("/companies").send({
//       code: "test2",
//       name: "Test2",
//       description: "company test2",
//     });
//     expect(resp.body).toEqual({"company": {
//       "code": "test2",
//       "name": "Test2",
//       "description": "company test2",
//     }});

//     const afterPost = await db.query(
//       `SELECT code, name, description
//             FROM companies`);
//     const afterPostCompanies = afterPost.rows; 
//     expect(afterPostCompanies.length).toEqual(2);
//   });

//   it("Fails to add if they have the same company code", async function () {
//     const beforePost = await db.query(
//       `SELECT code, name, description
//             FROM companies`);
//     const beforePostCompanies = beforePost.rows;
//     expect(beforePostCompanies.length).toEqual(1);

//     const resp = await request(app).post("/companies").send({
//       code: "test",
//       name: "Test2",
//       description: "company test2",
//     });
//     expect(resp.statusCode).toEqual(500);

//     const afterPost = await db.query(
//       `SELECT code, name, description
//             FROM companies`);
//     const afterPostCompanies = afterPost.rows; 
//     expect(afterPostCompanies.length).toEqual(1)    
//   });

//   it("Fails to add if they have the same company name", async function () {
//     const beforePost = await db.query(
//       `SELECT code, name, description
//             FROM companies`);
//     const beforePostCompanies = beforePost.rows;
//     expect(beforePostCompanies.length).toEqual(1);

//     const resp = await request(app).post("/companies").send({
//       code: "test2",
//       name: "Test",
//       description: "company test2",
//     });
//     expect(resp.statusCode).toEqual(500);

//     const afterPost = await db.query(
//       `SELECT code, name, description
//             FROM companies`);
//     const afterPostCompanies = afterPost.rows; 
//     expect(afterPostCompanies.length).toEqual(1)    
//   });

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