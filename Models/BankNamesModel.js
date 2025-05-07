const mongoose = require('mongoose');

const bankNamesSchema = new mongoose.Schema({
    bankName: { type: String, required: false},
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

const bankNamesModel = mongoose.model('BankNames', bankNamesSchema);

module.exports = bankNamesModel;
