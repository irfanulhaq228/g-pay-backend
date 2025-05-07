
const {  createData, getDataById, updateData, deleteData, getAllMerchantData, getAllData }=require('../Controllers/exchangeController')
const authenticate = require('../Middleware/auth')
const { upload } = require('../Multer/Multer')

const router=require('express').Router()

router.get('/getAll',authenticate,getAllMerchantData)
router.get('/get', getAllData)
router.post('/create',authenticate ,createData)
router.get('/get/:id',getDataById)
router.put('/update/:id',updateData)
router.delete('/delete/:id',authenticate,deleteData) 


module.exports=router

