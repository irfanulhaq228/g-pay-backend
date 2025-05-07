const mongoose = require('mongoose');

const transactionSlipSchema = new mongoose.Schema({
    pdfName: { type: String, required: false },
    data: { type: [], required: false },
    merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
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
});

const transactionSlipModel = mongoose.model('TransactionSlip', transactionSlipSchema);

module.exports = transactionSlipModel;
