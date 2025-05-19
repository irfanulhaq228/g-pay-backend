const mongoose = require('mongoose');

const withdrawSchema = new mongoose.Schema({
    amount: { type: Number, },
    amountINR: { type: Number, },
    image: { type: String, required: false },
    reason: { type: String, default: "" },
    note: { type: String, },
    utr: { type: String, },
    customerName: {type: String},
    contactNumber: {type: String},
    token: {type: String},
    exchangeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exchange' },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    adminStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminStaff' },
    withdrawBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'WithdrawBank' },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    portalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portal' },
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
      withdrawLogs: {
        type: [
          {
            status: {type: String },
            actionBy: {type: String },
            date: {type: Date, default: Date.now },
          }
        ]
      }
}, {
    timestamps: true
});

const withdrawModel = mongoose.model('Withdraw', withdrawSchema);

module.exports = withdrawModel;
