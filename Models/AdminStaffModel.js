const mongoose = require('mongoose');

const adminStaffSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    userName: { type: String, required: false},
    email: { type: String, required: false },
    otp: { type: String, required: false, default: null },
    editPermission: { type: Boolean, required: false, default: true },
    password: { type: String, required: false },
    ledgerType: { type: Array, required: false },
    ledgerBank: { type: Array, required: false },
    ledgerMerchant: { type: Array, required: false },
    block: { type: Boolean, required: false, default: false },
    type: {type: String, required: true},
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

const adminStaffModel = mongoose.model('AdminStaff', adminStaffSchema);

module.exports = adminStaffModel;
