const mongoose = require('mongoose');

const withdrawSchema = new mongoose.Schema({
    amount: { type: Number, },
    amountINR: { type: Number, },
    image: { type: String, required: false },
    reason: { type: String, default: "" },
    note: { type: String, },
    utr: { type: String, },
    exchangeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exchange' },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    withdrawBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'WithdrawBank' },
    status: { type: String, default: 'Pending' },
    createdBy: { type: String },
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

const withdrawModel = mongoose.model('Withdraw', withdrawSchema);

module.exports = withdrawModel;
