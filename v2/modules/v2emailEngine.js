const nodemailer = require("nodemailer");
const cron = require("node-cron");

function generateBody(outboundName, taskBody, unsubscribeLink) {
  const emailBody = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        .container {
          width: 90%;
          max-width: 500px;
          margin: 0 auto;
          background-color: #e3f3e3;
          padding: 10px;
          padding-top:20px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 10px 20px;
          text-align: center;
          font-weight:bold;
          width:80%;
          margin: 0 auto;
          border-radius:10px;
        }
        .content {
          padding: 10px;
        }
        .footer {
          background-color: #275929;
          color: #e3f3e3;
          padding: 10px 20px;
          text-align: center;
          font-size: 10px;
          border-radius:20px;
          margin: 0 auto;
          margin-top: 20px;
        }
        .footer a {
          color: #419544;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
         <p>${outboundName}</p>
        </div>
        <div class="content">
          ${taskBody}
        </div>
        <div class="footer">
        <p>We believe this domain could greatly benefit your business. If you're not interested, you can <a href="${unsubscribeLink}" target="_blank" rel="noopener noreferrer">unsubscribe here</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return emailBody;
} 
  
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}  

async function sendNewOutbound(taskData) {
  console.log("NOW SENDING")
  const transporter = nodemailer.createTransport({
    host: taskData.host,
    port: taskData.port, // or 587 for STARTTLS
    secure: true, // true for 465, false for 587
    auth: {
      user: taskData.senderEmail, // your email
      pass: taskData.senderEmailPasword, // your email password
    },
  });

  

  
  let messageIDs = [];
  for (let i = 0; i < taskData.emailList.length; i++) {



    const unsubscribeLink = `http://localhost:5173/outboundunsub?email=${taskData.emailList[i]}&outboundname=${taskData.outboundName}`;
    let emailBody = generateBody(taskData.outboundName, taskData.taskBody, unsubscribeLink);
    
    console.log("sending to " + taskData.emailList[i]);

    const mailOptions = {
      from: `${taskData.senderName} <${taskData.senderEmail}>`,
      to: taskData.emailList[i],
      subject: taskData.taskSubject, // Email subject
      html: emailBody,
    };

    // Send email
    try {
      let info = await transporter.sendMail(mailOptions);
      console.log("Email sent: " + info.response);

      // Store the Message-ID for follow-up emails
      messageIDs.push(info.messageId);
    } catch (error) {
      console.log(error);
    }

    // Wait for 5 seconds
    await sleep(5000);
  }

  return messageIDs;
}

async function sendFollowUp(taskData) {
 // console.log("ENGIN SIDE",taskData)
  const transporter = nodemailer.createTransport({
    host: taskData.host,
    port: taskData.port, // or 587 for STARTTLS
    secure: true, // true for 465, false for 587
    auth: {
      user: taskData.senderEmail, // your email
      pass: taskData.senderEmailPasword, // your email password
    },
  });

  
   let newMessageIDs=[];
  for (let i = 0; i < taskData.emailList.length; i++) {
    
    const unsubscribeLink = `http://localhost:5173/outboundunsub?email=${taskData.emailList[i]}`;
    let emailBody = generateBody(taskData.outboundName, taskData.taskBody, unsubscribeLink);

    const mailOptions = {
      from: `${taskData.senderName} <${taskData.senderEmail}>`,
      to: taskData.emailList[i],
      subject: taskData.taskSubject, // Email subject
      html: emailBody,
      inReplyTo: taskData.messageIDs[i],
      references: [`${taskData.messageIDs[i]}`]
    };

   
    try {
      let info = await transporter.sendMail(mailOptions);
      console.log("Follow-up email sent: " + info.response);

      newMessageIDs.push(info.messageId);
    } catch (error) {
      console.log(error);
    }

    // Wait for 5 seconds
    await sleep(5000);
  }
  return newMessageIDs;
}

async function sendReply(replyData) {
  const transporter = nodemailer.createTransport({
    host: replyData.host,
    port: replyData.port, // or 587 for STARTTLS
    secure: true, // true for 465, false for 587
    auth: {
      user: replyData.senderEmail, // your email
      pass: replyData.password, // your email password
    },
  });

  let emailBody = generateBody(replyData.outboundName, replyData.newbody);
  console.log(replyData);

  const mailOptions = {
    from: `${replyData.senderName} <${replyData.senderEmail}>`,
    to: replyData.recieverEmail,
    subject: replyData.subject, // Email subject
    html: emailBody,
    inReplyTo: replyData.inReplyTo,
    references: [replyData.references],
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Reply email sent: " + info.response);
    return true
  } catch (error) {
    return false
  }

  
}

module.exports = {
  sendNewOutbound,
  sendFollowUp,
  sendReply,
};
