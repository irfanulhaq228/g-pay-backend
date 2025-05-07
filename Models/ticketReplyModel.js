const mongoose = require('mongoose');

const ticketReplySchema = new mongoose.Schema({
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    ledgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    message: { type: String },
    type: { type: String },
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

const ticketReplyModel = mongoose.model('TicketReply', ticketReplySchema);

module.exports = ticketReplyModel;
