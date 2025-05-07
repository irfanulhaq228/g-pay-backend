const express = require("express");

const { createData, getDataByAdmin, updateData } = require("../Controllers/WalletTransferController");

const WalletTransferRouter = express.Router();

WalletTransferRouter.post("/create", createData);
WalletTransferRouter.get("/getByAdmin", getDataByAdmin);
WalletTransferRouter.put("/", updateData);

module.exports = WalletTransferRouter;