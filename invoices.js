"use strict"
/** Routes for invoices of biztime */

const express = require("express");
const { NotFoundError } = require("./expressError");
const db = require("./db");
const router = express.Router();

/** GET invoices: Returns list of invoices {invoices: [{id, comp_code}, ...]} */
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT id, comp_code
          FROM invoices`);
  const invoices = results.rows;
  return res.json({ invoices });
});

/** GET invoice: 
 * Return obj of invoice: 
 * {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}} */
router.get("/:id", async function (req, res, next) {
  const invoiceResult = await db.query(
      `SELECT id, amt, paid, add_date, paid_date, comp_code
          FROM invoices
          WHERE id=$1`, [req.params.id]);

  const invoiceData = invoiceResult.rows[0];

  if (!invoiceData) { 
    throw new NotFoundError(`Invoice ${req.params.id} not found`); 
  }

  const { comp_code, ...invoice } = invoiceData;

  const companyResult = await db.query(
      `SELECT code, name, description 
          FROM companies
          WHERE code=$1`, [comp_code]);
  const company = companyResult.rows[0];

  invoice.company = company;
  return res.json({ invoice });
});

/** POST invoices: 
 * given JSON like: {comp_code, amt}
 * Returns obj of new invoice: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
router.post("/", async function (req, res, next) {
  const { comp_code, amt } = req.body;

  const result = await db.query(
    `INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
    [comp_code, amt]
  );
  const invoice = result.rows[0];
  return res.status(201).json({ invoice })
})

/** PUT invoice: 
 * given JSON like: {amt}
 * Returns update invoice object: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
router.put("/:id", async function (req, res, next) {
  const { amt } = req.body;

  const result = await db.query(
    `UPDATE invoices
        SET amt=$1
        WHERE id=$2
        RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
    [amt, req.params.id]);
    const invoice = result.rows[0];

    if (!invoice) { 
      throw new NotFoundError(`Invoice ${req.params.id} not found`); 
    }

    return res.json({ invoice });
})

/** DELETE invoice:
 * Returns {status: "deleted"}
 */
router.delete("/:id", async function (req, res, next) {
  // const result = await db.query(
  //   `SELECT id FROM invoices
  //   WHERE id=$1`, [req.params.id]);

  // if (result.rowCount < 1) {
  //   throw new NotFoundError(`Invoice ${req.params.id} not found`);
  // }

  const result = await db.query(
    `DELETE FROM invoices 
        WHERE id=$1
        RETURNING id`, 
  [req.params.id]);
  const invoice = result.rows[0];
  if (!invoice) {
    throw new NotFoundError(`Invoice ${req.params.id} not found`);
  }
  return res.json({status: "deleted"});
})

module.exports = router;