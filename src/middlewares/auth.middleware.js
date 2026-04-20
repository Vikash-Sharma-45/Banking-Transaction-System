const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")


async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if(!token) {
        return res.status(401).json({
            message: "Unauthorized Access! token is missing"
        })
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)

        const user = await userModel.findById(decoded.userId)

        req.user = user

        return next()

    }catch(err) {

        


        res.status(401).json({
            message: "Unauthorized Access! token is Invalid"
        })
    }
}

async function authSystemUserMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token) {
        return res.status(401).json({
            message: "Unauthorized Access! token is missing"
        })
    }

    try {
        const decoded = jwt .verify(token, process.env.JWT_SECRET_KEY)

        const user = await userModel.findById(decoded.userId).select("+systemUser")

        if(!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden Access! You don't have permission to access this resource"
            })
        }

        req.user = user

        return next()
    }
    catch(err){
        return res.status(401).json({
            message: "Unauthorized Access! token is Invalid"
        })
    }

    
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}