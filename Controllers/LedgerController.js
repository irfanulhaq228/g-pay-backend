const Ledger = require('../Models/LedgerModel');
const Merchant = require('../Models/MerchantModel');
const AdminStaff = require('../Models/AdminStaffModel');
const LedgerLog = require('../Models/LedgerLogModel');
const BankLog = require('../Models/BankLogModel');
const Withdraw = require('../Models/WithdrawModel');
const ExcelWithdraw = require('../Models/ExcelWithdrawModel');
const Bank = require('../Models/BankModel');
const jwt = require('jsonwebtoken');
const tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs");
const { notifySubscribers } = require('../Middleware/webhookService');
const excelWithdrawModel = require('../Models/ExcelWithdrawModel');
const mongoose = require("mongoose");
const { notifyUsers } = require('../socket/ledgerSocket');
const merchantModel = require('../Models/MerchantModel');
const withdrawModel = require('../Models/WithdrawModel');



// Function to extract amount and transaction ID from text
const extractDataFromText = (text) => {
    // Regex for specific currencies: INR (₹), USD ($), PKR, EUR (€), etc.
    const amountRegex = /\b(?:₹|INR|PKR|\$|USD|EUR|€)\s?\d{1,3}(,\d{3})*(\.\d{1,2})?\b/g;

    // Regex for transaction IDs, assuming they have a specific format like "TX12345"
    const transactionIdRegex = /\bTX[A-Z0-9]+\b/g;

    const amountMatch = text.match(amountRegex); // Matches currency amounts
    const transactionIdMatch = text.match(transactionIdRegex); // Matches transaction IDs

    return {
        amount: amountMatch ? amountMatch[0].replace(/,/g, '') : undefined, // Remove commas for clean output
        transactionId: transactionIdMatch ? transactionIdMatch[0] : undefined,
    };
};




// 1. Create 
const imageUploadData = async (req, res) => {
    try {


        try {

            const image = req.file;

            if (!image) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            // Perform OCR on the uploaded image
            const { data: { text } } = await tesseract.recognize(
                path.resolve(image.path),
                "eng"
            );



            // Extract data from the OCR result
            const extractedData = extractDataFromText(text);

            // Cleanup uploaded file
            fs.unlinkSync(image.path);


            return res.status(200).json({ status: 'ok', data: extractedData });


        } catch (error) {
            console.error("Error processing image:", error);
            return res.status(500).json({ error: "Failed to process the image" });
        }

    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};






// 1. Create 
const createData = async (req, res) => {
    try {
        const { website, bankId, total, utr } = req.body;


        if (!website) {
            return res.status(400).json({ status: 'fail', message: 'Please provide website!' });
        }
        if (!bankId) {
            return res.status(400).json({ status: 'fail', message: 'Please select bank account!' });
        }
        if (!total) {
            return res.status(400).json({ status: 'fail', message: 'Please provide the total amount for your ledger!' });
        }

        const duplicateUTR = await Ledger.findOne({ utr, status: { $in: ["Pending", "Approved"] } });
        if (duplicateUTR) {
            return res.status(400).json({ status: 'fail', message: 'Please upload a unique UTR transaction!' });
        }

        const websiteData = await Merchant.findOne({ website });
        const bankData = await Bank.findOne({ _id: bankId });

        if (!bankData) {
            return res.status(404).json({ status: 'fail', message: 'Bank not found!' });
        }

        // Check if the bank has enough transaction limit and remaining limit
        if (bankData.remainingTransLimit <= 1 || bankData.remainingLimit < total) {
            // Block the bank if limits exceeded
            await Bank.findByIdAndUpdate(bankData._id, { block: true }, { new: true });
            await BankLog.create({ bankId: bankData._id, status: 'Inactive', reason: 'Bank blocked due to limit exceeded.' });

            // Find another active bank with sufficient limits
            const availableBanks = await Bank.find({
                accountType: bankData.accountType,
                block: false,
                $expr: {
                    $and: [
                        { $gt: ["$remainingLimit", total] },
                        { $gt: ["$remainingTransLimit", 1] }
                    ]
                }
            });

            if (!availableBanks.length) {
                return res.status(400).json({ status: 'fail', message: 'All bank accounts have reached their limits. Please contact support!' });
            }

            // Activate the new bank
            await Bank.findByIdAndUpdate(availableBanks[0]._id, { block: false }, { new: true });
            await BankLog.create({ bankId: availableBanks[0]._id, status: 'Active', reason: 'Bank is automatically activated.' });

            return res.status(400).json({ status: 'fail', message: 'This bank has reached its limit. A new bank has been activated, please try again.' });
        }

        // Calculate amounts
        const adminTotal = (total * websiteData?.commision) / 100;
        const merchantTotal = total - adminTotal;
        const image = req.file?.path || "";

        // Create Ledger Entry
        const newLedger = await Ledger.create({
            ...req.body,
            image,
            merchantId: websiteData?._id,
            adminId: websiteData?.adminId,
            adminTotal,
            merchantTotal
        });


        const createDataLedger = await Ledger.findById(newLedger?._id).populate(['merchantId', "bankId"])

        notifyUsers(websiteData?._id, "ledgerUpdated", { type: "created", ledger: createDataLedger });


        return res.status(200).json({ status: 'ok', data: newLedger, message: 'Data created successfully!' });

    } catch (err) {
        console.error("Error creating data:", err);
        return res.status(500).json({ status: 'error', message: err.message });
    }
};






// 2. Get all 
const getAllAdminData = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;
        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        let { search = "", utr, status, type, trnNo, bankId, merchantId, adminStaffId, startDate, endDate } = req.query;
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        let query = { adminId };

        if (search) {
            query.$or = [
                { utr: { $regex: search, $options: "i" } },
                { trnNo: { $regex: search, $options: "i" } },
                { _id: { $regex: search, $options: "i" } }
            ];
        };

        if (utr) {
            query.$or = [
                { utr: { $regex: utr, $options: "i" } },
                { trnNo: { $regex: utr, $options: "i" } }
            ];
        };

        if (status) query.status = status;
        if (type) query.type = type;
        if (trnNo) query.trnNo = { $regex: trnNo, $options: "i" };
        if (bankId) query.bankId = bankId;
        if (merchantId) query.merchantId = merchantId;

        if (adminStaffId) {
            const dataStaff = await AdminStaff.findById(adminStaffId);
            if (dataStaff) {
                if (dataStaff.ledgerMerchant?.length) query.merchantId = { $in: dataStaff.ledgerMerchant };
                if (dataStaff.ledgerBank?.length) query.bankId = { $in: dataStaff.ledgerBank };
                if (dataStaff.ledgerType?.length) query.type = { $in: dataStaff.ledgerType };
            }
        }

        if (startDate && endDate) {
            const formatDate = (date) => {
                const d = new Date(date);
                return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
            };

            const start = formatDate(startDate);

            const end = formatDate(endDate);

            console.log("date ", startDate, endDate);

            const matchStage = {
                ...(status && { status }),
                ...(merchantId && { merchantId: new mongoose.Types.ObjectId(merchantId) }),
                ...(bankId && { bankId: new mongoose.Types.ObjectId(bankId) }),
                ...(utr && {
                    $or: [
                        { utr: { $regex: utr, $options: "i" } },
                        { trnNo: { $regex: utr, $options: "i" } }
                    ]
                }),
                createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
            };

            const countResult = await Ledger.aggregate([
                { $match: matchStage },
                { $count: "totalCount" }
            ]);

            const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;

            const data = await Ledger.aggregate([
                { $match: matchStage },
                {
                    $lookup: {
                        from: "banks",
                        localField: "bankId",
                        foreignField: "_id",
                        as: "bankId"
                    }
                },
                {
                    $lookup: {
                        from: "merchants",
                        localField: "merchantId",
                        foreignField: "_id",
                        as: "merchantId"
                    }
                },
                {
                    $unwind: {
                        path: "$bankId",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $unwind: {
                        path: "$merchantId",
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $sort: { createdAt: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit }
            ]);

            return res.status(200).json({
                status: "ok",
                data,
                search,
                page,
                count: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            });
        }


        const data = await Ledger.find(query).populate(["bankId", "merchantId", "adminStaffId"]).sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit).exec();

        const count = await Ledger.countDocuments(query);

        return res.status(200).json({
            status: "ok",
            data,
            search,
            page,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


const convertToGST = (utcDateStr) => {
    const utcDate = new Date(utcDateStr);

    // Convert UTC time to GST (UTC+4)
    const gstDate = new Date(utcDate.getTime() + 4 * 60 * 60 * 1000);

    // Format the output as ISO string with offset
    return gstDate.toISOString().replace("Z", "+04:00");
};


// 2. Get all s
const getAllAdminDataWithoutPag = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;
        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        let { search = "", utr, status, type, trnNo, bankId, merchantId, adminStaffId, startDate, endDate } = req.query;
        let query = { adminId };

        if (search) {
            query.$or = [
                { utr: { $regex: search, $options: "i" } },
                { trnNo: { $regex: search, $options: "i" } },
                { _id: { $regex: search, $options: "i" } }
            ];
        };

        if (utr) {
            query.$or = [
                { utr: { $regex: utr, $options: "i" } },
                { trnNo: { $regex: utr, $options: "i" } }
            ];
        };

        if (status) query.status = status;
        if (type) query.type = type;
        if (trnNo) query.trnNo = { $regex: trnNo, $options: "i" };
        if (bankId) query.bankId = bankId;
        if (merchantId) query.merchantId = merchantId;

        if (adminStaffId) {
            const dataStaff = await AdminStaff.findById(adminStaffId);
            if (dataStaff) {
                if (dataStaff.ledgerMerchant?.length) query.merchantId = { $in: dataStaff.ledgerMerchant };
                if (dataStaff.ledgerBank?.length) query.bankId = { $in: dataStaff.ledgerBank };
                if (dataStaff.ledgerType?.length) query.type = { $in: dataStaff.ledgerType };
            }
        }

        if (startDate && endDate) {
            const formatDate = (date) => {
                const d = new Date(date);
                return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
            };

            const start = formatDate(startDate);

            const end = formatDate(endDate);

            const matchStage = {
                ...(status && { status }),
                ...(merchantId && { merchantId: new mongoose.Types.ObjectId(merchantId) }),
                ...(bankId && { bankId: new mongoose.Types.ObjectId(bankId) }),
                ...(utr && {
                    $or: [
                        { utr: { $regex: utr, $options: "i" } },
                        { trnNo: { $regex: utr, $options: "i" } }
                    ]
                }),
                createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
            };

            const countResult = await Ledger.aggregate([
                { $match: matchStage },
                { $count: "totalCount" }
            ]);

            const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;

            const data = await Ledger.aggregate([
                { $match: matchStage },
                {
                    $lookup: {
                        from: "banks",
                        localField: "bankId",
                        foreignField: "_id",
                        as: "bankId"
                    }
                },
                {
                    $lookup: {
                        from: "merchants",
                        localField: "merchantId",
                        foreignField: "_id",
                        as: "merchantId"
                    }
                },
                {
                    $unwind: {
                        path: "$bankId",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $unwind: {
                        path: "$merchantId",
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $sort: { createdAt: -1 } }
            ]);

            return res.status(200).json({
                status: "ok",
                data,
                search,
                count: totalCount
            });
        }


        const data = await Ledger.find(query).populate(["bankId", "merchantId"]).sort({ createdAt: -1 }).exec();

        const count = await Ledger.countDocuments(query);

        return res.status(200).json({
            status: "ok",
            data,
            search,
            count
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 2. Get all s
const getAllMerchantData = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }


        var search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        var page = "1";
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = req.query.limit ? req.query.limit : "10";


        const query = {};

        query.merchantId = adminId

        if (search) {
            query.$or = [
                { utr: { $regex: req.query.search, $options: "i" } },
                { trnNo: { $regex: req.query.search, $options: "i" } }
            ];
        }


        if (req.query.status) {
            query.status = req.query.status;
        }

        if (req.query.utr) {
            query.utr = { $regex: req.query.utr, $options: "i" };
        }

        if (req.query.trnNo) {
            query.trnNo = { $regex: req.query.trnNo, $options: "i" };
        }

        if (req.query.trnStatus) {
            query.trnStatus = { $regex: req.query.trnStatus, $options: "i" };
        }


        if (req.query.type) {
            query.type = req.query.type;
        }

        if (req.query.bankId) {
            query.bankId = req.query.bankId;
        }


        // Filter by createdAt (date range)
        if (req.query.startDate || req.query.endDate) {
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate);

            // Ensure endDate includes the full day
            endDate.setUTCHours(23, 59, 59, 999);

            console.log(startDate, endDate);

            query.createdAt = { $gte: startDate, $lte: endDate };
        }





        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Ledger.find(query).populate(["bankId"]).sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();


        const count = await Ledger.find(query).populate(["bankId"]).sort({ createdAt: -1 }).countDocuments();

        console.log(count);


        return res.status(200).json({
            status: "ok",
            data,
            search,
            page,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 2. Get all s
const getAllMerchantDataWithoutFilter = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }


        var search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        var page = "1";
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = req.query.limit ? req.query.limit : "10";


        const query = {};

        query.merchantId = adminId


        if (search) {
            query.utr = { $regex: ".*" + search + ".*", $options: "i" };
            query._id = { $regex: ".*" + search + ".*", $options: "i" };
        }

        if (req.query.status) {
            query.status = req.query.status;
        }



        if (req.query.utr) {
            query.utr = { $regex: req.query.utr, $options: "i" };
        }

        if (req.query.trnNo) {
            query.trnNo = { $regex: req.query.trnNo, $options: "i" };
        }

        if (req.query.trnStatus) {
            query.trnStatus = { $regex: req.query.trnStatus, $options: "i" };
        }


        if (req.query.type) {
            query.type = req.query.type;
        }

        if (req.query.bankId) {
            query.bankId = req.query.bankId;
        }


        // Filter by createdAt (date range)
        if (req.query.startDate || req.query.endDate) {
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate);

            // Ensure endDate includes the full day
            endDate.setUTCHours(23, 59, 59, 999);

            console.log(startDate, endDate);

            query.createdAt = { $gte: startDate, $lte: endDate };
        }



        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Ledger.find(query).populate(["bankId"]).sort({ createdAt: -1 })


        return res.status(200).json({
            status: "ok",
            data
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 2. Get all s
const getAllUserData = async (req, res) => {
    try {
        const origin = req.get('Origin');



        const merchantdata = await Merchant.findOne({ merchantWebsite: origin, block: false, verify: true });



        if (!origin || origin === "") {
            return res.status(400).json({ status: "fail", message: "Unauthorized" });
        }



        let query = {}

        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        let page = "1";
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = req.query.limit ? req.query.limit : "10";


        if (search) {
            query.$or = [
                { utr: { $regex: ".*" + search + ".*", $options: "i" } },
                { _id: { $regex: ".*" + search + ".*", $options: "i" } },
            ];
        }

        if (req.query.status) {
            query.status = req.query.status;
        }


        if (req.query.utr) {
            query.utr = { $regex: req.query.utr, $options: "i" };
        }

        if (req.query.trnNo) {
            query.trnNo = { $regex: req.query.trnNo, $options: "i" };
        }


        if (req.query.type) {
            query.type = req.query.type;
        }

        if (req.query.username) {
            query.username = req.query.username?.toLowerCase();
        }

        query.merchantId = merchantdata?._id;

        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};
            if (req.query.startDate) {
                query.createdAt.$gte = new Date(req.query.startDate).setHours(0, 0, 0, 0);
            }
            if (req.query.endDate) {
                query.createdAt.$lte = new Date(req.query.endDate).setHours(23, 59, 59, 999);
            }
        }

        const data = await Ledger.find(query)
            .populate([
                {
                    path: "bankId",
                    select: 'bankName'
                },
            ]).select('image utr amount tax total status username createdAt updatedAt trnNo')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Ledger.countDocuments(query);

        return res.status(200).json({
            status: "ok",
            data,
            search,
            page,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};






// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Ledger.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};







// 3. Get  by id
const getCardAdminData = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;

        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        const { status, filter, startDate, endDate } = req.query;

        const fn_calculation = async (data) => {

            const allMerchant = await Merchant.find({ adminId });

            const totalSum = data.reduce((sum, record) => sum + (record.total || 0), 0);
            const merchantTotalSum = data.reduce((sum, record) => sum + (record.merchantTotal || 0), 0);
            const adminTotalSum = data.reduce((sum, record) => sum + (record.adminTotal || 0), 0);
            const merchantAvailBalance = allMerchant.reduce((sum, record) => sum + (record.wallet || 0), 0);

            return res.status(200).json({
                status: 'ok',
                data: totalSum,
                merchantTotalSum,
                adminTotalSum,
                totalTransaction: data?.length || 0,
                merchantAvailBalance
            });
        };

        if (filter === "today") {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0); // Start of today in UTC

            const endOfToday = new Date();
            endOfToday.setUTCHours(23, 59, 59, 999); // End of today in UTC

            console.log("Date range for today:", today.toISOString(), endOfToday.toISOString());

            const data = await Ledger.aggregate([
                {
                    $match: {
                        createdAt: { $gte: today, $lte: endOfToday }, // Direct date comparison
                        status: status
                    }
                }
            ]);

            return fn_calculation(data);
        };

        if (filter === "7days") {
            const today = new Date();
            today.setUTCHours(23, 59, 59, 999); // Set end of today in UTC

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
            sevenDaysAgo.setUTCHours(0, 0, 0, 0); // Set start of the 7th day in UTC

            console.log("Date range for 7 days:", sevenDaysAgo.toISOString(), today.toISOString());

            const data = await Ledger.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo, $lte: today }, // Direct date comparison
                        status: status
                    }
                }
            ]);

            return fn_calculation(data);
        };

        if (filter === "30days") {
            const today = new Date();
            today.setUTCHours(23, 59, 59, 999); // Ensure end of today in UTC
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setUTCDate(today.getUTCDate() - 30);
            thirtyDaysAgo.setUTCHours(0, 0, 0, 0); // Ensure start of the day in UTC

            console.log("Date range for 30 days:", thirtyDaysAgo.toISOString(), today.toISOString());

            const data = await Ledger.aggregate([
                {
                    $match: {
                        "createdAt": { $gte: thirtyDaysAgo, $lte: today },
                        "status": status
                    }
                }
            ]);

            return fn_calculation(data);
        };

        if (filter === "all") {
            const data = await Ledger.aggregate([
                {
                    $match: {
                        "status": status
                    }
                }
            ]);

            return fn_calculation(data);
        };

        if (filter === "custom") {
            const start = new Date(startDate);
            start.setUTCHours(0, 0, 0, 0); // Start of the selected start day in UTC

            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999); // End of the selected end day in UTC

            console.log("Formatted Date Range:", start.toISOString(), end.toISOString());

            const data = await Ledger.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end }, // Direct date comparison
                        status: status
                    }
                }
            ]);

            return fn_calculation(data);
        }

        const data = await Ledger.aggregate([
            {
                $match: {
                    "status": status
                }
            }
        ]);

        return fn_calculation(data);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};






// 3. Get  by id
const getMonthlyAdminData = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;
        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        // Fetch all records for the admin
        const records = await Ledger.find({ adminId });

        // Initialize a full-year structure
        const currentYear = new Date().getFullYear();
        const fullYearData = {};
        for (let month = 1; month <= 12; month++) {
            fullYearData[`${currentYear}-${month}`] = { year: currentYear, month, statuses: {} };
        }

        // Process ledger records
        records.forEach((record) => {
            const createdAt = new Date(record.createdAt);
            const year = createdAt.getFullYear();
            const month = createdAt.getMonth() + 1;
            const status = record.status;
            const total = record.total || 0;
            const key = `${year}-${month}`;

            if (!fullYearData[key]) {
                fullYearData[key] = { year, month, statuses: {} };
            }
            if (!fullYearData[key].statuses[status]) {
                fullYearData[key].statuses[status] = 0;
            }
            fullYearData[key].statuses[status] += total;
        });

        // Convert to array for response
        const formattedReport = Object.values(fullYearData);

        return res.status(200).json({ status: 'ok', data: formattedReport });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};






// 3. Get  by id

const getMonthlyMerchantData = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const merchantId = decoded.adminId;
        if (!merchantId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }

        // Fetch all records for the merchant
        const records = await Ledger.find({ merchantId });

        // Initialize a full-year structure
        const currentYear = new Date().getFullYear();
        const fullYearData = {};
        for (let month = 1; month <= 12; month++) {
            fullYearData[`${currentYear}-${month}`] = { year: currentYear, month, statuses: {} };
        }

        // Process ledger records
        records.forEach((record) => {
            const createdAt = new Date(record.createdAt);
            const year = createdAt.getFullYear();
            const month = createdAt.getMonth() + 1;
            const status = record.status;
            const total = record.total || 0;
            const key = `${year}-${month}`;

            if (!fullYearData[key]) {
                fullYearData[key] = { year, month, statuses: {} };
            }
            if (!fullYearData[key].statuses[status]) {
                fullYearData[key].statuses[status] = 0;
            }
            fullYearData[key].statuses[status] += total;
        });

        // Convert to array for response
        const formattedReport = Object.values(fullYearData);

        return res.status(200).json({ status: 'ok', data: formattedReport });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};





const getTransactionSummaryByAdmin = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;
        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }
        var { status, startDate, endDate, merchantId, bankId } = req.query;

        if (merchantId) {
            merchantId = JSON.parse(merchantId)
        }


        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) {
                dateFilter.createdAt.$gte = new Date(startDate).setHours(0, 0, 0, 0);
            }
            if (endDate) {
                dateFilter.createdAt.$lte = new Date(endDate).setHours(23, 59, 59, 999);
            }
        }

        // Handle multiple merchantIds
        let merchantFilter = {};
        if (merchantId) {
            // Check if merchantId is an array or a comma-separated string
            if (Array.isArray(merchantId)) {
                merchantFilter.merchantId = { $in: merchantId };
            } else if (merchantId.includes(',')) {
                merchantFilter.merchantId = { $in: merchantId.split(',') };
            } else {
                merchantFilter.merchantId = merchantId;
            }
        }

        const query = {
            ...dateFilter,
            ...(status && { status }),
            ...merchantFilter,
            ...(bankId && { bankId })
        };

        const data = await Ledger.find(query);
        let groupedData = {};
        // Iterate through each day in the range
        let currentDate = new Date(startDate);
        const end = new Date(endDate);
        while (currentDate <= end) {
            const dateKey = currentDate.toISOString().split('T')[0];

            // Update vendor display for multiple merchantIds
            let vendorDisplay = 'All';
            if (merchantId) {
                if (Array.isArray(merchantId) || merchantId.includes(',')) {
                    vendorDisplay = 'Multiple';
                } else {
                    vendorDisplay = merchantId;
                }
            }

            groupedData[dateKey] = {
                Date: dateKey,
                Vendor: vendorDisplay,
                Status: status || 'All',
                Bank: bankId || 'All',
                NoOfTransaction: 0,
                PayIn: 0,
                Charges: 0,
                Amount: 0
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        data.forEach(record => {
            const dateKey = new Date(record.createdAt).toISOString().split('T')[0];
            if (groupedData[dateKey]) {
                groupedData[dateKey].NoOfTransaction++;
                groupedData[dateKey].PayIn += record.total || 0;
                groupedData[dateKey].Charges += record.adminTotal || 0;
                groupedData[dateKey].Amount += record.merchantTotal || 0;
            }
        });

        const responseData = Object.values(groupedData).sort((a, b) => new Date(a.Date) - new Date(b.Date));
        const totalTransaction = responseData.reduce((sum, item) => sum + item.NoOfTransaction, 0);
        const totalPayIn = responseData.reduce((sum, item) => sum + item.PayIn, 0);
        const totalCharges = responseData.reduce((sum, item) => sum + item.Charges, 0);
        const totalAmount = responseData.reduce((sum, item) => sum + item.Amount, 0);

        await LedgerLog.create({ ...req.query, merchantId });

        return res.status(200).json({
            status: 'ok',
            data: responseData,
            totalTransaction,
            totalPayIn,
            totalCharges,
            totalAmount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




const getTransactionSummaryByAdminTest = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;
        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }
        var { status, startDate, endDate, merchantId, bankId } = req.query;

        if (merchantId) {
            merchantId = JSON.parse(merchantId);
        }

        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) {
                dateFilter.createdAt.$gte = new Date(startDate).setHours(0, 0, 0, 0);
            }
            if (endDate) {
                dateFilter.createdAt.$lte = new Date(endDate).setHours(23, 59, 59, 999);
            }
        }

        let merchantFilter = {};
        if (merchantId) {
            if (Array.isArray(merchantId)) {
                merchantFilter.merchantId = { $in: merchantId };
            } else if (merchantId.includes(',')) {
                merchantFilter.merchantId = { $in: merchantId.split(',') };
            } else {
                merchantFilter.merchantId = merchantId;
            }
        }

        const query = {
            ...dateFilter,
            ...(status && { status }),
            ...merchantFilter,
            ...(bankId && { bankId })
        };

        const payInData = await Ledger.find(query);
        const payouts = await Withdraw.find(query);
        const excelPayouts = await ExcelWithdraw.find(query);

        let vendorDisplay = 'All';
        if (merchantId) {
            if (Array.isArray(merchantId) || merchantId.includes(',')) {
                vendorDisplay = 'Multiple';
            } else {
                vendorDisplay = merchantId;
            }
        }

        // Create separate data structures for payIn and payout
        let payInByDate = {};
        let payoutByDate = {};

        // Initialize date range for both structures
        let currentDate = new Date(startDate);
        const end = new Date(endDate);
        while (currentDate <= end) {
            const dateKey = currentDate.toISOString().split('T')[0];

            payInByDate[dateKey] = {
                Date: dateKey,
                Vendor: vendorDisplay,
                Status: status || 'All',
                Bank: bankId || 'All',
                NoOfTransaction: 0,
                PayIn: 0,
                Charges: 0,
                Amount: 0,
                Type: 'payIn'
            };

            payoutByDate[dateKey] = {
                Date: dateKey,
                Vendor: vendorDisplay,
                Status: status || 'All',
                Bank: bankId || 'All',
                NoOfTransaction: 0,
                Amount: 0,
                Type: 'payout'
            };

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Process payIn data
        payInData.forEach(record => {
            const dateKey = new Date(record.createdAt).toISOString().split('T')[0];
            if (payInByDate[dateKey]) {
                payInByDate[dateKey].NoOfTransaction++;
                payInByDate[dateKey].PayIn += record.total || 0;
                payInByDate[dateKey].Charges += record.adminTotal || 0;
                payInByDate[dateKey].Amount += record.merchantTotal || 0;
            }
        });

        // Process payout data
        [...payouts, ...excelPayouts].forEach(record => {
            const dateKey = new Date(record.createdAt).toISOString().split('T')[0];
            if (payoutByDate[dateKey]) {
                payoutByDate[dateKey].Amount += record.amount || 0;
                payoutByDate[dateKey].NoOfTransaction++;
            }
        });

        // Convert to arrays
        const payInArray = Object.values(payInByDate);
        const payoutArray = Object.values(payoutByDate);

        // Combine arrays and sort by date
        const combinedArray = [...payInArray, ...payoutArray].sort((a, b) => new Date(a.Date) - new Date(b.Date));

        // Calculate totals for payIn
        const totalPayInTransaction = payInArray.reduce((sum, item) => sum + (item.NoOfTransaction || 0), 0);
        const totalPayIn = payInArray.reduce((sum, item) => sum + (item.PayIn || 0), 0);
        const totalCharges = payInArray.reduce((sum, item) => sum + (item.Charges || 0), 0);
        const totalPayInAmount = payInArray.reduce((sum, item) => sum + (item.Amount || 0), 0);

        // Calculate totals for payout
        const totalPayoutTransaction = payoutArray.reduce((sum, item) => sum + (item.NoOfTransaction || 0), 0);
        const totalPayoutAmount = payoutArray.reduce((sum, item) => sum + (item.Amount || 0), 0);

        await LedgerLog.create({ ...req.query, merchantId });

        return res.status(200).json({
            status: 'ok',
            data: combinedArray,
            payIn: {
                data: payInArray.sort((a, b) => new Date(a.Date) - new Date(b.Date)),
                totalTransaction: totalPayInTransaction,
                totalPayIn: totalPayIn,
                totalCharges: totalCharges,
                totalAmount: totalPayInAmount
            },
            payout: {
                data: payoutArray.sort((a, b) => new Date(a.Date) - new Date(b.Date)),
                totalTransaction: totalPayoutTransaction,
                totalAmount: totalPayoutAmount
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};








// 3. Get  by id
const getMerchantWithdrawData = async (req, res) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token && req.query.merchantId) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }
        if (req.query.merchantId) {
            adminId = req.query.merchantId
        }


        const query = {
            status: 'Approved',
            merchantId: adminId
        };

        const queryPending = {
            status: 'Pending',
            merchantId: adminId
        };

        const queryDecline = {
            status: 'Decline',
            merchantId: adminId
        };

        const merchantData = await Merchant.findById(adminId);
        const data = await Ledger.find(query);
        const dataWithdraw = await Withdraw.find(query);
        const dataWithdrawExcel = await excelWithdrawModel.find(query);
        const dataWithdrawPending = await Withdraw.find(queryPending);
        const dataExcelWithdrawPending = await excelWithdrawModel.find(queryPending);
        const dataWithdrawDecline = await Withdraw.find(queryDecline);


        const merchantTotalSum = data.reduce((sum, record) => sum + (record.merchantTotal || 0), 0);

        const merchantWithdrawSum = dataWithdraw.reduce((sum, record) => sum + (record.amountINR || 0), 0);
        const merchantWithdrawExcelSum = dataWithdrawExcel.reduce((sum, record) => sum + (record.amount || 0), 0);

        const merchantWithdrawSumPending = dataWithdrawPending.reduce((sum, record) => sum + (record.amountINR || 0), 0);

        const excelWithdrawSumPending = dataExcelWithdrawPending.reduce((sum, record) => sum + (record.amount || 0), 0);

        const merchantDecllineSumPending = dataWithdrawDecline.reduce((sum, record) => sum + (record.amountINR || 0), 0);



        const dataWithdrawexcel = await ExcelWithdraw.find(query);
        const dataWithdrawPendingexcel = await ExcelWithdraw.find(queryPending);
        const dataWithdrawDeclineexcel = await ExcelWithdraw.find(queryDecline);



        const merchantWithdrawSumexcel = dataWithdrawexcel.reduce((sum, record) => sum + (record.amount || 0), 0);

        const merchantWithdrawSumPendingexcel = dataWithdrawPendingexcel.reduce((sum, record) => sum + (record.amount || 0), 0);





        return res.status(200).json({
            status: 'ok',
            totalAmount: merchantTotalSum,
            withdrawAmounts: merchantWithdrawSumPending + excelWithdrawSumPending,
            approvedWithdraw: merchantWithdrawSum + merchantWithdrawExcelSum,
            pendingAmount: merchantData?.wallet
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 3. Get  by id
const getMerchantExcelWithdrawData = async (req, res) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token && req.query.merchantId) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }
        if (req.query.merchantId) {
            adminId = req.query.merchantId
        }


        const query = {
            status: 'Approved',
            merchantId: adminId
        };

        const queryPending = {
            status: 'Pending',
            merchantId: adminId
        };

        const queryDecline = {
            status: 'Decline',
            merchantId: adminId
        };

        const merchantData = await Merchant.findById(adminId);
        const dataWithdraw = await ExcelWithdraw.find(query);
        const dataWithdrawPending = await ExcelWithdraw.find(queryPending);
        const dataWithdrawDecline = await ExcelWithdraw.find(queryDecline);



        const merchantWithdrawSum = dataWithdraw.reduce((sum, record) => sum + (record.amount || 0), 0);

        const merchantWithdrawSumPending = dataWithdrawPending.reduce((sum, record) => sum + (record.amount || 0), 0);


        return res.status(200).json({
            status: 'ok',
            withdrawAmounts: merchantWithdrawSumPending,
            approvedWithdraw: merchantWithdrawSum,
            pendingAmount: merchantData?.wallet
        });

        // return res.status(200).json({
        //     status: 'ok', totalAmount: merchantTotalSum,
        //     withdrawAmounts: merchantWithdrawSumPending,
        //     approvedWithdraw: merchantWithdrawSum,
        //     pendingAmount: merchantTotalSum - merchantWithdrawSum - merchantWithdrawSumPending
        // });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 3. Get  by id
const getCardMerchantData = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        var adminId = decoded.adminId;


        if (typeof adminId === "string") {
            adminId = new mongoose.Types.ObjectId(adminId);
        }

        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }

        const { status, filter, startDate, endDate } = req.query;

        const getMerchant = await Merchant.findById(adminId);


        const fn_calculation = async (data) => {

            const totalSum = data.reduce((sum, record) => sum + (record.total || 0), 0);
            const merchantTotalSum = data.reduce((sum, record) => sum + (record.merchantTotal || 0), 0);
            const adminTotalSum = data.reduce((sum, record) => sum + (record.adminTotal || 0), 0);



            return res.status(200).json({
                status: 'ok',
                data: totalSum,
                merchantTotalSum,
                adminTotalSum,
                totalTransaction: data?.length || 0,
                availableWithdraw: getMerchant?.wallet
            });
        };

        if (filter === "today") {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0); // Start of today in UTC

            const endOfToday = new Date();
            endOfToday.setUTCHours(23, 59, 59, 999); // End of today in UTC

            console.log("Date range for today:", today.toISOString(), endOfToday.toISOString());

            const data = await Ledger.aggregate([
                {
                    $match: {
                        createdAt: { $gte: today, $lte: endOfToday }, // Direct date comparison
                        status: status,
                        merchantId: adminId
                    }
                }
            ]);

            return fn_calculation(data);
        }


        if (filter === "7days") {
            const today = new Date();
            today.setUTCHours(23, 59, 59, 999); // Set end of today in UTC

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
            sevenDaysAgo.setUTCHours(0, 0, 0, 0); // Set start of the 7th day in UTC

            console.log("Date range for 7 days:", sevenDaysAgo.toISOString(), today.toISOString());

            const data = await Ledger.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo, $lte: today }, // Direct date comparison
                        status: status,
                        merchantId: adminId
                    }
                }
            ]);

            return fn_calculation(data);
        }




        if (filter === "30days") {
            const today = new Date();
            today.setUTCHours(23, 59, 59, 999); // Ensure end of today in UTC
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setUTCDate(today.getUTCDate() - 30);
            thirtyDaysAgo.setUTCHours(0, 0, 0, 0); // Ensure start of the day in UTC

            console.log("Date range for 30 days:", thirtyDaysAgo.toISOString(), today.toISOString());

            const data = await Ledger.aggregate([
                {
                    $match: {
                        "createdAt": { $gte: thirtyDaysAgo, $lte: today },
                        "status": status,
                        merchantId: adminId
                    }
                }
            ]);

            return fn_calculation(data);
        }




        if (filter === "all") {
            const data = await Ledger.aggregate([
                {
                    $match: {
                        "status": status,
                        merchantId: adminId
                    }
                }
            ]);

            return fn_calculation(data);
        };

        if (filter === "custom") {
            const start = new Date(startDate);
            start.setUTCHours(0, 0, 0, 0); // Start of the selected start day in UTC

            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999); // End of the selected end day in UTC

            console.log("Formatted Date Range:", start.toISOString(), end.toISOString());

            const data = await Ledger.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end }, // Direct date comparison
                        status: status,
                        merchantId: adminId
                    }
                }
            ]);

            return fn_calculation(data);
        }


        const data = await Ledger.aggregate([
            {
                $match: {
                    "status": status,
                    merchantId: adminId
                }
            }
        ]);

        return fn_calculation(data);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 3. Get  by id
const getCardMerchantDataByAdmin = async (req, res) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }



        const { status, filter, merchantId } = req.query;




        let dateFilter = {};



        const now = new Date();

        // Apply time filter
        switch (filter) {
            case 'today':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.setHours(0, 0, 0, 0)), // Start of today
                        $lt: new Date(now.setHours(23, 59, 59, 999)), // End of today
                    },
                };
                break;
            case '7days':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.setDate(now.getDate() - 7)), // 7 days ago
                    },
                };
                break;
            case '30days':
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.setDate(now.getDate() - 30)), // 30 days ago
                    },
                };
                break;
            case 'all':
            default:
                dateFilter = {}; // No date filter
                break;
        }

        const query = {
            ...dateFilter,
            ...(status && { status }), // Include status if provided
            merchantId: merchantId
        };

        const data = await Ledger.find(query);


        const totalSum = data.reduce((sum, record) => sum + (record.total || 0), 0);



        const merchantTotalSum = data.reduce((sum, record) => sum + (record.merchantTotal || 0), 0);

        const adminTotalSum = data.reduce((sum, record) => sum + (record.adminTotal || 0), 0);


        return res.status(200).json({ status: 'ok', data: totalSum, merchantTotalSum, adminTotalSum, totalTransaction: data.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 3. Get  by id
const getBankMerchantDataByAdmin = async (req, res) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }



        const { merchantId } = req.query;

        var query = {}

        query.merchantId = merchantId


        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};

            // If startDate is provided
            if (req.query.startDate) {
                const startDate = new Date(req.query.startDate);
                startDate.setHours(0, 0, 0, 0); // Set time to the beginning of the day (00:00:00)
                query.createdAt.$gte = startDate;
            }

            // If endDate is provided
            if (req.query.endDate) {
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999); // Set time to the end of the day (23:59:59)
                query.createdAt.$lte = endDate;
            }

            // If startDate and endDate are the same, this will ensure it gets the full range within that day
            if (req.query.startDate === req.query.endDate) {
                query.createdAt = {
                    $gte: new Date(req.query.startDate).setHours(0, 0, 0, 0),
                    $lte: new Date(req.query.endDate).setHours(23, 59, 59, 999),
                };
            }
        }


        const filteredTransactions = await Ledger.find(query);

        const ledger = {};
        filteredTransactions.forEach(txn => {
            if (!ledger[txn.bankId]) {
                ledger[txn.bankId] = { Approved: 0, Pending: 0, Decline: 0 };
            }
            ledger[txn.bankId][txn.status] += (txn.total);
        });




        return res.status(200).json({ status: 'ok', data: ledger, });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;
        console.log("update request: ", req.body);


        let getImage = await Ledger.findById(id);
        const image = req.file === undefined ? getImage?.image : req.file?.path;
        let activity = "";
        if (req.body.website || req.body.username) {
            if (req.body.website !== getImage?.site && req.body.username !== getImage?.username) {
                activity = "Both Website and UserId are changed"
            } else if (req.body.website !== getImage?.site && req.body.username === getImage?.username) {
                activity = "Website is changed"
            } else if (req.body.website === getImage?.site && req.body.username !== getImage?.username) {
                activity = "UserId is changed"
            }
        }



        if (req.body.status === 'Approved' && getImage?.trnStatus !== 'Approved') {
            console.log("=========================================================================================")
            let bankData = await Bank.findById(getImage?.bankId);
            await Merchant.findByIdAndUpdate(getImage.merchantId, { $inc: { wallet: getImage?.merchantTotal } }, { new: true });


            const remainingTransLimit = bankData?.remainingTransLimit - 1
            const remainingLimit = bankData?.remainingLimit - getImage?.total




            if ((remainingTransLimit === 0) && (remainingLimit <= 0)) {

                await Bank.findOneAndUpdate({ _id: bankData?._id }, { block: true }, { new: true });
                await BankLog.create({ bankId: bankData?._id, status: 'InActive', reason: 'Due to Transaction Limit Exceed.' })


                const banks = await Bank.find({
                    accountType: bankData?.accountType,
                    $expr: {
                        $and: [
                            { $gt: ["$remainingLimit", getImage?.total] },
                            { $gt: ["$remainingTransLimit", 1] }
                        ]
                    }
                });

                if (banks?.length === 0) {
                    return res.status(400).json({ status: 'fail', message: 'All bank accounts reach the maximum limit of transaction. Please contact to the support!' });
                }

                await Bank.findOneAndUpdate(
                    { _id: banks[0]._id },
                    { block: false, },
                    { new: true }
                );




                await BankLog.create({ bankId: banks[0]?._id, status: 'Active', reason: 'Bank is Active automatically.' })

            }
            else {
                await Bank.findByIdAndUpdate(bankData?._id,
                    { remainingTransLimit, remainingLimit },
                    { new: true });
            }

        }

        if (req.body.status === "Decline" && getImage?.status === "Approved") {
            
            await Merchant.findByIdAndUpdate(getImage.merchantId, { $inc: { wallet: -getImage?.merchantTotal } }, { new: true });

            let bankData = await Bank.findById(getImage?.bankId);

            const remainingTransLimit = bankData?.remainingTransLimit + 1
            const remainingLimit = bankData?.remainingLimit + getImage?.total

            await Bank.findByIdAndUpdate(bankData?._id,
                { remainingTransLimit: remainingTransLimit },
                { remainingLimit: remainingLimit },
            );
        }

        const data = await Ledger.findByIdAndUpdate(
            id,
            {
                ...req.body,
                image: image,
                activity,
                ...(req.body.status === "Approved" && !getImage?.walletCredit && { walletCredit: true }),
                ...(req.body.status === "Decline" && getImage?.walletCredit && { walletCredit: false })
            },
            { new: true }
        );

        const updateDataLedger = await Ledger.findById(data?._id).populate(['merchantId', "bankId", "adminStaffId"])


        notifyUsers(getImage.merchantId, "ledgerUpdated", { type: "updated", ledger: updateDataLedger });


        if (req.body.status) {
            await notifySubscribers('ledger.status.updated', {
                transactionId: data?.trnNo,
                amount: data?.total,
                username: data?.username,
                status: req.body.status
            }, data?.merchantId?.toHexString());
        }

        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



// 5. Delete 
const deleteData = async (req, res) => {
    try {
        const id = req.params.id;
        await Ledger.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};






const compareDataReport = async (req, res) => {
    try {
        const { utr, total } = req.body;
        const data = await Ledger.findOne({ utr, status: "Pending", total });
        if (!data) {
            return res.status(400).json({ status: 'fail', message: 'No such transaction found!' });
        }

        const updateData = await Ledger.findByIdAndUpdate(data?._id,
            { status: 'Verified' },
            { new: true });


        return res.status(200).json({ status: 'ok', data: updateData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};










module.exports = {
    createData,
    imageUploadData,
    getAllAdminData,
    getAllAdminDataWithoutPag,
    getAllMerchantData,
    getAllMerchantDataWithoutFilter,
    getCardMerchantDataByAdmin,
    getTransactionSummaryByAdmin,
    getTransactionSummaryByAdminTest,
    getAllUserData,
    getDataById,
    updateData,
    deleteData,
    getCardAdminData,
    getBankMerchantDataByAdmin,
    getCardMerchantData,
    getMonthlyAdminData,
    getMonthlyMerchantData,
    compareDataReport,
    getMerchantWithdrawData,
    getMerchantExcelWithdrawData
};
