const mongoose = require('mongoose');

const bankLogSchema = new mongoose.Schema({
    reason: { type: String, required: false},
    bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    status: { type: String, required: false},
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

const bankLogModel = mongoose.model('BankLog', bankLogSchema);

module.exports = bankLogModel;
