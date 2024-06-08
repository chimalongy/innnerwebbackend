
const nodemailer = require('nodemailer')
const cron = require('node-cron')
const { sendTaskCompletionEmail } = require('../emailSender')

const taskModel = require('../../models/taskSchema');

function stopCronJob(taskName) {
    if (global.cronJobs[taskName]) {
        global.cronJobs[taskName].stop();
        console.log(`Cron job for ${taskName} has been stopped.`);
        console.log("current jobs =" + cronJobs)
    } else {
        console.log(`No cron job found for ${taskName}.`);
    }
}



async function sendOutbound(sendingEmail, visibleEmail, senderPassword, senderName, subject, body, emailList, nameList, sendingRate, taskName, outboundName, taskGreeting, ownerAccount, taskBodyType) {

    // console.log("the sendingEmail:" +sendingEmail)
    // console.log("the visiblegEmail:" +visibleEmail)
    // console.log("the senderPassword:" +senderPassword)
    // console.log("the senderName:" + senderName)
    // console.log("the Subject:" +subject)
    // console.log("the body:" +body)
    // console.log("the emaillist:" +emailList)
    // console.log("the namelist:" +nameList)
    // console.log("the sending rate:" +sendingRate)
    // console.log("the taskname:" + taskName)
    // console.log("the outboundname:" +outboundName)
    // console.log("the taskgreetings:" +taskGreeting)
    // console.log("the ownerAccount:" +ownerAccount)


    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: sendingEmail,
            pass: senderPassword
        }
    })




    let index = 0;
    let cronSchedule = `*/${sendingRate} * * * * *`;
    console.log(sendingRate)
    const sending = cron.schedule(cronSchedule, () => {


        if (index <= emailList.length) {
            const recieverName = nameList[index]
            const reciverEmail = emailList[index]
            // if( recieverName==null){recieverName=""}

            let emailContent; 
            let mailOptions;

            if (taskBodyType == 'text') {
                emailContent = `${taskGreeting}${recieverName == null || recieverName == "" ? "" : " " + recieverName},\n\n${body}`
                mailOptions = {
                    from: `"${senderName}" <${visibleEmail}>`,
                    to: reciverEmail,
                    subject: subject,
                    text: emailContent
                };
            }
            else {
                emailContent = `<p>${taskGreeting}${recieverName == null || recieverName == "" ? "" : " " + recieverName},</p>${body}`
                mailOptions = {
                    from: `"${senderName}" <${visibleEmail}>`,
                    to: reciverEmail,
                    subject: subject,
                    html: emailContent
                };
            }

            console.log("sendingFrom: " + sendingEmail + " as " + visibleEmail + " to " + reciverEmail)
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(`failed to send + from ${sendingEmail}+ with ${senderPassword} to ${reciverEmail}`);
                    console.log(error);
                } else {
                    console.log("email sent");
                }
            });
            index = index + 1;
        }
        else {
            //  stopSending()
            console.log("finished")
            sending.stop
        }


    }, { scheduled: false })

    sending.start()

    let requiredTime = (emailList.length * sendingRate) + 1;
    let timerTime = requiredTime * 1000
    setTimeout(() => {
        console.log("terminating TasK")

        sending.stop()

        taskModel.findOneAndUpdate({ taskName: taskName }, { $set: { status: 'completed' } }, { new: true })
            .then((updatedDocument) => {
                if (updatedDocument) {
                    sendTaskCompletionEmail(ownerAccount, sendingEmail, visibleEmail, outboundName, taskName)
                } else {
                    console.log('No document found for the given taskName');
                }
            })
            .catch(err => {
                console.error('Error updating document:', err);
            });


        stopCronJob(taskName)

    }, timerTime)





}

module.exports = {
    sendOutbound: sendOutbound
};