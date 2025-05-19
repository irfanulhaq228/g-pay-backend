const jwt = require('jsonwebtoken');
const Receipt = require('../Models/ReceiptModel');


//1: Create Receipt
const createData = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({status: 'fail', message: 'Token is required'})
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        var adminId = decoded.adminId;
        if (!adminId) {
            return res.status(400).json({status: 'fail', message: 'Admin not found!'})
        }
        const {transactionId, utr, amount, status} = req.body

        if (!transactionId || !utr || !amount) {
            return res.status(400).json({status: 'fail', message: 'All fields are required'})
        }
        const newReceipt = await Receipt.create({
            transactionId,
            utr,
            amount,
            status
        })

        return res.status(200).json({status: 'ok', message: 'Receipt Created Successfully!', data: newReceipt})

    } catch (error) {
        return res.status(500).json({status: 'fail', message: 'server error'})
    }
}

//2: Get All Receipts

const getAllReciepts = async (req, res) => {
    try {
        const receipts = await Receipt.find()
        
        return res.status(200).json({status: 'ok', message: 'All receipts fetched', data: receipts})
    } catch (error) {
        return res.status(500).json({status: 'fail', message: 'server error'})
    }
}


//3: Get Receipt By transactionId

const getReceiptByTransactionId = async (req, res) => {
    try {
        const transactionId = req.params.transactionId
        if (!transactionId) {
            return res.status(400).json({status: 'fail', message: 'transactionId is required'})
        }
        const receiptbyId = await Receipt.findOne({transactionId})
        if (!receiptbyId) {
            return res.status(404).json({status: 'fail', message: 'Receipt not found'})
        }
        return res.status(200).json({status: 'ok', message: "Receipt fetched successfully", data: receiptbyId})
    } catch (error) {
        return res.status(500).json({status: 'fail', message: 'server error'})
    }
}

module.exports = {
    createData,
    getAllReciepts,
    getReceiptByTransactionId
}