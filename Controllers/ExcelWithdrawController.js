const ExcelWithdraw = require('../Models/ExcelWithdrawModel');
const ExcelFile = require('../Models/ExcelFileModel');
const Merchant = require('../Models/MerchantModel');
const jwt = require('jsonwebtoken');
const csvParser = require('csv-parser');
const fs = require('fs');
const xlsx = require('xlsx'); // For reading Excel files

let myData = []; // Ensure myData is properly initialized

const addData = async (item, adminId, excelId) => {
    try {
        const merchantData = await Merchant.findById(adminId);

        if (item && item['Account Holder Name'] && item['Amount'] && item['Account Number'] && item['IFSC Number']) {
            const amount = Number(item['Amount']) || 0; // Ensure amount is a number

            const adminTotal = (amount * merchantData?.payoutCommision) / 100;
            const merchantTotal = amount - adminTotal;

            myData.push({
                username: item['Account Holder Name'],
                exchangeId: process.env.EXCHANGE_ID,
                merchantId: adminId,
                withdrawAmount: merchantTotal,
                adminAmount: adminTotal,
                amount: amount, // Ensuring proper number type
                account: item['Account Number'],
                ifsc: item['IFSC Number'],
                excelFileId: excelId
            });
        }
    } catch (error) {
        console.error("Error adding data:", error);
    }
};

const uploadExcelData = async (req, res) => {
    try {
        // Extract token and verify
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;

        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }

        console.log(req.file);

        // Check if a file was uploaded
        const filePath = req.file?.path;
        if (!filePath) {
            return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
        }

        // Read and parse the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Assuming first sheet is the relevant one
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

        // Ensure the file is not empty before proceeding
        if (!jsonData.length) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ status: 'fail', message: 'Excel file is empty' });
        }

        const merchantData = await Merchant.findById(adminId);

        // Define required headers
        const requiredHeaders = ['Account Holder Name', 'Amount', 'Account Number', 'IFSC Number'];
        const fileHeaders = Object.keys(jsonData[0]);

        // Validate headers
        if (!requiredHeaders.every(header => fileHeaders.includes(header))) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ status: 'fail', message: 'Invalid Excel file format' });
        }

        // Process rows using Promise.all
        await Promise.all(jsonData.map(row => addData(row, adminId, null)));

        // Calculate the correct sum **AFTER** all rows are processed
        const correctTotal = myData.reduce((sum, record) => sum + Number(record.amount || 0), 0);

        console.log(adminId);
        console.log(correctTotal);

        // Check wallet balance before inserting data
        if ((merchantData?.wallet < correctTotal)) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ status: 'fail', message: 'You have insufficient balance to withdraw!' });
        }

        
        // **Update Merchant Wallet AFTER Calculating Total**
        await Merchant.findByIdAndUpdate(merchantData?._id, {
            wallet: merchantData.wallet - correctTotal
        })

        // Create an ExcelFile entry after processing all data
        const excelFileEntry = await ExcelFile.create({
            noOfWithdraws: myData.length,
            merchantId: adminId,
            fileName: req.file.originalname
        });

        // Update excelFileId in myData
        myData = myData.map(entry => ({ ...entry, excelFileId: excelFileEntry._id }));

        // Insert all withdraw entries
        await ExcelWithdraw.insertMany(myData);

        // Remove the file after processing
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        myData = []; // Reset data after successful insertion

        return res.json({
            message: 'File processed successfully',
            totalAmountProcessed: correctTotal,
            data: jsonData,
        });

    } catch (err) {
        console.error('Error processing file:', err);

        // Ensure the uploaded file is deleted in case of error
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
            error: 'Error processing file',
            details: err.message,
        });
    }
};


const uploadCSVData = async (req, res) => {

    try {


        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        var adminId = decoded.adminId;
        console.log("adminId ====> ", adminId);

        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }



        var filePath = req.file?.path

        const results = [];
        // Read and parse the CSV file
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', async (data) => {
                try {

                    console.log(data);

                    addData(data, adminId);

                } catch (error) {
                    console.error('Error processing brand:', error);
                }


            })
            .on('end', async () => {

                try {
                    fs.unlinkSync(filePath);

                    await Promise.all(
                        myData.map(async (i) => {
                            try {
                                // Find the brand by name
                                await ExcelWithdraw.create(i)
                            } catch (error) {
                                console.error(`Error handling:`, error);
                            }
                        })
                    );

                    return res.json({
                        message: 'File processed successfully',
                        data: results,
                    });
                } catch (error) {
                    console.error('Error processing brand:', error);
                }
                // Remove the file after processing

            })
            .on('error', (err) => {
                // Handle errors
                fs.unlinkSync(filePath); // Cleanup on error
                return res.status(500).json({ error: 'Error reading the file', details: err.message });
            });


    } catch (err) {
        res.status(500).json({
            error: err.message
        })
    }

}


// 1. Create 
const createData = async (req, res) => {
    try {


        
        console.log(req.body);

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        var adminId = decoded.adminId;
        

        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }

        console.log("adminId ====> ", adminId);

        const merchantData = await Merchant.findOne({_id:adminId});
        
        if (!req.body.amount) {
            return res.status(400).json({ status: 'fail', message: 'Must provide withdraw amount!' });
        }

        console.log(merchantData,'mmmmmmmmmmm');
        

        if (((merchantData?.wallet?merchantData?.wallet:0) < req.body.amount) ) {
            return res.status(400).json({ status: 'fail', message: 'You have insufficient balance to withdraw!' });
        }


        
        const adminTotal = (req.body.amount * Number(merchantData?.payoutCommision?merchantData?.payoutCommision:0)) / 100;
        const merchantTotal = req.body.amount - adminTotal;

        


        const excelFileEntry = await ExcelFile.create({
            noOfWithdraws: 1,
            merchantId: adminId,
            fileName: 'Custom Upload'
        });

        


        const data = await ExcelWithdraw.create({
            ...req.body, exchangeId: process.env.EXCHANGE_ID,
            merchantId: adminId,
            withdrawAmount: Number(merchantTotal),
            adminAmount: Number(adminTotal),
            amount: Number(req.body.amount),  excelFileId: excelFileEntry._id,
        });


        await Merchant.findByIdAndUpdate(merchantData?._id, {
            wallet: merchantData?.wallet - req.body.amount
        });


        return res.status(200).json({ status: 'ok', data, message: 'Data Created Successfully!' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};







// 2. Get all s
const getAllMerchantData = async (req, res) => {
    try {
        // Extract the token from the Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ status: 'fail', message: 'No token provided' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.adminId;


        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Merchant not found!' });
        }


        var search = "";
        if (req.query.search) {
            search = req.query.search;
        }
        var excelFileId = "";
        if (req.query.excelFileId) {
            excelFileId = req.query.excelFileId;
        }

        var page = "1";
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = req.query.limit ? req.query.limit : "10";


        const query = {};

        if (req.query.type === 'merchant') {
            query.merchantId = adminId
        }



        if (search) {
            query.status = { $regex: ".*" + search + ".*", $options: "i" };
        }

        if (req.query.status) {
            query.status = req.query.status;
        }

        if (excelFileId) {
            query.excelFileId = req.query.excelFileId;
        }




        // Find data created by the agent, sorted by `createdAt` in descending order
        const data = await ExcelWithdraw.find(query).sort({ createdAt: -1 })
            .populate(["exchangeId", "merchantId"])
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();


        const count = await ExcelWithdraw.find(query).sort({ createdAt: -1 }).countDocuments();;


        return res.status(200).json({
            status: "ok",
            data,
            search,
            page,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};





// 3. Get  by id
const getDataById = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await ExcelWithdraw.findById(id);
        return res.status(200).json({ status: 'ok', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




// 4. Update 
const updateData = async (req, res) => {
    try {
        let id = req.params.id;


        let getImage = await ExcelWithdraw.findById(id);
        const image = req.file === undefined ? getImage?.image : req.file?.path;


        const merchantData = await Merchant.findById(getImage?.merchantId)


        if (req.body.status === 'Cancel') {
            await Merchant.findByIdAndUpdate(getImage?.merchantId, {
                wallet: merchantData?.wallet + getImage.amount
            })
        }


        if (req.body.status === 'Decline') {
            await Merchant.findByIdAndUpdate(getImage?.merchantId, {
                wallet: merchantData?.wallet + getImage.amount
            })
        }


        const data = await ExcelWithdraw.findByIdAndUpdate(id,
            { ...req.body, image },
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
        await ExcelWithdraw.findByIdAndDelete(id);
        return res.status(200).json({ status: 'ok', message: 'Data deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};







module.exports = {
    createData,
    getAllMerchantData,
    getDataById,
    updateData,
    deleteData,
    uploadCSVData,
    uploadExcelData
};
