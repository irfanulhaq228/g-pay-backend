const WithdrawBank = require('../Models/WithdrawBankModel');
const jwt = require('jsonwebtoken');






// 1. Create 
const createData = async (req, res) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }


        const image = req.file;

        const data = await WithdrawBank.create({
            ...req.body, merchantId: adminId, image: image ? image?.path : "",
        });


        return res.status(200).json({ status: 'ok', data, message: 'Data Created Successfully!' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};







// 2. Get all s

const getAllMerchantData = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token && !req.query.merchantId) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let adminId = decoded.adminId;

        // Allow overriding adminId from body if provided
        if (req.query.merchantId) {
            adminId = req.query.merchantId;
        }

        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }

        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const query = { merchantId: adminId };

        if (req.query.status) {
            query.status = req.query.status;
        } else if (search) {
            query.status = { $regex: ".*" + search + ".*", $options: "i" };
        }

        if (req.query.accountType) {
            query.accountType = req.query.accountType;
        }

        // Fetch data
        const data = await WithdrawBank.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await WithdrawBank.countDocuments(query);

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






// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await WithdrawBank.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;

        let getImage = await WithdrawBank.findById(id);
        const image = req.file === undefined ? getImage?.image : req.file?.path;

        const data = await WithdrawBank.findByIdAndUpdate(id,
            { ...req.body, image },
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
        await WithdrawBank.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};







module.exports = {
    createData,
    getAllMerchantData,
    getDataById,
    updateData,
    deleteData,
};
