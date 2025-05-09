const { createData, getAllPortals, deletePortal } = require('../Controllers/PortalController')
const authenticate = require('../Middleware/auth')

const portalRouter = require('express').Router()

portalRouter.post('/create', authenticate, createData)
portalRouter.get('/getAll', getAllPortals)
portalRouter.delete('/delete/:id', deletePortal)


module.exports = portalRouter