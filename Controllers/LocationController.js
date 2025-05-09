const jwt = require('jsonwebtoken');
const Location = require('../Models/LocationModel');

//1:
const createData = async (req, res) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.json({ status: 401 }, { message: "No token provided" })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        var adminId = decoded.adminId;
        console.log("adminId ====> ", adminId);

        if (!adminId) {
            return res.status(400).json({ status: 'fail', message: 'Admin not found!' });
        }

        const {exchangeId, location} = req.body

        if (!exchangeId || !location) {
            return res.status(400).json({status: 'fail', message: 'Both exhangeId and location are required'})
        }

        const newLocation = await Location.create({
            exchangeId,
            location
        })

        return res.status(200).json({ status: 'ok', message: 'Data Created Successfully!', data: newLocation });

    } catch (error) {
        return res.json({ status: 400 }, { message: "Error creating the Location" })
    }

}


//2: 

const getAllLocations = async (req, res) => {
    try {

        const locations = await Location.find().populate(['exchangeId'])

        return res.status(200).json({status: 'success', message: 'Locations Fetched', data: locations})

    } catch (error) {
        return res.status(500).json({status: 'fail', message: 'Error getting the locations'})
    }
}

//3: 

const getLocationById = async (req, res) => {
    try {
        const id = req.params.id
        if (!id){
            return res.status(404).json({status: 'fail', message: 'Id is missing'})
        }

        const locationById = await Location.find({ exchangeId: id })

        return res.status(200).json({status: 'ok', message: 'Loacations fetched Successfully', data: locationById})

    } catch (error) {
        return res.status(500).json({status: 'fail', message: 'Cannot fetch the location right now'})
    }
}


//4:
const deleteLocation = async (req, res) => {
    try {
        const {id} = req.params
        if (!id) {
            return res.status(400).json({status: 'fail', message:'id not found'})
        }

        await Location.findByIdAndDelete(id)

        return res.status(200).json({status: 'success', message: 'Location Deleted Successfully'})

    } catch (error) {
        return res.status(500).json({status: 'fail', message: 'Error deleting the locations'})
    }
}

//5:
const updateLocation = async (req, res) => {
    try {
        const {id} = req.params
        if (!id) {
            return res.status(400).json({status: 'fail', message:'id not found'})
        }

        await Location.findByIdAndUpdate(id)

        return res.status(200).json({status: 'success', message: 'Location Updated Successfully'})

    } catch (error) {
        return res.status(500).json({status: 'fail', message: 'Error Updating the locations'})
    }
}



module.exports = {
    createData,
    getAllLocations,
    deleteLocation,
    updateLocation,
    getLocationById
}