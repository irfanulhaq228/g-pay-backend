const express = require("express");
const { createTransactionSlip, getAllTransactionSlips, getMerchantTransactionSlips, deleteMerchantTransactionSlips } = require("../Controllers/TransactionSlipController");

const TransactionSlipRoutes = express.Router();

TransactionSlipRoutes.post("/create", createTransactionSlip);
TransactionSlipRoutes.get("/getAll", getAllTransactionSlips);
TransactionSlipRoutes.get("/get", getMerchantTransactionSlips);
TransactionSlipRoutes.delete("/delete/:id", deleteMerchantTransactionSlips);

module.exports = TransactionSlipRoutes;