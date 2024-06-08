
const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    ownerAccount: { type: String, required: true },
    outboundName: { type: String, required: true },
    taskName: { type: String, required: true },
    taskDate: { type: String, required: true },
    taskTime: { type: String, required: true },
    taskSendingRate: { type: Number, required: true },
    taskSubject: { type: String, required: true },
    taskBody: { type: String, required: true },
    status: { type: String, required: true }
})

const taskModel = mongoose.model("taskModel", taskSchema)

module.exports = taskModel