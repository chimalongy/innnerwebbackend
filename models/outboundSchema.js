
const mongoose= require("mongoose")

const outBoundSchema= mongoose.Schema({
    ownerAccount:{type:String, required:true},
    outboundName:{type:String, required:true},
    emailList:{type:Array, required:true},
    tasks:{type:Number, required:false},
},{timestamps:true})

const outBoundModel= mongoose.model("outBoundModel", outBoundSchema);

module.exports= outBoundModel