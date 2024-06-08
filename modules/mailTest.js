const mongoose = require("mongoose");
const nodemailer = require("nodemailer")
const emailModel = require('../models/emailSchema')
require ("dotenv").config()


const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "clonginus8@gmail.com",
        pass: "kmqqtwmoqsvykxkd"
        // pass: "nysnshlalginggnm"
    }
})

const sendTest = (receiverName, receiverEmail) => {
    return new Promise((resolve, reject) => {

        const mailOptions = {
            from: '"James MacCain" <james@geniusdomainnames.com>',
            to: receiverEmail,
            subject: "Hello Test",
            text: "Hello"
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                reject("failed to send");
            } else {
                resolve("email sent");
            }
        });
    });
};

//sendTest("Chima", "me.chimaobi@gmail.com")

async function UpdateEmails() {
    mongoose.connect("mongodb+srv://letsoutbound:chimsyboy@letsoutbound.aqazapy.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });
    await emailModel.updateMany({}, { $set: { primaryEmail: 'true',parentEmail:"" }})
    .then((results) => {
        console.log('Query results:', results);
      })
      .catch((err) => {
        console.error('Error:', err);
      });
   
}

UpdateEmails()