const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    wallet: { type: Number, default: 0 },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
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

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
