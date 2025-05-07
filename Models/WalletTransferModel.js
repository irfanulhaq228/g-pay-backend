const mongoose = require('mongoose');

const walletTransferSchema = new mongoose.Schema({
    fromMerchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    toMerchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    amount: { type: Number },
    status: { type: String, default: "pending" },
    type: { type: String },
    createdAt: {
        type: Date,
        default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000),
    },
    updatedAt: {
        type: Date,
        default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000),
    },
}, {
    timestamps: true
});

const walletTransferModel = mongoose.model('WalletTransfer', walletTransferSchema);

module.exports = walletTransferModel;
