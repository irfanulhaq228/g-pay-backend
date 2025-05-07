const AdminStaff = require('../Models/AdminStaffModel');
const Admin = require('../Models/AdminModel');
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
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        const email = await AdminStaff.findOne({ email: req.body.email });
        const emailAdmin = await Admin.findOne({ email: req.body.email });

        if (email && emailAdmin) {
            return res.status(409).json({ message: 'Email already exists' });
        }


        const data = await AdminStaff.create({
            ...req.body, adminId: adminId
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
        const data = await AdminStaff.find({ adminId: adminId }).sort({ createdAt: -1 });


        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await AdminStaff.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;



        const data = await AdminStaff.findByIdAndUpdate(id,
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
        await AdminStaff.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




const loginData = async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await AdminStaff.findOne({ email });
        if (!data) {
            return res.status(400).json({ message: "Incorrect Email or Password" });
        }
        if (data?.block) {
            return res.status(400).json({ message: "Staff blocked from admin." });
        }
        if (data?.password !== password) {
            return res.status(400).json({ message: "Incorrect Email or Password" })
        }

        const adminId = data?.adminId;
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
