const { createData, updateData, getAllData } = require("../Controllers/CryptoExchangeController");
const authenticate = require("../Middleware/auth");

const cryptoExhangeRouter = require("express").Router();

cryptoExhangeRouter.post("/create", authenticate, createData);
cryptoExhangeRouter.get("/getAll", getAllData);



module.exports = cryptoExhangeRouter;