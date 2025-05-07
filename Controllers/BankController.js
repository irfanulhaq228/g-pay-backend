const Bank = require('../Models/BankModel');
const BankLog = require('../Models/BankLogModel');
const jwt = require('jsonwebtoken');
 

// 1. Create 
const createData = async (req, res) => {
    try {


        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        const accountNo = await Bank.findOne({ accountNo: req.body.accountNo });

        if (accountNo) {
            return res.status(409).json({ status: 'fail', message: 'Account Number already exists' });
        }

        const iban = await Bank.findOne({ iban: req.body.iban });

        if (iban) {
            return res.status(409).json({ status: 'fail', message: 'IBAN already exists' });
        }



        const image = req.file;

        const data = await Bank.create({
            ...req.body, image: image ? image?.path : "", adminId: adminId, remainingLimit: req.body.accountLimit, remainingTransLimit:req.body.noOfTrans
        });

        await BankLog.create({ bankId: data._id, status: 'Created', reason: 'New Bank Added by admin.' })


        return res.status(200).json({ status: 'ok', data, message: 'Data Created Successfully!' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 2. Get all s
const getAllData = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        var query = {}

        query.adminId = adminId

        if (req?.query?.accountType) {
            query.accountType = req?.query?.accountType
        }

        if (req?.query?.disable) {
            query.disable = req?.query?.disable
        }



        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Bank.find(query).sort({ createdAt: -1 });




        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 2. Get all s
const getAllBankData = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        var query = {}

        if (req?.query?.accountType) {
            query.accountType = req?.query?.accountType
        }

        if (req?.query?.disable) {
            query.disable = req?.query?.disable
        }



        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Bank.find(query).sort({ createdAt: -1 });




        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



// 2. Get all s
const getUserData = async (req, res) => {
    try {

        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await Bank.find({
            block: false,
            accountType: req?.query?.accountType,
            disable: false
        })
            .sort({ createdAt: -1 })
            .exec();



        return res.status(200).json({ status: 'ok', data: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Bank.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;


        if (req.body.disable) {
            await BankLog.create({ bankId: id, status: 'Disable', reason: 'Bank is Disabled by admin.' })
        }
        else if (req.body.disable === false) {
            await BankLog.create({ bankId: id, status: 'Enable', reason: 'Bank is Enabled by admin.' })
        }

        let getImage = await Bank.findById(id);
        const image = req.file === undefined ? getImage?.image : req.file?.path;
        const data = await Bank.findByIdAndUpdate(id,
            { ...req.body, image: image },
            { new: true });
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



// 5. Delete 
const deleteData = async (req, res) => {
    try {
        const id = req.params.id;
        await BankLog.create({ bankId: id, status: 'Deleted', reason: 'Bank is Deleted by admin.' })

        await Bank.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 3. Get  by id
const activeData = async (req, res) => {
    try {
        const id = req.query.id;
        const accountType = req.query.accountType;

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;

        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        if (!accountType) {
            return res.status(400).json({ status: 'fail', message: 'Please provide account type!' });
        }

        const currentData = await Bank.findOne({ _id: id, accountType, disable: false });

        if (!currentData) {
            return res.status(404).json({ status: 'fail', message: 'Bank account not found!' });
        }

        if (!currentData.block) {
            await Bank.findOneAndUpdate(
                { _id: id, accountType, disable: false },
                { block: true },
                { new: true }
            );

            await BankLog.create({ bankId: id, status: 'InActive', reason: 'Bank is Inactive by admin.' })


            return res.status(200).json({ status: 'ok', message: 'No changes made', data: currentData });
        }
        else {


            const updatedData = await Bank.findOneAndUpdate(
                { _id: id, accountType, disable: false },
                { block: false },
                { new: true }
            );

            await BankLog.create({ bankId: id, status: 'Active', reason: 'Bank is Active by admin.' })



            return res.status(200).json({ status: 'ok', data: updatedData });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





module.exports = {
    createData,
    getAllData,
    getAllBankData,
    getDataById,
    updateData,
    deleteData,
    activeData,
    getUserData
};
