const userModel = require("../Models/UserModel.js");
const jwt = require("jsonwebtoken");

const createUser = async (req, res) => {
    try {
        const { phone, username, admin } = req.body;

        const existingUser = await userModel.findOne({
            $or: [
                { phone, admin },
                { username, admin }
            ]
        });

        if (existingUser) {
            if (existingUser.phone === phone && existingUser.admin === admin) {
                return res.status(409).json({ message: "Phone Number already exists" });
            }
            if (existingUser.username === username) {
                return res.status(409).json({ message: "Username already exists" });
            }
        }

        const user = new userModel(req.body);
        await user.save();

        const id = user._id;
        const token = jwt.sign({ id }, process.env.SECRET_KEY, { expiresIn: '30d' });

        return res.status(200).json({ message: "User created successfully", token, data: user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error!" });
    }
};

const loginUser = async (req, res) => {
    try {
        const { phone, password, admin } = req.body;
        const user = await userModel.findOne({ phone });
        if (!user) {
            return res.status(401).json({ message: "Incorrect Phone Number or Password" });
        }
        if (!admin) {
            return res.status(401).json({ message: "Add Admin" });
        }
        if (user?.admin.toHexString() !== admin) {
            return res.status(401).json({ message: "First Signup to this Website" });
        }
        if (user?.password !== password) {
            return res.status(401).json({ message: "Incorrect Phone Number or Password" })
        }
        if (user?.disabled) {
            return res.status(401).json({ message: "You are disabled by Admin" })
        }
        const id = user?._id;
        const token = jwt.sign({ id }, process.env.SECRET_KEY, { expiresIn: '30d' });
        return res.status(200).json({ message: "User logged in successfully", token, data: user });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const getAllUsers = async (req, res) => {
    try {
        const user = await userModel.find();
        if (user.length === 0) {
            return res.status(400).json({ message: "User Data is Empty" })
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: user });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel.findByIdAndDelete(id);
        if (user) {
            return res.status(200).json({ message: "User Deleted Successfully" });
        }
        return res.status(400).json({ message: "Wrong User Id" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const updateStatus = async (req, res) => {
    try {
        const { value } = req.body;
        const { id } = req.params;
        await userModel.findByIdAndUpdate(id, { disabled: value });
        return res.status(200).json({ message: "User Updated" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const checkUser = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token || token === "") {
            return res.status(400).json({ message: 'No token provided' });
        }
        await jwt.verify(token, process.env.SECRET_KEY, async (err, decoded) => {
            if (err) {
                return res.status(400).json({ message: 'Failed to authenticate token' });
            }
            const user = await userModel.findById(decoded.id);
            if (user.disabled) {
                return res.status(400).json({ message: "Failed" });
            }
            return res.status(200).json({ message: "Checked", wallet: user?.wallet, username: user?.username });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

module.exports = {
    createUser,
    loginUser,
    getAllUsers,
    deleteUser,
    updateStatus,
    checkUser
};