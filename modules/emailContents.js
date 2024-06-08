const outBoundModel = require("../models/outboundSchema");
const style =
    `<style>
body {
    font-family: Arial, sans-serif;
    background-color: #f5f5f5;
}
.container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #ffffff;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
h3 {
    color: #333;
}
p {
    color: #555;
}
.verification-code {
    font-size: 24px;
    font-weight: bold;
    color: #007bff;
}
</style>`

function regCodeEmailContent(recieverName, code) {
    const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Email Verification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f5f5f5;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            h3 {
                color: #333;
            }
            p {
                color: #555;
            }
            .verification-code {
                font-size: 24px;
                font-weight: bold;
                color: #007bff;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h3>Hi, ${recieverName} Welcome to Lets Outbound</h3>
            <p>Thank you for registering with us!<br/> To complete your registration and start exploring our services, please verify your email address by entering the following verification code:</p>
            <p class="verification-code">${code}</p>
            <p>If you did not create an account on our platform, please ignore this email.</p>
            <p>Best regards,<br>Let's Outbound Team</p>
        </div>
    </body>
    </html>
`;
    return emailContent;
}

function outboundEmailNotFoundContent(outbondName, taskName, senderEmail) {
    const emailContent = `
    Hi,
    You may have deleted the sender email address [${senderEmail}] required to perform a task [${taskName}] of outbound [${outbondName}].

    We cannot process sending from this address at the moment.
    `
    return emailContent
}

function outboundEmailDataNotFound(outbondName, taskName) {
    const emailContent = `
  Hi, 
  You may have deleted the contents email required to send perfom task [${taskName}] for outbound [${outbondName}]. <br/>
  We could not find the email required to perfom the task.<br>
  `
    return emailContent
}

function TaskCompletionEmail(outboundName, taskName, sendingEmail, visibleEmail) {
    const emailContent =
        `Hello,

We're pleased to confirm that the task [${taskName}] you assigned to outbound [${outboundName}] has been successfully completed through ${sendingEmail} sending as ${visibleEmail}.
    
If you have any questions or require further information, please don't hesitate to contact us. We're here to help.
    
Best regards,
LetsOutbound Team
  `
    return emailContent
} 

function UpdatePasswordCodeContent(code) {
    const emailContent =
        `<!DOCTYPE html>
    <html>
    <head>
        <title>Update Password</title>
        ${style}
    </head>
    <body>
        <div class="container">
            <h3>Hi</h3>
            <p>To change your password, use this code:</p>
            <p class="verification-code">${code}</p>
            <p>If you did not request for this, please give us a quick reply.</p>
            <p>Best regards,<br>Crypto Black Market Team</p>
        </div>
    </body>
    </html>`;
    return emailContent;
}
function passwordUpdateConfirmation(recieverName) {
    const emailContent =
        `<!DOCTYPE html>
    <html>
    <head>
        <title>Welcome Onboard</title>
        ${style}
    </head>
    <body>
        <div class="container">
            <h3>Hi, ${recieverName} Password Changed</h3>
            <p>Your password was changed.</p>
            <p>If you did not create an account on our platform, please ignore this email.</p>
            <p>Best regards,<br>Crypto Black Market Team</p>
        </div>
    </body>
    </html>`;
    return emailContent;
}


module.exports = {
    regCodeEmailContent,
    outboundEmailNotFoundContent,
    outboundEmailDataNotFound,
    TaskCompletionEmail,
    UpdatePasswordCodeContent,
    passwordUpdateConfirmation
}
