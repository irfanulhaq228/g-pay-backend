const express = require("express");
const { createUser, loginUser, getAllUsers, deleteUser, updateStatus, checkUser } = require("../Controllers/UserController.js");

const UserRouter = express.Router();

UserRouter.post("/", createUser);
UserRouter.get("/", getAllUsers);
UserRouter.post("/login", loginUser);

UserRouter.delete("/:id", deleteUser);
UserRouter.post("/status/:id", updateStatus);
UserRouter.post("/check", checkUser)

module.exports = UserRouter; 