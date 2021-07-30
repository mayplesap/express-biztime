"use strict"
/** Routes for companies of biztime */

const express = require("express");
const { NotFoundError } = require("./expressError");
const db = require("./db");
const router = express.Router();

/** GET companies: Returns list of companies {companies: [{code, name}, ...]} */
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name, description
          FROM companies`);
  const companies = results.rows;
  return res.json({ companies });
});

/** GET company: Return obj of company: 
 * {company: {code, name, description, invoices: [id, ...]}} */
router.get("/:code", async function (req, res, next) {
  const companyResult = await db.query(
      `SELECT code, name, description FROM companies
          WHERE code=$1`, [req.params.code]);

  const company = companyResult.rows[0];
  if (!company) { 
    throw new NotFoundError(`Company ${req.params.code} not found`); 
  }

  const invoicesResult = await db.query(
    `SELECT id
        FROM invoices
        WHERE comp_code=$1`, [req.params.code]);

  company.invoices = invoicesResult.rows.map(i => i.id);
  return res.json({ company });
});

/** POST companies: 
 * given JSON like: {code, name, description}
 * Returns obj of new company: {company: {code, name, description}} */
// TODO make try catch to catch and raise errors 
router.post("/", async function (req, res, next) {
  // const { code, name, description } = req.body;
  // try {
    

  //   const result = await db.query(
  //     `INSERT INTO companies (code, name, description)
  //         VALUES ($1, $2, $3)
  //         RETURNING code, name, description`, 
  //     [code, name, description]
  //   );
  //   const company = result.rows[0];
  //   return res.status(201).json({ company })
  // } catch(e) {
  //   raise(error)
  // }
  const { code, name, description } = req.body;

  const result = await db.query(
    `INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`, 
    [code, name, description]
  );
  const company = result.rows[0];
  return res.status(201).json({ company })
})

/** PUT company: 
 * given JSON like: {name, description}
 * Returns update company object: {company: {code, name, description}}*/
router.put("/:code", async function (req, res, next) {
  const { name, description } = req.body;

  const result = await db.query(
    `UPDATE companies
        SET name=$1,
            description=$2
        WHERE code=$3
        RETURNING code, name, description`, 
    [name, description, req.params.code]);
    const company = result.rows[0];
    
    if (!company) { 
      throw new NotFoundError(`Company ${req.params.code} not found`); 
    }
    return res.json({ company });
})

/** DELETE company:
 * Returns {status: "deleted"}
 */
router.delete("/:code", async function (req, res, next) {
  const result = await db.query(
    `DELETE FROM companies 
        WHERE code=$1
        RETURNING code`, 
  [req.params.code]);
  const company = result.rows[0];
  if (!company) {
    throw new NotFoundError(`Company ${req.params.code} not found`);
  }
  return res.json({status: "deleted"});
})

module.exports = router;