const jwt = require('jsonwebtoken')
const Portal = require('../Models/PortalModel')

//1: 

const createData = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '')        

        if (!token) {
            return res.status(400).json({status: 'fail', message: 'No token provided'})
        }

        const {portalName} = req.body

        if(!portalName) {
            return res.status(404).json({status: 'fail', message: 'Portal Name is required'})
        }

        const newPortalName = await Portal.create({
            portalName
        })

        return res.status(200).json({status: 'ok', message: 'Portal created Successfully', data: newPortalName})

        
    } catch (error) {
        return res.status(500).json({status: 'fail', message: 'Error creating the Portal'})
    }
}


//2: 


const getAllPortals = async (req, res) => {
    try {

        const portals = await Portal.find()

        return res.status(200).json({status: 'success', message: 'Portal Fetched Successfully', data: portals})

    } catch (error) {
        return res.status(500).json({status: 'fail', message: 'Error getting the Portals'})
    }
}


//3: 
const deletePortal = async (req, res) => {
    try {
        const {id} = req.params
        if (!id) {
            return res.status(400).json({status: 'fail', message:'id not found'})
        }

        await Portal.findByIdAndDelete(id)

        return res.status(200).json({status: 'success', message: 'Portal Deleted Successfully'})

    } catch (error) {
        return res.status(500).json({status: 'fail', message: 'Error deleting the Portal'})
    }
}


module.exports = {
    createData,
    getAllPortals,
    deletePortal

}