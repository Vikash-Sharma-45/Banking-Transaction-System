const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
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