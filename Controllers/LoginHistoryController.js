const LoginHistory = require('../Models/LoginHistoryModel');
const jwt = require('jsonwebtoken');


// 1. Create 
const createData = async (req, res) => {
    try {


        const data = await LoginHistory.create({
            ...req.body
        });

        return res.status(200).json({ status: 'ok', data , message: 'Data Created Successfully!' });
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
         const data = await LoginHistory.find({ adminId }).sort({ createdAt: -1 });

 
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await LoginHistory.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;
        const data = await LoginHistory.findByIdAndUpdate(id,
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
        await LoginHistory.findByIdAndDelete(id);
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
