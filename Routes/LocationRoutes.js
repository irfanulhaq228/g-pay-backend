const { createData, getAllLocations, deleteLocation, updateLocation, getLocationById } = require('../Controllers/LocationController')
const authenticate = require('../Middleware/auth')

const locationRouters = require('express').Router()

locationRouters.post('/create', authenticate, createData)
locationRouters.get('/getAll', getAllLocations)
locationRouters.put('/update/:id', updateLocation)
locationRouters.delete('/delete/:id', deleteLocation)
locationRouters.get('/get/:id', getLocationById)


module.exports = locationRouters