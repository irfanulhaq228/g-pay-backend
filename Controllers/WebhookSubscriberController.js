const WebhookSubscriber = require('../Models/WebhookSubscriberModel');
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

        const email = await WebhookSubscriber.findOne({ email: req.body.email });

        if (email) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const phone = await WebhookSubscriber.findOne({ phone: req.body.phone });

        if (phone && req.body.phone) {
            return res.status(409).json({ message: 'Phone already exists' });
        }



        const image = req.file;

        const data = await WebhookSubscriber.create({
            ...req.body, image: image ? image?.path : "", merchantId:adminId
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
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }

        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await WebhookSubscriber.find({ merchantId:adminId }).sort({ createdAt: -1 });


        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await WebhookSubscriber.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;


        let getImage = await WebhookSubscriber.findById(id);
        const image = req.file === undefined ? getImage?.image : req.file?.path;


        const data = await WebhookSubscriber.findByIdAndUpdate(id,
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
        await WebhookSubscriber.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




const loginData = async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await WebhookSubscriber.findOne({ email });
        if (!data) {
            return res.status(400).json({ message: "Incorrect Email or Password" });
        }
        if (data?.block) {
            return res.status(400).json({ message: "Staff blocked from merchant." });
        }
        if (data?.password !== password) {
            return res.status(400).json({ message: "Incorrect Email or Password" })
        }

        const adminId = data?._id;
        const token = jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '30d' });
        return res.status(200).json({ message: "Staff Logged In", token: token, data: data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};







module.exports = {
    createData,
    getAllData,
    getDataById,
    updateData,
    deleteData,
    loginData,
};
