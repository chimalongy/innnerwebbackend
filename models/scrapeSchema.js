const mongoose = require('mongoose');

const scrapeSchema = mongoose.Schema({
    ownerAccount: { type: String, required: true },
    scrapeName: { type: String, required: true },
    scrapeResults: { type: Array, required: false },
    completed: { type: Boolean, required: false }

}, { timestamps: true })

const scrapeModel = mongoose.model("scrapeModel", scrapeSchema);
module.exports = scrapeModel;