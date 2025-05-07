
const { createData, getDataById, updateData, deleteData, getAllMerchantData, uploadCSVData, uploadExcelData } = require('../Controllers/ExcelWithdrawController')
const authenticate = require('../Middleware/auth')
const { upload } = require('../Multer/Multer')

const router = require('express').Router()

router.get('/getAll', authenticate, getAllMerchantData)
router.post('/create', upload.single('image'), authenticate, createData)
router.post('/uploadCSV', upload.single('csv'), authenticate, uploadCSVData)
router.post('/uploadExcel', upload.single('csv'), authenticate, uploadExcelData)
router.get('/get/:id', getDataById)
router.put('/update/:id', upload.single('image'), updateData)
router.delete('/delete/:id', authenticate, deleteData)


module.exports = router

