
const {  createData, getDataById, updateData, deleteData,  getAllAdminData, getAllMerchantData }=require('../Controllers/TicketController')
const authenticate = require('../Middleware/auth')
const { upload } = require('../Multer/Multer')

const router=require('express').Router()

router.get('/getAllAdmin',authenticate,getAllAdminData)
router.get('/getAllMerchant',authenticate,getAllMerchantData)
router.post('/create',authenticate ,createData)
router.get('/get/:id',getDataById)
router.put('/update/:id',updateData)
router.delete('/delete/:id',authenticate,deleteData) 


module.exports=router

