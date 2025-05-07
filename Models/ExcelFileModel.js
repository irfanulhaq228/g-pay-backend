const mongoose = require('mongoose');


const CounterFileSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const CounterFile = mongoose.model('CounterFile', CounterFileSchema);

const excelFileSchema = new mongoose.Schema({
    fileName: { type: String, required: false },
    payoutId: { type: String, required: false },
    noOfWithdraws: { type: String, default: "" },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
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




// Pre-save middleware to auto-increment trnNo
excelFileSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            // Find the CounterFile document for ledgers
            const CounterFileDoc = await CounterFile.findByIdAndUpdate(
                { _id: 'excelFilePayoutId' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            // Assign the incremented sequence to trnNo
            this.payoutId = CounterFileDoc.seq;
            next();
        } catch (error) {
            return next(error);
        }
    } else {
        next();
    }
});




const excelFileModel = mongoose.model('ExcelFile', excelFileSchema);

module.exports = excelFileModel;
