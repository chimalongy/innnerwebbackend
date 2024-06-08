const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, {timestamps:true})

const userModel = mongoose.model("userModel", userSchema)

module.exports= userModel 