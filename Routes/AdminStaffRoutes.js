
const { getAllData, createData, getDataById, updateData, deleteData, loginData } = require('../Controllers/AdminStaffController')
const authenticate = require('../Middleware/auth')
const { upload } = require('../Multer/Multer')

const router = require('express').Router()

router.get('/getAll', authenticate, getAllData)
router.post('/create', authenticate, createData)
router.get('/get/:id', getDataById)
router.post('/login', loginData)
router.put('/update/:id', updateData)
router.delete('/delete/:id', deleteData)


module.exports = router

