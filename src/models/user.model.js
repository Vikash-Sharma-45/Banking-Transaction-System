const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email : {
        type : String,
        required : [true, "Email is Required for creating a user"],
        trim : true,
        lowercase : true,
        match : [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        , "Email is Invalid"],
        unique : [true, "Email is already registered"]
    },
    name : {
        type : String,
        required : [true, "Name is Required for creating an account"]
    },
    password : {
        type : String,
        required : [true, "Password is Required for creating an account"],
        minlength : [6, "Password should contain at least 6 characters"],
        select : false
    }
}, {
    timestamps : true
})

userSchema.pre("save", async function(next) {
 if(!this.isModified("password")) {
    return next()
 }

 const hash = await bcrypt.hash(this.password, 10)
 this.password = hash
 return next()
})

userSchema.methods.comparePassword = async function(password) {

    return bcrypt.compare(password, this.password)
}

const userModel = mongoose.model("user", userSchema)

module.exports = userModel