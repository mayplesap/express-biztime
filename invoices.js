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
  const invoice = invoiceResult.rows[0];

  if (invoiceResult.rowCount < 1) {
    throw new NotFoundError();
  }

  const companyResult = await db.query(
      `SELECT code, name, description 
          FROM companies
          WHERE code=$1`, [invoice.comp_code]);
  const company = companyResult.rows[0];

  const result = { id:invoice.id,
                   amt:invoice.amt,
                   paid:invoice.paid,
                   add_date:invoice.add_date,
                   paid_date:invoice.paid_date,
                   company };
  return res.json({ invoice:result });
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
    if (result.rowCount < 1) {
      throw new NotFoundError();
    }
    return res.json({ invoice });
})

/** DELETE invoice:
 * Returns {status: "deleted"}
 */
router.delete("/:id", async function (req, res, next) {
  const result = await db.query(
    `SELECT id FROM invoices
    WHERE id=$1`, [req.params.id]);

  if (result.rowCount < 1) {
    throw new NotFoundError();
  }

  await db.query(`DELETE FROM invoices WHERE id=$1`, 
  [req.params.id]);
  return res.json({status: "deleted"});
})

module.exports = router;