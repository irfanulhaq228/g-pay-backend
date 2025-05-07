const mongoose = require('mongoose');

const excelWithdrawSchema = new mongoose.Schema({
    amount: { type: Number, },
    withdrawAmount: { type: Number, default:0 },
    adminAmount: { type: Number, default:0  },
    amountINR: { type: Number, },
    image: { type: String, required: false },
    reason: { type: String, default: "" },
    ifsc: { type: String, default: "" },
    note: { type: String, },
    utr: { type: String, },
    username: { type: String, },
    exchangeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exchange' },
    excelFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExcelFile' },
    account: { type: String, },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    status: { type: String, default: 'Pending' },
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

const excelWithdrawModel = mongoose.model('ExcelWithdraw', excelWithdrawSchema);

module.exports = excelWithdrawModel;
