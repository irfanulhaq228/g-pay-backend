const mongoose = require('mongoose');

const cryptoExchangeSchema = new mongoose.Schema({
    coin: {type: Number, required: true},
    inr: {type: Number, required: true},
})

const cryptoExchangeModel = mongoose.model('CryptoExchange', cryptoExchangeSchema);
module.exports = cryptoExchangeModel;