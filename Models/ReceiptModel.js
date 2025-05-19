const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    transactionId: { type: String, required: true },
    utr: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true, default: 'Pending' },
    createdAt: {
        type: Date,
        default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000), // Adjust to IST
    },
    updatedAt: {
        type: Date,
        default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000), // Adjust to IST
    },
}, {
    timestamps: true
})

const receiptModel = mongoose.model('Receipt', receiptSchema);

module.exports = receiptModel;