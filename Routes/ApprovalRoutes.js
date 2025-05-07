
const {  createData, getDataById, updateData, deleteData, getAllStaffData, getAllMerchantData } = require('../Controllers/ApprovalController')
const authenticate = require('../Middleware/auth')

const router = require('express').Router()

router.get('/getAllStaff', authenticate, getAllStaffData)
router.get('/getAllMerchant', authenticate, getAllMerchantData)
router.post('/create', createData)
router.get('/get/:id', getDataById)
router.put('/update/:id', updateData)
router.delete('/delete/:id', deleteData)


module.exports = router

