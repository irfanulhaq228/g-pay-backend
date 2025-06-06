const express = require("express");
const { createAdmin, getAllAdmins, loginAdmin, updateData, getDataById, sendFeedbackToAdminAPI } = require("../Controllers/AdminController");
const authenticate = require("../Middleware/auth");

const AdminRouter = express.Router();

AdminRouter.post("/create", createAdmin);
AdminRouter.get("/getAll", getAllAdmins);
AdminRouter.post("/get",authenticate, getDataById);
AdminRouter.post("/login", loginAdmin);
AdminRouter.put("/update",authenticate, updateData);
AdminRouter.post('/feedback', sendFeedbackToAdminAPI)

module.exports = AdminRouter;