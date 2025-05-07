const mongoose = require('mongoose');

const exchangeSchema = new mongoose.Schema({
    charges: { type: Number,  },
    currency: { type: String, },
    currencyRate: { type: String, required: false },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
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

const exchangeModel = mongoose.model('Exchange', exchangeSchema);

module.exports = exchangeModel;
