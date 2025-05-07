const Approval = require('../Models/ApprovalModel');
const Ledger = require('../Models/LedgerModel');
const jwt = require('jsonwebtoken');

// 1. Create 
const createData = async (req, res) => {
    try {


        const checkdata = await Approval.findOne({ merchantId: req.body.merchantId, ledgerId: req.body.ledgerId });

        if (checkdata) {


            await Ledger.findByIdAndUpdate(req.body.ledgerId,
                { approval: false, trnStatus: "Points Pending" },
                { new: true });

            await Approval.findByIdAndDelete(checkdata?._id);

            return res.status(200).json({ status: 'ok',  message: 'Data Removed Successfully!' });

        }
        else {
            const data = await Approval.create({
                ...req.body,
            });

            await Ledger.findByIdAndUpdate(req.body.ledgerId,
                { approval: true, trnStatus: "Points Approved" },
                { new: true });


            return res.status(200).json({ status: 'ok', data, message: 'Data Created Successfully!' });
        }



    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// 2. Get all s
const getAllStaffData = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Staff not found!' });
        }
        var where = {};

        // Ensure staffId is an object before assigning properties
        if (req.query.type) {
            where.staffId = where.staffId || {};
            where.staffId.type = req.query.type;
        }

        // If adminId is provided, override staffId as a direct value
        if (adminId) {
            where.staffId = adminId;
        }

        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Approval.find(where)
            .populate(['staffId', 'merchantId', 'ledgerId'])
            .sort({ createdAt: -1 });


        return res.status(200).json({ status: 'ok', data });
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
        var where = {}


        if (adminId) {
            where.merchantId = adminId
        }

        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Approval.find(where).populate(['staffId', 'merchantId', 'ledgerId']).sort({ createdAt: -1 });


        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Approval.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;


        const data = await Approval.findByIdAndUpdate(id,
            { ...req.body },
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
        await Approval.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};












module.exports = {
    createData,
    getAllStaffData,
    getAllMerchantData,
    getDataById,
    updateData,
    deleteData,
};
