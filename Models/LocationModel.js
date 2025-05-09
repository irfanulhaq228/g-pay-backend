const mongoose = require("mongoose")

const locationSchema = new mongoose.Schema({
    exchangeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exchange' },
    location: {type: String, required: true},
    createdAt: {
        type: Date,
        default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000), // Adjust to IST
      },
    updatedAt: {
        type: Date,
        default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000), // Adjust to IST
      },
},
{
    timestamps: true
})

const locationModel = mongoose.model('Location', locationSchema)
module.exports = locationModel