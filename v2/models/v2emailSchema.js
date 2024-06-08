const mongoose = require("mongoose");

const v2emailSchema = mongoose.Schema({
    emailAddress: { type: String, required: true },
    senderName: { type: String, required: true },
    password: { type: String, required: true },
    host: { type: String, required: true },
    sendingport: { type: Number, required: true },
    signature: { type: String, required: true }
}, { timestamps: true });

const v2emailModel = mongoose.model("v2emailModel", v2emailSchema);

module.exports = v2emailModel;
