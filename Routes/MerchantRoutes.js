
const { getAllData, createData, getDataById, updateData, deleteData, loginData, verifyData, webInfo, getDataByWebsite } = require('../Controllers/MerchantController')
const authenticate = require('../Middleware/auth')
const { upload } = require('../Multer/Multer')

const router = require('express').Router()

router.get('/getAll', authenticate, getAllData)
router.post('/create', upload.single('image'), authenticate, createData)
router.get('/get/:id', getDataById)
router.get('/getWebsite', getDataByWebsite)
router.post('/web-info', webInfo)
router.post('/login', loginData)
router.post('/verify', authenticate, verifyData)
router.put('/update/:id', upload.single('image'), updateData)
router.delete('/delete/:id', deleteData)


module.exports = router

