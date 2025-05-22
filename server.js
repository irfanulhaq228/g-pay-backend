const fs = require("fs");
const cors = require("cors");
const db = require("./db/db.js");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const express = require("express");
const Tesseract = require("tesseract.js");
const bodyParser = require('body-parser');
const Admin = require('./Models/AdminModel');
const Ledger = require('./Models/LedgerModel');
const { Server } = require('socket.io');
const ledger = require("./socket/ledgerSocket.js");
// const axios = require("axios");
// const multer = require("multer");
// const pdfParse = require("pdf-parse");
// const PDFParser = require("pdf2json");

const { upload } = require("./Multer/Multer.js");

const BankRouter = require("./Routes/BankRoutes.js");
const AdminRouter = require("./Routes/adminRoutes.js");
const StaffRouter = require("./Routes/StaffRoutes.js");
const LedgerRouter = require("./Routes/LedgerRoutes.js");
const TicketRouter = require("./Routes/TicketRoutes.js");
const websiteRoutes = require("./Routes/WebsiteRoutes.js");
const ApprovalRouter = require("./Routes/ApprovalRoutes.js");
const MerchantRouter = require("./Routes/MerchantRoutes.js");
const TicketReplyRoutes = require("./Routes/TicketReplyRoutes.js");
const LoginHistoryRouter = require("./Routes/LoginHistoryRoutes.js");
const TransactionSlipRoutes = require("./Routes/TransactionSlipRoutes.js");
const WithdrawBankRoutes = require("./Routes/WithdrawBankRoutes.js");
const WithdrawRoutes = require("./Routes/WithdrawRoutes.js");
const ExchangeRoutes = require("./Routes/ExchangeRoutes.js");
const AdminStaffRoutes = require("./Routes/AdminStaffRoutes.js");
const LedgerLogRoutes = require("./Routes/LedgerLogRoutes.js");
const BankLogRoutes = require("./Routes/BankLogRoutes.js");
const BankNamesRoutes = require("./Routes/BankNamesRoutes.js");
const ExcelWithdrawRoutes = require("./Routes/ExcelWithdrawRoutes.js");
const ExcelFileRoutes = require("./Routes/ExcelFileRoutes.js");
const WalletTransferRouter = require("./Routes/walletTransferRoutes.js");
const locationRouters = require("./Routes/LocationRoutes.js");
const portalRouter = require("./Routes/PortalRoutes.js");
const receiptRouter = require("./Routes/ReceiptRouter.js");
const cryptoExhangeRouter = require("./Routes/CryptoExchageRoutes.js");
const merchantModel = require("./Models/MerchantModel.js");
const bankModel = require("./Models/BankModel.js");

dotenv.config();
const app = express();
const router = express.Router();
router.use(bodyParser.json());

app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Authorization, Content-Type',
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

db;

app.get("/", (req, res) => {
  res.json({ message: `G-Pay backend runs on ${process.env.MODE} mode` });
});


app.use("/excelFile", ExcelFileRoutes);
app.use("/excelWithdraw", ExcelWithdrawRoutes);
app.use("/bankNames", BankNamesRoutes);
app.use("/bankLog", BankLogRoutes);
app.use("/ledgerLog", LedgerLogRoutes);
app.use("/adminStaff", AdminStaffRoutes);
app.use("/exchange", ExchangeRoutes);
app.use("/withdrawBank", WithdrawBankRoutes);
app.use("/withdraw", WithdrawRoutes);
app.use("/ticketReply", TicketReplyRoutes);
app.use("/website", websiteRoutes);
app.use("/admin", AdminRouter);
app.use("/loginHistory", LoginHistoryRouter);
app.use("/merchant", MerchantRouter);
app.use("/staff", StaffRouter);
app.use("/bank", BankRouter);
app.use("/ledger", LedgerRouter);
app.use("/ticket", TicketRouter);
app.use("/approval", ApprovalRouter);
app.use("/slip", TransactionSlipRoutes);
app.use("/wallet-transfer", WalletTransferRouter);
app.use("/location", locationRouters);
app.use("/portal", portalRouter);
app.use('/cryptoExchange', cryptoExhangeRouter)

// const extractPdfData = (pdfPath) => {
//     return new Promise((resolve, reject) => {
//         const pdfParser = new PDFParser();
//         pdfParser.loadPDF(pdfPath);

//         pdfParser.on("pdfParser_dataReady", (pdfData) => {
//             resolve(pdfData);
//         });

//         pdfParser.on("pdfParser_dataError", (err) => {
//             reject(err);
//         });
//     });
// };

// app.post("/read-statement", upload.single("file"), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: "No file uploaded" });
//     }

//     try {
//         const pdfPath = req.file.path;
//         const structuredData = await extractPdfData(pdfPath);
//         fs.unlinkSync(pdfPath); // Delete file after processing

//         const jsonResponse = await getTransactionsFromGPT(structuredData);

//         if (!jsonResponse) {
//             return res.status(500).json({ error: "Failed to process transactions" });
//         }

//         return res.json(JSON.parse(jsonResponse));
//     } catch (error) {
//         return res.status(500).json({ error: "Error processing PDF", details: error.message });
//     }
// });

// const getTransactionsFromGPT = async (structuredData) => {
//     const prompt = `
//         Convert the following structured PDF data into a JSON array of transactions with:
//         - date (DD-MM-YYYY format)
//         - description
//         - utr (if available, extract it)
//         - credit (if "CR", assign to credit; else 0)
//         - debit (if "DR", assign to debit; else 0)
//         - balance

//         Ensure the response is valid JSON **without markdown formatting** like \`\`\`json.

//         Example Output:
//         {
//           "transactions": [
//             { "date": "10-02-2024", "description": "Amazon Purchase", "utr": "123456", "credit": 0, "debit": 50.00, "balance": 950.00 },
//             { "date": "12-02-2024", "description": "Salary Credit", "utr": "789012", "credit": 2000.00, "debit": 0, "balance": 2950.00 }
//           ]
//         }

//         Structured PDF Data:
//         ${JSON.stringify(structuredData)}
//     `;

//     try {
//         const response = await axios.post(
//             "https://api.openai.com/v1/chat/completions",
//             {
//                 model: "gpt-4-turbo",
//                 messages: [{ role: "user", content: prompt }],
//                 temperature: 0.3
//             },
//             {
//                 headers: {
//                     "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
//                     "Content-Type": "application/json"
//                 }
//             }
//         );

//         let content = response.data.choices[0].message.content.trim();

//         // Remove Markdown Code Block (```json ... ```)
//         if (content.startsWith("```json")) {
//             content = content.replace(/^```json/, "").replace(/```$/, "").trim();
//         }

//         return JSON.parse(content);
//     } catch (error) {
//         console.error("Error calling ChatGPT API:", error.response?.data || error.message);
//         return { error: "Error processing transactions" };
//     }
// };

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/extract-utr", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }
  try {
    const { data } = await Tesseract.recognize(req.file.path, "eng");

    const extractedText = data.text;

    // const prompt = `
    //   Extract only the UTR from the following text. If UTR is not present, extract "UPI Reference No" or "UPI transaction ID".
    //   For UPI transaction  ID or UPI Reference No, the string is 12 digits so find out them in image.
    //   If none of these are found, return null.

    //   ---TEXT START---
    //   ${extractedText}
    //   ---TEXT END---

    //   Output only the extracted number, nothing else.
    // `;

    const prompt = `
  Extract the transaction identifier from the following text. Follow this priority:

  1. First, look for UTR (Unique Transaction Reference) number.
  2. If UTR is not found, look for a UPI Reference No or UPI Transaction ID (these are usually 12-digit numeric strings).
  3. If none of the above are present, look for a Hash . This is usually a long alphanumeric string (minimum 32 characters) used in crypto receipts.

  Only one value should be returned, based on the above priority.

  ---TEXT START---
  ${extractedText}
  ---TEXT END---

  Output only the extracted value (UTR, UPI ID, or Hash ID). Return null if nothing is found.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
    });

    const utr = response.choices[0].message.content.trim();

    fs.unlinkSync(req.file.path);

    res.json({ UTR: utr });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/extract-utr-text", async (req, res) => {
  try {
    const { utr, amount } = req.body;

    console.log("utr from text ==> ", utr);
    console.log("amount from text ==> ", amount);

    if (!utr) return res.status(200).json({ message: "UTR not received" });
    if (!amount) return res.status(200).json({ message: "Amount not received" });

    return res.status(200).json({ message: "UTR and Amount Delivered successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const declineOldLedgers = async () => {
  try {
    const data = await Admin.find();


    // Get the time threshold (default to 5 minutes if undefined)
    const timeThreshold = data[0]?.timeMinute ?? 5;
    const thresholdTime = new Date(Date.now() - timeThreshold * 60 * 1000);


    // Update only ledgers that were created MORE THAN the provided time ago
    const result = await Ledger.updateMany(
      {
        createdAt: { $lt: thresholdTime }, // Change here: Using `$lt` to get older ledgers
        status: 'Pending',
      },
      { $set: { status: "Decline", trnStatus: 'Transaction Decline', transactionLogs: [{ status: "Decline", date: new Date(), actionBy: "Auto", reason: "Auto Decline" }] } }
    );

  } catch (error) {
    console.error("Error updating ledgers:", error);
  }
};

setInterval(() => {
  declineOldLedgers()
}, 60*1000);

const fn_resetTimeZone = async () => {
  try {
    const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000); // IST timezone adjustment
    const todayStr = now.toISOString().split("T")[0]; // 'YYYY-MM-DD'

    // Find merchants where lastLimitResetDate is NOT today
    const merchants = await merchantModel.find({
      $expr: {
        $ne: [
          { $dateToString: { format: "%Y-%m-%d", date: "$lastLimitResetDate" } },
          todayStr
        ]
      }
    });

    const banks = await bankModel.find({
      $expr: {
        $ne: [
          { $dateToString: { format: "%Y-%m-%d", date: "$lastLimitResetDate" } },
          todayStr
        ]
      }
    });

    if (merchants.length > 0) {
      const bulkOps = merchants.map(merchant => ({
        updateOne: {
          filter: { _id: merchant._id },
          update: {
            $set: {
              lastLimitResetDate: now,
              remainingDailyMerchantLimit: merchant.dailyMerchantLimit
            }
          }
        }
      }));

      await merchantModel.bulkWrite(bulkOps);
      console.log("Merchant limits reset for date:", todayStr);
    } else {
      console.log("No merchants needed reset today.");
    };

    if (banks.length > 0) {
      const bulkOps = banks.map(bank => ({
        updateOne: {
          filter: { _id: bank._id },
          update: {
            $set: {
              lastLimitResetDate: now,
              remainingDailyLimit: bank.dailyLimit
            }
          }
        }
      }));

      await bankModel.bulkWrite(bulkOps);
      console.log("Banks limits reset for date:", todayStr);
    } else {
      console.log("No banks needed reset today.");
    };

  } catch (error) {
    console.error("Error resetting merchant limits:", error);
  }
};

const server = require('http').createServer(app)

const io = new Server(server, {
  cors: {
    cors: true,
  }
})


ledger.initializeSocket(io);


server.listen(process.env.PORT, () => {
  console.log(`Server runs at port ${process.env.PORT}`);
  setInterval(() => {
    fn_resetTimeZone();
  }, 5 * 60 * 1000);
});
