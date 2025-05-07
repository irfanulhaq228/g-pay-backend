const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth: {
      user: "irfan.netrex@gmail.com",
      pass: "mifx xzmn yuyi bgrj",
    },
});

module.exports = { transporter };