
const { getAllData, createData, getDataById, updateData, deleteData }=require('../Controllers/LoginHistoryController')
const authenticate = require('../Middleware/auth')

const router=require('express').Router()

router.get('/getAll',authenticate,getAllData)
router.post('/create',createData)
router.get('/get/:id',getDataById)
router.put('/update/:id',updateData)
router.delete('/delete/:id',deleteData)


module.exports=router

