const mongoose = require('mongoose');

const withdrawBankSchema = new mongoose.Schema({
    accountNo: { type: String, default: "" },
    accountType: { type: String, default: "" },
    bankName: { type: String, default: "UPI" },
    image: { type: String, required: false},
    iban: { type: String, default: "" },
    accountHolderName: { type: String, required: false },
    status: { type: Boolean, required: false },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    block: { type: Boolean, default: true },
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

const withdrawBankModel = mongoose.model('WithdrawBank', withdrawBankSchema);

module.exports = withdrawBankModel;
