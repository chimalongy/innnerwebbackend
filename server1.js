require('dotenv').config()
const express = require("express");
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcryt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const userModel = require('./models/userSchema');
const emailModel = require('./models/emailSchema')
const outBoundModel = require('./models/outboundSchema');
const taskModel = require('./models/taskSchema')
const scrapeModel = require("./models/scrapeSchema")
let port = process.env.PORT;
const { sendSingle, testemail, contactemail, sendRegistrationCode, sendOutboundEmailNotFound, sendOutboundEmailDataNotFound, sendUpdatePasswordCode, sendPasswordUpdateConfirmation } = require('./modules/emailSender')
//const ScrapeLinks = require("./modules/scrapeEngine")

const cron = require('node-cron')


global.cronJobs = {}
const emailSender = require('./modules/outboundEngine');
const path = require('path')

 

const app = express();
app.use(cors());
app.use(bodyParser.json())

//set up cron jobs

function setupCronJob(taskName, schedule, taskFunction, timeZone) {
    global.cronJobs[taskName] = cron.schedule(schedule, taskFunction, {
        timezone: timeZone // Specify the desired time zone
    });
}

// async function setupScrapeJob(ownerAccount, scrapeName, scrapeLinks) {
//     let scrapeResult = await ScrapeLinks(scrapeLinks);
//     console.log(scrapeResult)
//     let updateScraping = await scrapeModel.findOneAndUpdate({ ownerAccount: ownerAccount, scrapeName: scrapeName }, { $set: { scrapeResults: scrapeResult, completed: true } }, { new: true })

// }





app.post("/sendsingle", async (req, res) => {
    const { sendingEmail, sendingFrom, emailPassword, emailSignature, senderName, emailSubject, emailBody, reciever } = req.body
    if (await sendSingle(sendingEmail, sendingFrom, emailPassword, emailSignature, senderName, emailSubject, emailBody, reciever) == true) {
        res.status(200).json({ message: "sent" })
    }
    else {
        res.status(200).json({ message: "failed" })
    }

})
app.post("/testemail", async (req, res) => {
    const { email, sendas, password } = req.body
    if (await testemail(email, sendas, password) == true) {
        res.status(200).json({ message: "sent" })
    }
    else {
        res.status(200).json({ message: "failed" })
    }

})




app.post("/contact", async (req, res) => {
    const { name, email, message } = req.body
    if (await contactemail(name, email, message) == true) {
        res.status(200).json({ message: "sent" })
    }
    else {
        res.status(200).json({ message: "failed" })
    }

})



// send registration code
app.post("/sendregisterationcode", async (req, res) => {
    try {
        const { recieverName, reciverEmail, code } = req.body
        const mailSent = await sendRegistrationCode(recieverName, reciverEmail, code);
        if (mailSent === "email sent") {
            res.status(200).json({ message: mailSent })
        }
    } catch (error) {
        res.status(400).json(error.message)
    }
})
app.post("/sendUpdatePasswordCode", async (req, res) => {

    try {
        const { recieverEmail, code } = req.body;
        sendUpdatePasswordCode(recieverEmail, code)
        res.status(200).json({ message: "email-sent" })
    }
    catch (error) {
        return res.status(200).json({ message: "error-connecting" })
    }
})
app.post("/finduser", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email: email })
        if (!user) {
            return res.status(200).json({ message: "not-found" });
        }
        res.status(200).json({ message: "found" })
    }
    catch (error) {
        res.status(400).json(error.message);
    }
})
app.post("/findemail", async (req, res) => {
    try {
        const { ownerAccount, emailAddress } = req.body;
        const emailCheck = await emailModel.findOne({ ownerAccount: ownerAccount, emailAddress: emailAddress })
        if (!emailCheck) {
            return res.status(200).json({ message: "not-found" });
        }
        else {
            res.status(200).json({ message: "found", data: emailCheck })
        }
    }
    catch (error) {
        res.status(400).json(error.message);
    }
})
app.post("/findsimilaremails", async (req, res) => {
    try {
        const { ownerAccount, emailAddress } = req.body;


        const emailCheck = await emailModel.find({ ownerAccount: ownerAccount, emailAddress: emailAddress })
        if (emailCheck) {
            return res.status(200).json({ message: "found", data: emailCheck })
        }
        else {
            return res.status(200).json({ message: "not-found" })
        }

    }
    catch (error) {
        res.status(400).json(error.message);
    }
})


app.post("/updatePassword", async (req, res) => {

    try {
        const { recieverEmail, password } = req.body;
        hashedpassword = await bcryt.hash(password, 10)


        const user = await userModel.findOne({ email: recieverEmail })
        user.password = hashedpassword;
        const result = await user.save()

        if (!result) {
            return res.status(200).json({ message: "not-updated" })
        }
        else {
            sendPasswordUpdateConfirmation(user.firstName, user.email)
            return res.status(200).json({ message: "updated" })
        }






    }
    catch (error) {
        return res.status(200).json({ message: JSON.stringify(error) })
    }
})
app.post("/updatedaysassigned", async (req, res) => {
    try {
        const { ownerAccount, email, day, taskName } = req.body
        // Find the document by its email address
        const findEmail = await emailModel.findOne({ ownerAccount: ownerAccount, emailAddress: email })
        if (!findEmail) {
            return res.status(200).json({ message: "emailnotfound" })
        }

        let assignedData = [day, taskName]
        const pushed = findEmail.daysAssigned.push(assignedData)

        if (!pushed) {
            res.status(200).json({ message: "could not push" })
        }

        findEmail.save();
        res.status(200).json(findEmail);

    } catch (error) {
        res.status(400).json(error.message)
    }
})
app.post("/updateEmailData", async (req, res) => {
    try {
        const { ownerAccount, emailAddress, sendingFrom, signature, senderName, dailySendingCapacity } = req.body
        console.log(req.body)

        // Find the document by its email address

        if (emailAddress == sendingFrom) {


            const updatedEmail = await emailModel.findOneAndUpdate(
                { ownerAccount: ownerAccount, emailAddress: emailAddress },
                { $set: { senderName: senderName, signature: signature, dailySendingCapacity: dailySendingCapacity } },
                { new: true }
            );

            if (updatedEmail) { return res.status(200).json({ message: "email-updated" }) }
            else { return res.status(200).json({ message: "email-not-updated" }) }
        }
        else {
            const updatedEmail = await emailModel.findOneAndUpdate(
                { ownerAccount: ownerAccount, emailAddress: emailAddress, parentEmail: sendingFrom },
                { $set: { senderName: senderName, signature: signature, dailySendingCapacity: dailySendingCapacity } },
                { new: true }
            );

            if (updatedEmail) { return res.status(200).json({ message: "email-updated" }) }
            else { return res.status(200).json({ message: "email-not-updated" }) }
        }




        // if (!findEmail) {
        //     return res.status(200).json({ message: "emailnotfound" })
        // }

        // let assignedData=[day,taskName]
        // const pushed = findEmail.daysAssigned.push(assignedData)

        // if (!pushed) {
        //     res.status(200).json({ message: "could not push" })
        // }

        // findEmail.save();
        // res.status(200).json(findEmail);

    } catch (error) {
        res.status(400).json(error.message)
    }
})




app.post("/registeremail", async (req, res) => {
    try {
        const { ownerAccount, emailAddress, password, senderName, signature, dailySendingCapacity, primary, parentEmail } = req.body;

        const user = await userModel.findOne({ email: ownerAccount })

        const hashedpassword = await bcryt.hash(password, 10);
        if (primary == true) {
            console.log("primary true")
            const newEmail = await emailModel.create({ ownerAccount, emailAddress, password, senderName, signature, dailySendingCapacity, primaryEmail: true })
            res.status(200).json({ message: "registrationComplete" })
        }
        else {
            console.log("primary false")
            const newEmail = await emailModel.create({ ownerAccount, emailAddress, password, senderName, signature, dailySendingCapacity, primaryEmail: false, parentEmail: parentEmail })
            res.status(200).json({ message: "registrationComplete" })
        }


    }
    catch (error) {
        // res.status(400).json(error);
        console.log(error)
    }
})
app.post("/registeroutbound", async (req, res) => {
    try {

        const { ownerAccount, outboundName, emailList } = req.body;
        const outbound = await outBoundModel.findOne({ outboundName: outboundName })
        if (outbound) { return res.status(200).json({ message: "already-exist" }) }
        const newOutbound = await outBoundModel.create({ ownerAccount, outboundName, emailList, tasks: 0 })
        res.status(200).json({ message: "registrationComplete" })
    }
    catch (error) {
        res.status(400).json(error.message);
    }
})

app.post("/registerscrape", async (req, res) => {
    const { ownerAccount, scrapeName, scrapeLinks } = req.body
    let scrapingExist = await scrapeModel.findOne({ ownerAccount: ownerAccount, scrapeName: scrapeName })
    if (scrapingExist) { return res.status(200).json("scraping-exist") }
    else {
        setupScrapeJob(ownerAccount, scrapeName, scrapeLinks)
        let newScrape = await scrapeModel.create({ ownerAccount: ownerAccount, scrapeName: scrapeName, scrapeLinks: scrapeLinks, completed: false })
        if (newScrape) { return res.status(200).json("scraping-registered") }
        else { return res.status(200).json("error") }

    }
})


app.post("/registertask", async (req, res) => {
    try {

        const { ownerAccount, outboundName, taskName, taskDate, taskTime, taskSendingRate, taskSubject, taskBody, timeZone, taskGreeting, taskBodyType } = req.body;


        async function taskFunction() {

            // 1. GET ALL EMAIL DATA
            const thisUserRegisteredEmails = await emailModel.find({ ownerAccount: ownerAccount })

            if (thisUserRegisteredEmails) {
                //2. GET OUBOUND DATA
                const thisOutbound = await outBoundModel.findOne({ outboundName: outboundName })

                if (thisOutbound) {

                    let emailList = thisOutbound.emailList

                    for (let index = 0; index < emailList.length; index++) {
                        let element = emailList[index]

                        //3 CHECK IF EMAIL EXISTS IN USER EMAILS
                        let allocatedEmailExist = false;
                        let sendingFromExist = false;

                        if (element.allocatedEmail == element.sendingFrom) {
                            for (let i = 0; i < thisUserRegisteredEmails.length; i++) {
                                if (thisUserRegisteredEmails[i].emailAddress == element.sendingFrom) {
                                    sendingFromExist = true;
                                    allocatedEmailExist = true;
                                    // console.log(`
                                    //     You selected the seconding email ${element.allocatedEmail} whose parent email is ${element.sendingFrom}\n
                                    //     it was fond to be parent email.

                                    // `)

                                }
                            }
                        }
                        else {
                            for (let i = 0; i < thisUserRegisteredEmails.length; i++) {
                                if (element.allocatedEmail == thisUserRegisteredEmails[i].emailAddress) {
                                    if ((thisUserRegisteredEmails[i].primaryEmail !== true) && (thisUserRegisteredEmails[i].parentEmail == element.sendingFrom)) {
                                        allocatedEmailExist = true;
                                        // console.log(`
                                        //             You selected the seconding email ${element.allocatedEmail} whose parent email is ${element.sendingFrom}\n
                                        //             it was fond.

                                        //         `)
                                    }

                                }
                                else if (element.sendingFrom == thisUserRegisteredEmails[i].emailAddress) { sendingFromExist = true }
                            }
                        }


                        // console.log(thisUserRegisteredEmails)

                        if (allocatedEmailExist && sendingFromExist) {
                            let allocatedEmail = element.allocatedEmail; // what will be show on the email
                            let sendingFrom = element.sendingFrom;// sending email address
                            let allocatedEmailData;
                            let sendingFromData;

                            console.log("the allocated email is : " + allocatedEmail)
                            console.log("the sending from email is : " + sendingFrom)

                            let senderName = "";
                            let senderSignature;
                            let senderPassword = ""
                            let sendingEmail = ""
                            let visibleEmail = ""


                            // EXTRACTING exact pair MAIL DATA
                            if (allocatedEmail == sendingFrom) {
                                for (let i = 0; i < thisUserRegisteredEmails.length; i++) {
                                    if (thisUserRegisteredEmails[i].emailAddress == allocatedEmail) {
                                        allocatedEmailData = thisUserRegisteredEmails[i]
                                    }
                                }

                                senderName = allocatedEmailData.senderName;
                                senderSignature = allocatedEmailData.signature;
                                senderPassword = allocatedEmailData.password
                                sendingEmail = allocatedEmailData.emailAddress
                                visibleEmail = allocatedEmailData.emailAddress

                            }
                            else {
                                for (let i = 0; i < thisUserRegisteredEmails.length; i++) {
                                    if (thisUserRegisteredEmails[i].emailAddress == sendingFrom) {
                                        sendingFromData = thisUserRegisteredEmails[i]
                                    }
                                }

                                for (let i = 0; i < thisUserRegisteredEmails.length; i++) {
                                    if (thisUserRegisteredEmails[i].emailAddress == allocatedEmail && thisUserRegisteredEmails[i].parentEmail == sendingFrom) {
                                        allocatedEmailData = thisUserRegisteredEmails[i]
                                    }
                                }

                                senderName = allocatedEmailData.senderName;
                                senderSignature = allocatedEmailData.signature;
                                senderPassword = allocatedEmailData.password
                                sendingEmail = sendingFromData.emailAddress
                                visibleEmail = allocatedEmailData.emailAddress
                            }
                            let newBody;

                            if (taskBodyType == "text") { newBody = taskBody + "\n\n" + senderSignature }
                            else {
                                // let lines = senderSignature.split('\n');
                                // let newsenderSignature = "";
                                // lines.forEach(line => {
                                //     newsenderSignature += '<p>' + line + '</p>';
                                // });

                                // let newsenderSignature = `<pre>${senderSignature}</pre>`;
                                let newsenderSignature = `<p style="white-space: pre-line;">${senderSignature}</p>`;


                                newBody = taskBody + "<br/>" + newsenderSignature
                            }
                            let sent = emailSender.sendOutbound(sendingEmail, visibleEmail, senderPassword, senderName, taskSubject, newBody, element.emailAllocations, element.nameAllocations, taskSendingRate, taskName, outboundName, taskGreeting, ownerAccount, taskBodyType)


                        }
                        else {
                            //send an email to the owner telling him that he deleted the email required to  send a task
                            sendOutboundEmailNotFound(ownerAccount, outboundName, taskName, senderEmail)
                        }

                    }


                }
                else {
                    // send email outbound not found
                }

            }





        }



        const [year, month, day] = taskDate.split('-').map(Number);
        const [hour, minute] = taskTime.split(':').map(Number);
        const scheduledDate = new Date(year, month - 1, day, hour, minute);
        const cronSchedule = `${minute} ${hour} ${day} ${month} *`;

        setupCronJob(taskName, cronSchedule, taskFunction, timeZone)

        //save task
        const newTask = await taskModel.create({ ownerAccount, outboundName, taskName, taskDate, taskTime, taskSendingRate, taskSubject, taskBody, status: "pending" })
        //update taskCount

        outBoundModel.findOne({ outboundName: outboundName })
            .then((result) => {
                if (result) {
                    let taskCount = result.tasks;
                    let newCount = taskCount + 1;


                    return outBoundModel.findOneAndUpdate({ outboundName: result.outboundName }, { $set: { tasks: newCount } });
                } else {
                    // Handle the case where no document was found with the given outboundName
                    console.log('Document not found');
                    return null;
                }
            })
            .then((updatedDocument) => {
                if (updatedDocument) {

                }
            })
            .catch(err => console.log(err));





        res.status(200).json({ message: "registrationComplete" })

    }
    catch (error) {
        res.status(400).json(error.message);
    }
})
app.post("/register", async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const hashedpassword = await bcryt.hash(password, 10);
        const newUser = await userModel.create({ firstName, lastName, email, password: hashedpassword })
        res.status(200).json({ message: "registrationComplete" })
    }
    catch (error) {
        res.status(400).json(error.message);
    }
})



//login
app.post("/login", async (req, res) => {
    const { email, password } = req.body
    const user = await userModel.findOne({ email: email })
    if (!user) {
        return res.status(200).json({ message: "not-registered" })
    }
    const isPasswordValid = await bcryt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(200).json({ message: "wrong-password" })
    }
    const token = jwt.sign({ userID: user._id }, process.env.SECRETE_KEY, { expiresIn: "1hr" })
    res.status(200).json({ message: "login-success", token: token, userData: user })
})

app.post("/getuseroutbounds", async (req, res) => {
    try {
        const { ownerAccount } = req.body;
        const userOutbounds = await outBoundModel.find({ ownerAccount: ownerAccount });
        if (!userOutbounds) {
            return res.status(200).json({ message: "no-outbound-registered" })
        }
        return res.status(200).json({ message: "outbounds-found", data: userOutbounds })

    } catch (error) {
        return res.status(400).json(error.message)
    }
})
app.post("/getuseroutboundemails", async (req, res) => {
    try {
        const { ownerAccount } = req.body;
        const userEmails = await emailModel.find({ ownerAccount: ownerAccount });
        if (!userEmails) {
            return res.status(200).json({ message: "no-emails-registered" })
        }
        return res.status(200).json({ message: "emails-found", data: userEmails })

    } catch (error) {
        return res.status(400).json(error.message)
    }
})
app.post("/getusertasks", async (req, res) => {
    try {
        const { ownerAccount } = req.body;
        const userTasks = await taskModel.find({ ownerAccount: ownerAccount });
        if (!userTasks) {
            return res.status(200).json({ message: "no-task-found" })
        }
        return res.status(200).json({ message: "tasks-found", data: userTasks })

    } catch (error) {
        return res.status(400).json(error.message)
    }
})
app.post("/getuserscrapings", async (req, res) => {
    try {
        const { ownerAccount } = req.body;
        const userScrapings = await scrapeModel.find({ ownerAccount: ownerAccount });
        if (!userScrapings) {
            return res.status(200).json({ message: "no-scrappings-found" })
        }
        return res.status(200).json({ message: "scrapings-found", data: userScrapings })

    } catch (error) {
        return res.status(400).json(error.message)
    }
})





app.post("/deleteOutbound", async (req, res) => {

    const { outboundName, ownerAccount } = req.body;

    try {
        // Delete documents from outBoundModel
        const outBoundResult = await outBoundModel.deleteMany({ outboundName, ownerAccount });
        console.log(`${outBoundResult.deletedCount} document(s) deleted from outBoundModel.`);
    } catch (err) {
        console.error("Error deleting documents from outBoundModel:", err);
    }


    try {
        const tasks = await taskModel.find({ outboundName: outboundName })

        for (let i = 0; i < tasks.length; i++) {
            let taskName = tasks[i].taskName
            if (global.cronJobs[taskName]) {
                global.cronJobs[taskName].stop();
                console.log(`Cron job for ${taskName} has been stopped.`);
                console.log("current jobs =" + cronJobs)
            } else {
                console.log(`No cron job found for ${taskName}.`);
            }
        }
    }
    catch (error) { console.error("Error findiing documents from taskModel:", err); }

    try {
        // Delete documents from taskModel
        const taskResult = await taskModel.deleteMany({ outboundName });
        console.log(`${taskResult.deletedCount} document(s) deleted from taskModel.`);
    } catch (err) {
        return res.status(200).json(err)
    }

    res.status(200).json({ message: "outbond-deleted" })

})
app.post("/deleteOutboundEmail", async (req, res) => {

    const { outboundName, emailsToDelete } = req.body;
    for (let i = 0; i < emailsToDelete.length; i++) {
        console.log(emailsToDelete[i])
    }


    // Delete documents from outBoundModel
    outbound = await outBoundModel.findOne({ outboundName: outboundName })
    let newMailList = []


    if (outbound) {
        outbound.emailList.forEach(emailEntry => {

            let formerEmailList = emailEntry.emailAllocations
            let formerNameList = emailEntry.nameAllocations

            let newEmailList = []; let newNameList = []

            for (let i = 0; i < formerEmailList.length; i++) {
                let exist = false
                for (let j = 0; j < emailsToDelete.length; j++) {
                    if (emailsToDelete[j] === formerEmailList[i]) {
                        exist = true
                    }
                }
                if (exist == false) {
                    newEmailList.push(formerEmailList[i])
                    newNameList.push(formerNameList[i])
                }
            }
            emailEntry.emailAllocations = newEmailList;
            emailEntry.nameAllocations = newNameList;

        });
        newMailList = outbound.emailList
    }
    else {
        return res.status(200).json({ message: "outbound-not-found" })
    }

    try {
        const updatedDoc = await outBoundModel.findOneAndUpdate(
            { outboundName: outboundName, },
            { $set: { emailList: newMailList } },
            { new: true }
        );

        if (updatedDoc) {
            return res.status(200).json({ message: "deleted" })
        } else {
            return res.status(200).json({ message: "could-not-delete" })
        }
    } catch (err) {
        console.error(err);
    }








})
app.post("/deletescraping", async (req, res) => {

    const { scrapingToDelete, ownerAccount } = req.body;

    try {
        // Delete documents from outBoundModel

        let result = await scrapeModel.findOneAndDelete({ ownerAccount: ownerAccount, scrapeName: scrapingToDelete });

        if (result) {
            return res.status(200).json({ message: "scraping-deleted" })
        }
        else {
            return res.status(200).json({ message: "error" })
        }

    } catch (err) {
        console.error("Error deleting documents from emailModel:", err);
    }






})
app.post("/deleteEmail", async (req, res) => {

    const { email, ownerAccount } = req.body;

    try {
        // Delete documents from outBoundModel

        let emailDeleteResult;

        if (email.primaryEmail == true) {
            emailDeleteResult = await emailModel.findOneAndDelete({ ownerAccount: ownerAccount, emailAddress: email.emailAddress });
        }
        else {
            emailDeleteResult = await emailModel.findOneAndDelete({ ownerAccount: ownerAccount, emailAddress: email.emailAddress, parentEmail: email.parentEmail });
        }



        if (emailDeleteResult) {
            return res.status(200).json({ message: "email-deleted" })
        }
        else {
            return res.status(200).json({ message: "email-not-deleted" })
        }

    } catch (err) {
        console.error("Error deleting documents from emailModel:", err);
    }






})



app.use(express.static(path.join(__dirname, "client/build")))
console.log("__dirnames is: " + __dirname)

app.get("*", (req, res) => {
    res.sendFile(
        path.join(__dirname, "client/build/index.html")
    )
})



mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log("Connected to port " + port + " and Database")
        })
    })
    .catch((error) => {
        console.log("Could not connect to DataBase")
    })

//"Could not connect to DataBase"

//TO ADD SCRAPPING JUST INSALL THE PUPPETTER PACKAGE
