const BankLog = require('../Models/BankLogModel');
const jwt = require('jsonwebtoken');


// 1. Create 
const createData = async (req, res) => {
    try {


        const data = await BankLog.create({
            ...req.body
        });

        return res.status(200).json({ status: 'ok', data, message: 'Data Created Successfully!' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// 2. Get all s
const getAllData = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        const query = {}




        var search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        var page = "1";
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = req.query.limit ? req.query.limit : "10";







        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await BankLog.find(query).sort({ createdAt: -1 }).populate([
            {
                path: "bankId",
            },
        ]).limit(limit * 1).skip((page - 1) * limit).exec();


        const count = await BankLog.find(query).populate([
            {
                path: "bankId",
            },
        ]).sort({ createdAt: -1 }).countDocuments();


        return res.status(200).json({
            status: 'ok', data,
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




// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await BankLog.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;
        const data = await BankLog.findByIdAndUpdate(id,
            { ...req.body, },
            { new: true });
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. Delete 
const deleteData = async (req, res) => {
    try {
        const id = req.params.id;
        await BankLog.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createData,
    getAllData,
    getDataById,
    updateData,
    deleteData,
};
