
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { sendTaskCompletionEmail } = require('../emailSender');
const taskModel = require('../../models/taskSchema');
const outBoundModel = require('../../models/outboundSchema');

function stopCronJob(taskName) {
    if (global.cronJobs[taskName]) {
        global.cronJobs[taskName].stop();
        console.log(`Cron job for ${taskName} has been stopped.`);
        console.log("current jobs =" + cronJobs);
    } else {
        console.log(`No cron job found for ${taskName}.`);
    }
}

async function updateOutbound(outboundName, messagethreads, allocationIndex) {
    const outbound = await outBoundModel.findOne({ outboundName: outboundName })
    let newEmailList = []
    if (outbound) {

        oldEmailList = outbound.emailList
        oldEmailList[allocationIndex].threadIDs = messagethreads
        newEmailList = oldEmailList
    }

    /// saving threads
    try {
        const updatedOutbound = await outBoundModel.findOneAndUpdate(
            { outboundName: outboundName },
            { $set: { emailList: newEmailList } },
            { new: true })
        if (updatedOutbound) {
            console.log(`Threads for  ${allocationIndex} Updated!!!`)
        }
    }
    catch (error) {
        console('Error updating document:', error);
    }
}
async function updateTasks(taskName) {
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

}

async function sendEmail(transporter, mailOptions) {
    let 
    try {
        // Use await to wait for the sendMail function to complete
        const info = await transporter.sendMail(mailOptions);
        
        // Log information about the sent email
        console.log('Email sent:');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        console.log('Accepted:', info.accepted);
        console.log('Rejected:', info.rejected);
        console.log('Pending:', info.pending);
      } catch (error) {
        console.error(error);
      }
}

async function sendOutbound(sendingEmail, visibleEmail, senderPassword, senderName, subject, body, emailList, nameList, sendingRate, taskName, outboundName, taskGreeting, ownerAccount, taskBodyType, taskType, threadIDs, allocationIndex) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: sendingEmail,
            pass: senderPassword
        }
    });

    let index = 0;
    let cronSchedule = `*/${sendingRate} * * * * *`;
    let sendinginfo = [];
    console.log("The allocated index is : " + allocationIndex)
    const sending = cron.schedule(cronSchedule, async () => {
        if (index < emailList.length) {
            const recieverName = nameList[index];
            const reciverEmail = emailList[index];

            let emailContent;
            let mailOptions = {}

            if (taskBodyType == 'text') {
                emailContent = `${taskGreeting}${recieverName == null || recieverName == "" ? "" : " " + recieverName},\n\n${body}`;

                if (taskType == "newoutbound") {
                    mailOptions = {
                        from: `"${senderName}" <${visibleEmail}>`,
                        to: reciverEmail,
                        subject: subject,
                        text: emailContent,
                    };
                }
                else {
                    mailOptions = {
                        from: `"${senderName}" <${visibleEmail}>`,
                        to: reciverEmail,
                        subject: subject,
                        text: emailContent,
                        inReplyTo: threadIDs[index],
                        references: threadIDs[index]
                    }
                };
            } else {
                emailContent = `<p>${taskGreeting}${recieverName == null || recieverName == "" ? "" : " " + recieverName},</p>${body}`;
                if (taskType == "newoutbound") {
                    mailOptions = {
                        from: `"${senderName}" <${visibleEmail}>`,
                        to: reciverEmail,
                        subject: subject,
                        html: emailContent,
                    };
                }
                else {
                    mailOptions = {
                        from: `"${senderName}" <${visibleEmail}>`,
                        to: reciverEmail,
                        subject: subject,
                        html: emailContent,
                        inReplyTo: threadIDs[index],
                        references: threadIDs[index]
                    }
                };


            }



            console.log(`Sending from: ${sendingEmail} as ${visibleEmail} to ${reciverEmail}`);

            try {
                const messageId = await sendMailWithPromise(transporter, mailOptions);
                sendinginfo[index] = reciverEmail;
                sendinginfo[index] = messageId;
            } catch (error) {
                console.log(`Failed to send email to ${reciverEmail}: ${error}`);
            }

            index++;
        } else {
            console.log("Finished sending emails");
            sending.stop();
        }
    }, { scheduled: false });

    sending.start();

    let requiredTime = (emailList.length * sendingRate) + 3;
    let timerTime = requiredTime * 1000;

    setTimeout(async () => {
        console.log("Terminating Task");
        sending.stop();

        updateOutbound(outboundName, sendinginfo, allocationIndex)

        stopCronJob(taskName);

    }, timerTime);
}

module.exports = {
    sendOutbound: sendOutbound
};
