const jwt = require("jsonwebtoken");
const adminModel = require("../Models/AdminModel");
const AdminStaff = require("../Models/AdminStaffModel");
var getIP = require('ipware')().get_ip;
const { lookup } = require('geoip-lite');
const loginHistoryModel = require("../Models/LoginHistoryModel");
const moment = require("moment");
const { SendOtpToEmail, sendFeedbackToAdmin } = require("../nodemailer");
const { Stats } = require("fs");



const createAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingAdmin = await adminModel.findOne({ email });

        if (existingAdmin) {
            return res.status(409).json({ message: "Email already exists" });
        }


        const admin = await adminModel.create({ email, password });
        const id = admin?._id;
        const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        return res.status(200).json({ message: "Admin created successfully", token });
    } catch (error) {
        return res.status(500).json({ message: "Server Error!" })
    }
};




const loginAdmin = async (req, res) => {
    try {
        const { email, password, otp } = req.body;
        const data = await adminModel.findOne({ email });
        const dataStaff = await AdminStaff.findOne({ email }).populate(['adminId']);
        if (data) {
           
            if (data?.password !== password) {
                return res.status(400).json({ message: "Incorrect Email or Password" })
            }

            //otp generation
            if (!otp || otp === null || otp === undefined) {
                const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
                console.log("otp ====> ", generatedOtp);
                data.otp = generatedOtp;
                await data.save();
                await SendOtpToEmail(email, generatedOtp)

                return res.status(200).json({status: 'ok', message: 'OTP sent to the email'})
            }

            
            //otp verfication
            if (otp !== data?.otp) {
                return res.status(400).json({status: 'fail', message: 'OTP is incorrect'})
            }

            data.otp = null;
            await data.save();

            var ipInfo = getIP(req);
            const look = lookup(ipInfo?.clientIp);


            const city = `${look?.city}, ${look?.region} ${look?.country}`

            // Create new user with hashed password
            await loginHistoryModel.create({
                ip: ipInfo?.clientIp,
                city,
                adminId: data?._id,
                loginDate: moment().format("DD MMM YYYY, hh:mm A")
            });


            const adminId = data?._id;
            const token = jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '30d' });
            return res.status(200).json({ message: "Admin Logged In", token: token, data: data, type: 'admin' });

        }
        else if (dataStaff) {
            if (dataStaff?.block) {
                return res.status(400).json({ message: "Staff blocked from admin." });
            }
            if (dataStaff?.password !== password) {
                return res.status(400).json({ message: "Incorrect Email or Password" })
            }

            if (!otp || otp === null || otp === undefined) {
                const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
                console.log("otp ====> ", generatedOtp);
                dataStaff.otp = generatedOtp;
                await dataStaff.save();
                await SendOtpToEmail(email, generatedOtp)

                return res.status(200).json({status: 'ok', message: 'OTP sent to the email'})
            }
            //otp verfication
            if (otp !== dataStaff?.otp) {
                return res.status(400).json({status: 'fail', message: 'OTP is incorrect'})
            }

            dataStaff.otp = null;
            await dataStaff.save();

            var ipInfo = getIP(req);
            const look = lookup(ipInfo?.clientIp);
            const city = `${look?.city}, ${look?.region} ${look?.country}`

            await loginHistoryModel.create({
                ip: ipInfo?.clientIp,
                city,
                adminStaffId: dataStaff?._id,
                loginDate: moment().format("DD MMM YYYY, hh:mm A")
            });

            const adminId = dataStaff?.adminId?._id;
            const token = jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '30d' });
            return res.status(200).json({ message: "Staff Logged In", token: token, data: dataStaff, type: 'staff' });
        } else {
            return res.status(400).json({ message: "Incorrect Email or Password" });
        }


    } catch (error) {
        console.log("Error: ", error)
        return res.status(500).json({ message: "Server Error!" })
    }
};







// 3. Get by id
const getDataById = async (req, res) => {
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

        const data = await adminModel.findById(adminId);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





const getAllAdmins = async (req, res) => {
    try {
        const admin = await adminModel.find();
        if (admin.length === 0) {
            return res.status(400).json({ message: "Admin Data is Empty" })
        }

        return res.status(200).json({ message: "Data Sent Successfully", data: admin });
    } catch (error) {
        return res.status(500).json({ message: "Server Error!" })
    }
};






const updateData = async (req, res) => {
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


        const data = await adminModel.findByIdAndUpdate(adminId,
            { ...req.body, },
            { new: true });
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


//feedback to admin

const sendFeedbackToAdminAPI = async (req, res) => {
    try {
        const {feedbackMessage, feedbackSender} = req.body
        if (!feedbackMessage || !feedbackSender) {
            return res.status(400).json({status: 'fail', message: 'Please provide all fields'})
        }
        const adminEmail = await adminModel.findOne()
        if (!adminEmail?.email) {
            return res.status(400).json({status: 'fail', message: 'Admin not found!'})
        }
        
        console.log("feedback api ran....")
        await sendFeedbackToAdmin(adminEmail?.email, feedbackSender, feedbackMessage)

        return res.status(200).json({status: 'ok', message: 'Feedback sent successfully'})

    } catch (error) {
        return res.status(500).json({status: 'fail', message: 'Server Error!'})
    }
}





module.exports = {
    createAdmin,
    loginAdmin,
    getAllAdmins,
    getDataById,
    updateData,
    sendFeedbackToAdminAPI
};