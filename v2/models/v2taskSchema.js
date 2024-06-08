
const mongoose = require('mongoose');

const v2taskSchema = mongoose.Schema({
    
    outboundName: { type: String, required: true },
    taskName: { type: String, required: true },
    taskDate: { type: String, required: true },
    taskTime: { type: String, required: true },
    taskSubject: { type: String, required: true },
    taskBody: { type: String, required: true },
    taskType: { type: String, required: true },
    status: { type: String, required: true }
})

const v2taskModel = mongoose.model("v2taskModel", v2taskSchema)

module.exports = v2taskModel