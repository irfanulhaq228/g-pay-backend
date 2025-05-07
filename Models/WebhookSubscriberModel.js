const mongoose = require('mongoose');

const webhookSubscriberSchema = new mongoose.Schema({
    url: { type: String, required: true },
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

const webhookSubscriberModel = mongoose.model('WebhookSubscriber', webhookSubscriberSchema);

module.exports = webhookSubscriberModel;
