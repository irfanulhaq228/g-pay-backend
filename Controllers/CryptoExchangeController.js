const jwt = require('jsonwebtoken');
const CryptoExchange = require('../Models/CryptoExchangeModel');

//1: Create Crypto Exchange
const createData = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(400).json({ status: 'fail', message: 'Token is required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;
        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        const { coin, inr } = req.body;
        if (!coin || !inr) {
            return res.status(400).json({ status: 'fail', message: 'All fields are required' });
        }

        // Check if a CryptoExchange already exists
        const existingData = await CryptoExchange.findOne();

        if (existingData) {
            // Update the existing document
            const updatedCryptoExchange = await CryptoExchange.findByIdAndUpdate(
                existingData._id,
                { coin, inr },
                { new: true }
            );

            return res.status(200).json({
                status: 'ok',
                message: 'Crypto Exchange Updated Successfully!',
                data: updatedCryptoExchange
            });
        } else {
            // No document exists, so create a new one
            const newCryptoExchange = await CryptoExchange.create({ coin, inr });

            return res.status(200).json({
                status: 'ok',
                message: 'Crypto Exchange Created Successfully!',
                data: newCryptoExchange
            });
        }

    } catch (error) {
        console.error("Create/Update Error:", error);
        return res.status(500).json({ status: 'fail', message: 'Server error' });
    }
};

//2: get all Crypto Exchange

const getAllData = async (req, res) => {
    try {
        const cryptoExchangeData = await CryptoExchange.find();
        
        return res.status(200).json({status: 'ok', message: 'Crypto Exchange Data Fetched Successfully!', data: cryptoExchangeData})

    } catch (error) {
        return res.status(500).json({status: 'fail', message: 'server error'})
    }
}


module.exports = {
    createData,
    getAllData
}