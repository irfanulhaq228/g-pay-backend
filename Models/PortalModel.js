const mongoose = require("mongoose")

const portalSchema = new mongoose.Schema({
    portalName: { type: String, required: true },
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

const portalModel = mongoose.model('Portal', portalSchema)
module.exports = portalModel