const { createData, getAllReciepts, getReceiptByTransactionId } = require('../Controllers/ReceiptController');
const authenticate = require('../Middleware/auth');


const receiptRouter = require('express').Router();

receiptRouter.post('/create', authenticate, createData)
receiptRouter.get('/getAll', getAllReciepts)
receiptRouter.get('/get/:id', getReceiptByTransactionId)



module.exports = receiptRouter;