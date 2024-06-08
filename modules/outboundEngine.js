
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { sendTaskCompletionEmail } = require('./emailSender');
const taskModel = require('../models/taskSchema');
const outBoundModel = require('../models/outboundSchema');


async function sendOutbound(sendingEmail, visibleEmail, senderPassword, senderName, subject, body, emailList, nameList, sendingRate, taskName, outboundName, taskGreeting, ownerAccount, taskBodyType, taskType, threadIDs, allocationIndex) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: sendingEmail,
            pass: senderPassword
        }
    });
    async function sendEmail(transporter, mailOptions) {
        let sendingDetails = ""
        try {
            // Use await to wait for the sendMail function to complete
            const info = await transporter.sendMail(mailOptions);
            sendingDetails = info.messageId
            // sendingDetails[1] = info.response
            // sendingDetails[2] = info.accepted
            // sendingDetails[3] = info.rejected
        } catch (error) {
            console.error(error);
        }
        return sendingDetails
    }

    async function updateOutbound(outboundName, messagethreads, allocationIndex) {


        outBoundModel.findOneAndUpdate(
            { outboundName: outboundName },
            {
                $set: {
                    [`emailList.${allocationIndex}.threadIDs`]: messagethreads,
                }
            },
            { new: true }
        )
            .then((updatedOutbound) => {
                console.log("updated outbound for index " + { allocationIndex }, updatedOutbound)
            })
            .catch(err => console.log(err))

    }


    function updateTasks(taskName) {
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

    let index = 0
    let messageIds = []


    async function sending() {

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
                        headers: {
                            inReplyTo: threadIDs[index],
                            references: threadIDs[index]
                        }
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
                        headers: {
                            inReplyTo: threadIDs[index],
                            references: threadIDs[index]
                        }
                    }
                };


            }

            console.log(`Sending to ${reciverEmail} from ${sendingEmail} as ${visibleEmail}`)
            if (taskType !== "newoutbound") {
                console.log(mailOptions.headers)
            }
            let sender = await sendEmail(transporter, mailOptions)
            messageIds.push(sender)


            index++;
            setTimeout(sending, 1000 * sendingRate);
        }
        else {
            if (taskType == "newoutbound") {
                updateOutbound(outboundName, messageIds, allocationIndex)
            }

            updateTasks(taskName)
        }


    }

    sending()



}


module.exports = {
    sendOutbound: sendOutbound
};
