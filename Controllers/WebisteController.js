const Website = require('../Models/WebsiteModel');
const Merchant = require('../Models/MerchantModel');
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

        if (!adminId){
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }

        const data = await Website.create({
            ...req.body,  merchantId: adminId,
        });


        return res.status(200).json({ status: 'ok', data, message: 'Data Created Successfully!' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 2. Get all s
const getAllWebData = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        
        const webData = await Merchant.findOne({ website : req.query.website });


        if (!webData) {
            return res.status(400).json({ status: 'fail', message: 'Website not found!' });
        }


        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Website.find({merchantId:webData?._id}).sort({ createdAt: -1 })




        return res.status(200).json({
            status: "ok",
            data,
        });

        // Find data created by the agent, sorted by `createdAt` in descending order

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





        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Website.find(query).sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();


        const count = await Website.find(query).sort({ createdAt: -1 }).countDocuments();;


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
        const data = await Website.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;


        const data = await Website.findByIdAndUpdate(id,
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
        await Website.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};







module.exports = {
    createData,
    getAllWebData,
    getAllMerchantData,
    getDataById,
    updateData,
    deleteData,
};
