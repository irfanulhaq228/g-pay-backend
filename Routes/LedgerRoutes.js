
const { createData, getDataById, updateData, deleteData, imageUploadData, getAllAdminData, getAllMerchantData, getCardAdminData, getCardMerchantData, getMonthlyAdminData, getMonthlyMerchantData, compareDataReport, getAllUserData, extractPayData, getAllAdminDataWithoutPag, getAllMerchantDataWithoutFilter, getCardMerchantDataByAdmin, getBankMerchantDataByAdmin, getTransactionSummaryByAdmin, getMerchantWithdrawData, getMerchantExcelWithdrawData, getTransactionSummaryByAdminTest } = require('../Controllers/LedgerController')
const authenticate = require('../Middleware/auth')
const { upload } = require('../Multer/Multer')

const router = require('express').Router()

router.get('/getAllAdminWithoutPag', authenticate, getAllAdminDataWithoutPag)
router.get('/getAllAdmin', authenticate, getAllAdminData)
router.get('/getAllMerchantWithoutPag', authenticate, getAllMerchantDataWithoutFilter)
router.get('/getAllMerchant', authenticate, getAllMerchantData)
router.get('/get-transaction', getAllUserData)
router.get('/cardAdminData', authenticate, getCardAdminData)
router.get('/withdrawData', authenticate, getMerchantWithdrawData)
router.get('/excelWithdrawData', authenticate, getMerchantExcelWithdrawData)
router.get('/cardMerchantData', authenticate, getCardMerchantData)
router.get('/cardAdminMerchantData', authenticate, getCardMerchantDataByAdmin)
router.get('/bankAdminMerchantData', authenticate, getBankMerchantDataByAdmin)
router.get('/transactionSummary', authenticate, getTransactionSummaryByAdmin)
router.get('/transactionSummaryTest', authenticate, getTransactionSummaryByAdminTest)
router.get('/monthlyAdminData', authenticate, getMonthlyAdminData)
router.get('/monthlyMerchantData', authenticate, getMonthlyMerchantData)
router.post('/compare', compareDataReport)
router.post('/create', upload.single('image'), createData)
router.post('/getImageData', upload.single('image'), imageUploadData)
router.get('/get/:id', getDataById)
router.put('/update/:id', upload.single('image'), updateData)
router.delete('/delete/:id', authenticate, deleteData)


module.exports = router

