const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    ledgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
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

const approvalModel = mongoose.model('Approval', approvalSchema);

module.exports = approvalModel;
