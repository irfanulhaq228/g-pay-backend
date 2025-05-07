
const { createData, getDataById, updateData, deleteData, getAllMerchantData } = require('../Controllers/WithdrawBankController')
const authenticate = require('../Middleware/auth')
const { upload } = require('../Multer/Multer')

const router = require('express').Router()

router.get('/getAll', authenticate, getAllMerchantData)
router.post('/create', upload.single('image'), authenticate, createData)
router.get('/get/:id', getDataById)
router.put('/update/:id', upload.single('image'), updateData)
router.delete('/delete/:id', authenticate, deleteData)


module.exports = router

