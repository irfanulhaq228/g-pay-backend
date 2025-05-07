const merchantModel = require("../Models/MerchantModel");
const walletTransferModel = require("../Models/WalletTransferModel");

const createData = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ status: 'fail', message: 'No token provided' });

        const { amount, fromMerchant, toMerchant } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid Amount" });

        const fromMerchantData = await merchantModel.findById(fromMerchant);
        if (!fromMerchantData) return res.status(400).json({ message: "Invalid Merchant" });
        if (amount > fromMerchantData?.wallet) return res.status(400).json({ message: "Insuffient Balance of Merchant" });

        const toMerchantData = await merchantModel.findById(toMerchant);
        if (!toMerchantData) return res.status(400).json({ message: "Invalid Merchant" });
        if (fromMerchant === toMerchant) return res.status(400).json({ message: "Both  Merchant should be Different" });

        await merchantModel.findByIdAndUpdate(fromMerchant, { $inc: { wallet: -amount } });

        const data = await walletTransferModel.create(req.body);
        return res.status(200).json({ message: "Wallet Transfer Request Submitted Successfully", data: data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error!" });
    }
};

const getDataByAdmin = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ status: 'fail', message: 'No token provided' });

        const query = {};

        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
        const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;

        const data = await walletTransferModel.find(query).sort({ createdAt: -1 }).populate(["fromMerchant", "toMerchant"]).limit(limit * 1).skip((page - 1) * limit).exec();
        const count = await walletTransferModel.find(query).sort({ createdAt: -1 }).countDocuments();

        return res.status(200).json({
            status: 'ok',
            data,
            page,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error!" });
    }
};

const updateData = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const { id, status } = req.body;

        if (!id || !status) {
            return res.status(400).json({ message: "ID and status are required" });
        }

        const walletTransfer = await walletTransferModel.findById(id);
        if (!walletTransfer) {
            return res.status(404).json({ message: "Wallet Transfer not found" });
        }

        if (walletTransfer.status === "approved" || walletTransfer.status === "declined") {
            return res.status(400).json({ message: "Transfer status cannot be changed after approval/decline" });
        }

        const { fromMerchant, toMerchant, amount } = walletTransfer;

        if (status === "decline") {
            await merchantModel.findByIdAndUpdate(fromMerchant, { $inc: { wallet: amount } });
        } else if (status === "approved") {
            await merchantModel.findByIdAndUpdate(toMerchant, { $inc: { wallet: amount } });
        } else {
            return res.status(400).json({ message: "Invalid status. Allowed values: approved, decline" });
        }

        walletTransfer.status = status;
        await walletTransfer.save();

        return res.status(200).json({ message: `Wallet Transfer ${status} successfully`, data: walletTransfer });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error!" });
    }
};

module.exports = {
    createData,
    getDataByAdmin,
    updateData
};