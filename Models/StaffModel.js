const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    image: { type: String, required: false},
    fullName: { type: String, required: false},
    phone: { type: String, required: false },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    userName: { type: String, required: false},
    email: { type: String, required: false },
    password: { type: String, required: false },
    dashboard: { type: Object, required: false, default: { view: true, edit: false } },
    transactionHistory: { type: Object, required: false, default: { view: true, edit: true } },
    directPayment: { type: Object, required: false, default: { view: true, edit: true } },
    approvalPoints: { type: Object, required: false, default: { view: true, edit: true } },
    merchantProfile: { type: Object, required: false, default: { view: true, edit: true } },
    reportsAnalytics: { type: Object, required: false, default: { view: true, edit: true } },
    support: { type: Object, required: false, default: { view: true, edit: true } },
    uploadStatement: { type: Object, required: false, default: { view: false, edit: false } },
    settings: { type: Object, required: false, default: { view: false, edit: false } },
    staff: { type: Object, required: false, default: { view: true, edit: false } },
    type: { type: String, required: false },
    block: { type: Boolean, required: false, default: false },
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

const staffModel = mongoose.model('Staff', staffSchema);

module.exports = staffModel;
