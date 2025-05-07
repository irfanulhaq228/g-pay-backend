const transactionSlipModel = require("../Models/TransactionSlipModel.js");

const createTransactionSlip = async (req, res) => {
    try {
        const { data } = req.body;

        const existingSlips = await transactionSlipModel.find({}, { 'data.utr': 1 });
        const existingUtrs = new Set(existingSlips.flatMap(slip => slip.data.map(item => item.utr)));

        const filteredData = data.filter(item => !existingUtrs.has(item.utr));

        if (filteredData.length === 0) {
            return res.status(400).json({ message: "No New Entries Found" });
        }

        req.body.data = filteredData;

        const slip = new transactionSlipModel(req.body);
        await slip.save();

        return res.status(200).json({ message: "Slip added successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error!" });
    }
};

const getAllTransactionSlips = async (req, res) => {
    try {
        const slips = await transactionSlipModel.find();
        if (slips.length === 0) {
            return res.status(400).json({ message: "Data is Empty" })
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: slips });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const getMerchantTransactionSlips = async (req, res) => {
    try {
        const { id } = req.query;
        const slips = await transactionSlipModel.find({ merchant: id }).sort({ createdAt: -1 });
        if (slips.length === 0) {
            return res.status(400).json({ message: "Data is Empty" })
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: slips });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const deleteMerchantTransactionSlips = async (req, res) => {
    try {
        const id = req.params.id;
        await transactionSlipModel.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

module.exports = {
    createTransactionSlip,
    getAllTransactionSlips,
    getMerchantTransactionSlips,
    deleteMerchantTransactionSlips
};