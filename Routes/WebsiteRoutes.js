
const {  createData, getDataById, updateData, deleteData, getAllMerchantData, getAllWebData }=require('../Controllers/WebisteController')
const authenticate = require('../Middleware/auth')
const { upload } = require('../Multer/Multer')

const router=require('express').Router()

router.get('/getAllWebsite', getAllWebData)
router.get('/getAllMerchant',authenticate,getAllMerchantData)
router.post('/create',createData)
router.get('/get/:id',getDataById)
router.put('/update/:id',updateData)
router.delete('/delete/:id',authenticate,deleteData) 


module.exports=router

