const Merchant = require('../Models/MerchantModel');
const Admin = require('../Models/AdminModel');
const Staff = require('../Models/StaffModel');
const jwt = require('jsonwebtoken');
var getIP = require('ipware')().get_ip;
const { lookup } = require('geoip-lite');
const loginHistoryModel = require("../Models/LoginHistoryModel");
const moment = require("moment");
const WebhookSubscriber = require('../Models/WebhookSubscriberModel');

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
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        const email = await Merchant.findOne({ email: req.body.email });
        const emailStaff = await Staff.findOne({ email: req.body.email });

        if (email && emailStaff) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const phone = await Merchant.findOne({ phone: req.body.phone });

        if (phone) {
            return res.status(409).json({ message: 'Phone already exists' });
        }



        const merchantName = await Merchant.findOne({ merchantName: req.body.merchantName });

        if (merchantName) {
            return res.status(409).json({ message: 'Merchant name already exists' });
        }



        const image = req.file;

        const data = await Merchant.create({
            ...req.body, image: image ? image?.path : "", adminId
        });


        await WebhookSubscriber.create({
            url: req.body.webhookUrl
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

        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Merchant.find({ adminId }).sort({ createdAt: -1 });


        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Merchant.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// 3. Get  by id
const getDataByWebsite = async (req, res) => {
    try {
        const website = req.query.website;

        console.log(website);
        
        const data = await Merchant.findOne({website:website}).select('-password');
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;


        let getImage = await Merchant.findById(id);
        const image = req.file === undefined ? getImage?.image : req.file?.path;


        const data = await Merchant.findByIdAndUpdate(id,
            { ...req.body, image: image },
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
        await Merchant.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




const loginData = async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await Merchant.findOne({ email });
        const dataStaff = await Staff.findOne({ email }).populate(['merchantId']);
        if (data) {
            if (data?.block) {
                return res.status(400).json({ message: "Merchant blocked from admin." });
            }
            if (data?.password !== password) {
                return res.status(400).json({ message: "Incorrect Email or Password" })
            }

            var ipInfo = getIP(req);
            const look = lookup(ipInfo?.clientIp);

            const city = `${look?.city}, ${look?.region} ${look?.country}`

            await loginHistoryModel.create({
                ip: ipInfo?.clientIp,
                city,
                adminId: data?._id,
                loginDate: moment().format("DD MMM YYYY, hh:mm A")
            });

            const adminId = data?._id;
            const token = jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '30d' });
            return res.status(200).json({ message: "Merchant Logged In", token: token, data: data, type: 'merchant' });

        }
        else if(dataStaff) {
            if (dataStaff?.block) {
                return res.status(400).json({ message: "Staff blocked from merchant." });
            }
            if (dataStaff?.password !== password) {
                return res.status(400).json({ message: "Incorrect Email or Password" })
            }

            const adminId = dataStaff?.merchantId?._id;
            const token = jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '30d' });
            return res.status(200).json({ message: "Staff Logged In", token: token, data: dataStaff, type: 'staff' });
        }else{
            return res.status(400).json({ message: "Incorrect Email or Password" });
        }


    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};





// 3. Get  by id
const verifyData = async (req, res) => {
    try {


        const adminData = await Admin.findOne({ apiKey: req.body.apiKey, secretKey: req.body.secretKey });
        if (!adminData) {
            return res.status(400).json({ status: 'fail', message: "Invalid API Key or Secret Key" });
        }


        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }

        const data = await Merchant.findByIdAndUpdate(adminId,
            { apiKey: req.body.apiKey, secretKey: req.body.secretKey, verify: true },
            { new: true });

        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




const webInfo = async (req, res) => {
    try {
        const { website } = req.body;

        const merchant = await Merchant.findOne({ website }).select('tax');
        if (!merchant) {
            return res.status(400).json({ status: 'fail' });
        }

        return res.status(200).json({ status: 'ok', data: merchant });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





module.exports = {
    createData,
    getAllData,
    getDataById,
    getDataByWebsite,
    updateData,
    deleteData,
    loginData,
    verifyData,
    webInfo
};
