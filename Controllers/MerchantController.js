const Merchant = require('../Models/MerchantModel');
const Admin = require('../Models/AdminModel');
const Staff = require('../Models/StaffModel');
const jwt = require('jsonwebtoken');
var getIP = require('ipware')().get_ip;
const { lookup } = require('geoip-lite');
const loginHistoryModel = require("../Models/LoginHistoryModel");
const moment = require("moment");
const WebhookSubscriber = require('../Models/WebhookSubscriberModel');
const { SendOtpToEmail } = require('../nodemailer');

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


        if (req.body.webhookUrl) {
            await WebhookSubscriber.create({
                url: req.body.webhookUrl
            });
        }



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

        const data = await Merchant.findOne({ website: website }).select('-password');
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
        const { email, password, otp } = req.body;
        const data = await Merchant.findOne({ email });
        const dataStaff = await Staff.findOne({ email }).populate(['merchantId']);
        if (data) {
            if (data?.block) {
                return res.status(400).json({ message: "Merchant blocked from admin." });
            }
            if (data?.password !== password) {
                return res.status(400).json({ message: "Incorrect Email or Password" })
            }

            // if (!otp || otp === null || otp === undefined) {
            //     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            //     console.log("otp ====> ", generatedOtp);
            //     data.otp = generatedOtp;
            //     await data.save();
            //     await SendOtpToEmail(email, generatedOtp)

            //     return res.status(200).json({ status: 'ok', message: 'OTP sent to the email' })
            // }
            // //otp verfication
            // if (otp !== data?.otp) {
            //     return res.status(400).json({ status: 'fail', message: 'OTP is incorrect' })
            // }

            // data.otp = null;
            // await data.save();

            var ipInfo = getIP(req);
            const look = lookup(ipInfo?.clientIp);

            const city = `${look?.city}, ${look?.region} ${look?.country}`

            await loginHistoryModel.create({
                ip: ipInfo?.clientIp,
                city,
                merchantId: data?._id,
                loginDate: moment().format("DD MMM YYYY, hh:mm A")
            });

            const adminId = data?._id;
            const token = jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '30d' });
            return res.status(200).json({ message: "Merchant Logged In", token: token, data: data, type: 'merchant' });

        }
        else if (dataStaff) {
            if (dataStaff?.block) {
                if (dataStaff?.type === "staff") {
                    return res.status(400).json({ message: "The Merchant is Blocked" });
                } else {
                    return res.status(400).json({ message: "Staff blocked from merchant." });
                }
            }
            console.log(dataStaff);
            if (dataStaff?.merchantId?.block) {
                return res.status(400).json({ message: "The Merchant is Blocked" })
            }
            if (dataStaff?.password !== password) {
                return res.status(400).json({ message: "Incorrect Email or Password" })
            };

            // if (!otp || otp === null || otp === undefined) {
            //     const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            //     console.log("otp ====> ", generatedOtp);
            //     dataStaff.otp = generatedOtp;
            //     await dataStaff.save();
            //     await SendOtpToEmail(email, generatedOtp)

            //     return res.status(200).json({ status: 'ok', message: 'OTP sent to the email' })
            // }
            // //otp verfication
            // if (otp !== dataStaff?.otp) {
            //     return res.status(400).json({ status: 'fail', message: 'OTP is incorrect' })
            // }

            // dataStaff.otp = null;
            // await dataStaff.save();

            if (dataStaff?.type === "staff") {
                var ipInfo = getIP(req);
                const look = lookup(ipInfo?.clientIp);

                const city = `${look?.city}, ${look?.region} ${look?.country}`

                await loginHistoryModel.create({
                    ip: ipInfo?.clientIp,
                    city,
                    merchantId: dataStaff?.merchantId?._id,
                    loginDate: moment().format("DD MMM YYYY, hh:mm A")
                });
            }

            const adminId = dataStaff?.merchantId?._id;
            const token = jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '30d' });
            return res.status(200).json({ message: "Staff Logged In", token: token, data: dataStaff, type: 'staff' });
        } else {
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


//4. Check Merchant Info
const checkMerchant = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(400).json({ message: 'No or invalid token provided' });
        }

        const token = authHeader.split(' ')[1];
        console.log("token [1]", typeof token);

        if (!token || token === 'undefined' || token === 'null' || token === '') {
            return res.status(400).json({ message: 'No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Failed to authenticate token' });
            }
            console.log("decoded", decoded);
            const merchant = await Merchant.findById(decoded.adminId).select('block');

            if (!merchant) {
                return res.status(404).json({ message: 'Merchant not found' });
            }

            if (merchant.block === true) {
                return res.status(400).json({ message: "Merchant is blocked" });
            }

            return res.status(200).json({ message: "Merchant is valid" });
        });
    } catch (error) {
        return res.status(500).json({ status: 'fail', message: 'Error in checking merchant info' });
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
    checkMerchant,
    webInfo
};
