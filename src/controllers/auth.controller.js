const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")

/** 
 * - user register controller
 * - POST /api/auth/register
*/

async function userRegisterController(req, res) {

    const {email, password, name } = req.body;

    const isExist = await userModel.findOne({
        email: email
    })

    if(isExist) {
        return res.status(422).json({
            message: "User already exist with this email",
            status: "failed"
        })
    }

    const user = await userModel.create({
        email,
        password,
        name
    })

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET_KEY, {expireIn : "3d"})

    res.cookies("token", token)
    res.send(201).json({
        user: {
            _id : user._id,
            email : user.email,
            name : user.name
        }, 
        token
    })
}

module.exports = {
    userRegisterController
}