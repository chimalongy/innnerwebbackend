const { default: mongoose } = require("mongoose")
const mogoose= require("mongoose")

const emailSchema= mogoose.Schema({
    ownerAccount:{type:String, required:true},
    emailAddress:{type:String, required:true},
    password:{type:String, required:true},
    senderName:{type:String, required:true},
    signature:{type:String, required:true},
    dailySendingCapacity:{type:Number, required:true},
    daysAssigned:{type:Array, required:false},
    primaryEmail:{type:Boolean, required:true},
    parentEmail:{type:String, required:false}
},{timestamps:true})

const emailModel= mongoose.model("emailModel", emailSchema);

module.exports= emailModel