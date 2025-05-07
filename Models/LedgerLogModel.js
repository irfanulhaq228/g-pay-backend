const mongoose = require('mongoose');

const ledgerLogSchema = new mongoose.Schema({
    startDate: { type: String, required: false },
    endDate: { type: String, required: false },
    merchantId: { type: [mongoose.Schema.Types.ObjectId], ref: 'Merchant' },
    bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' },
    filterByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    filterByMerchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    status: { type: String, required: false },
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

const ledgerLogModel = mongoose.model('LedgerLog', ledgerLogSchema);

module.exports = ledgerLogModel;
