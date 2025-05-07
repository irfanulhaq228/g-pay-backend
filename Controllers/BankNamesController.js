const BankNames = require('../Models/BankNamesModel');
const jwt = require('jsonwebtoken');


// 1. Create 
const createData = async (req, res) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');

         if (!token) {
             return res.status(401).json({ status: 'fail', message: 'No token provided' });
         }

         const checkdata = await BankNames.findOne({bankName:req.body.bankName?.toLowerCase()});

         if(checkdata){
            return res.status(400).json({ status: 'fail', message: 'Bank name already exists!' });
         }


        const data = await BankNames.create({
            bankName:req.body.bankName?.toLowerCase()
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

 
         // Find data created by the agent, sorted by `createdAt` in descending order
         const data = await BankNames.find().sort({ bankName: 1 });

 
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await BankNames.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;
        const data = await BankNames.findByIdAndUpdate(id,
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
        await BankNames.findByIdAndDelete(id);
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
