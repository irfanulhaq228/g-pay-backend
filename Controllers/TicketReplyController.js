const TicketReply = require('../Models/ticketReplyModel');
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


        if (!adminId && req.body.type==='Admin') {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }
        if (!adminId && req.body.type==='Merchant'){
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }


        // const image = req.file;

        const data = await TicketReply.create({
            ...req.body, merchantId: req.body.type==='Merchant'?adminId:req.body.merchantId, adminId: req.body.type==='Admin'?adminId: req.body.adminId,
        });


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

        if (!req.query.ticketId) {
            return res.status(401).json({ status: 'fail', message: 'No ticket Id provided!' });
        }



        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await TicketReply.find({ticketId:req.query.ticketId})




        return res.status(200).json({
            status: "ok",
            data,
        });

        // Find data created by the agent, sorted by `createdAt` in descending order

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};







// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await TicketReply.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;


        // let getImage = await Ticket.findById(id);
        // const image = req.file === undefined ? getImage?.image : req.file?.path;


        const data = await TicketReply.findByIdAndUpdate(id,
            { ...req.body },
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
        await TicketReply.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};







module.exports = {
    createData,
    getAllData,
    getDataById,
    updateData,
    deleteData,
};
