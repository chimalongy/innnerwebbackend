
const mongoose= require("mongoose")

const v2outBoundSchema= mongoose.Schema({
    outboundName:{type:String, required:true},
    emailList:{type:Array, required:true},
    messageIDs:{type:Array, required:true},
    unSubscriptions:{type:Array, required:true},
    outboundEmail:{type:String, required:true},
    tasks:{type:Number, required:false},
},{timestamps:true})

const v2outBoundModel= mongoose.model("v2outBoundModel", v2outBoundSchema);

module.exports= v2outBoundModel