const mongoose = require("mongoose");
const v2emailModel = require("../../v2/models/v2emailSchema");
const v2outBoundModel = require("../../v2/models/v2outboundSchema");
const v2taskModel = require("../../v2/models/v2taskSchema");
const { sendNewOutbound, sendFollowUp } = require("./v2emailEngine");


async function findEmail(emailAddress) {
  try {
    const result = await v2emailModel.findOne({ emailAddress: emailAddress });

    return !!result; // Convert result to boolean (true if result is truthy, false otherwise)
  } catch (error) {
    console.error(error);
    return false; // Return false in case of any error
  }

}
async function findOutbound(outboundname) {
  try {
    const result = await v2outBoundModel.findOne({
      outboundName: outboundname,
    });

    return !!result; // Convert result to boolean (true if result is truthy, false otherwise)
  } catch (error) {
    console.error(error);
    return false; // Return false in case of any error
  }
}

async function getallOutbounds() {
  let result = await v2outBoundModel.find({});
  return result;
}
async function getallemails() {
  let result = await v2emailModel.find({});
  return result;
}

async function addV2Email(body) {
  let result = await findEmail(body.emailAddress);

  if (result == false) {
    let newEmail = await v2emailModel.create({
      emailAddress: body.emailAddress,
      senderName: body.senderName,
      password: body.password,
      host: body.host,
      sendingport: body.sendingport,
      signature: body.signature,
    });
    if (newEmail) {
      return "emailadded";
    } else {
      return "emailnotadded";
    }
  } else {
    return "emailexist";
  }
}

async function addV2outbound(body) {
  let result = await findOutbound(body.outboundname);
  if (result == false) {
    let newOutbound = await v2outBoundModel.create({
      outboundEmail: body.email,
      outboundName: body.outboundname,
      emailList: body.emailList,
      messageIDs:[],
      unSubscriptions:[],
      
      tasks: 0,
    });
    if (newOutbound) {
      return "outboundadded";
    } else {
      return "outboundnotadded";
    }
  } else {
    return "outboundexist";
  }
}

async function UpdateOutboundMessageIDs(outbondname, messageIDs) {
 try {
   const outbound = await v2outBoundModel.findOne({outboundName:outbondname})
    let prevMessageIDs= outbound.messageIDs;
    prevMessageIDs.push(messageIDs);

    console.log("Previous Message IDs",prevMessageIDs)
   
   const updatedOutbound = await v2outBoundModel.findOneAndUpdate(
        { outboundName: outbondname },
        { $set: { messageIDs: prevMessageIDs } },
        { new: true }
      );
    
      if (updatedOutbound) {
        return true;
      } else {
        return false;
      }
 } catch (error) {
    console.log("UPDATE OUTBOUND EMAIL ERROR",error)
    return false

 }
}


async function UpdateOutboundTaskCount(outboundname, action) {
  try {
    const outbound = await v2outBoundModel.findOne({
        outboundName: outboundname,
      });
      let taskcount = 0;
      if (outbound) {
        taskcount = parseInt(outbound.tasks);
      }
    
      action == "plus" ? (taskcount += 1) : (taskcount -= 1);
    
      const updatedOutbound = await v2outBoundModel.findOneAndUpdate(
        { outboundName: outboundname },
        { $set: { tasks: taskcount } },
        { new: true }
      );
    
      if (updatedOutbound) {
        return true;
      } else {
        return false;
      }
  } catch (error) {
    console.log("UPDATE  TASK COUNT ERROR",error)
  }
  
}
async function updateTaskStatus(taskName, outbondname){
    console.log("Updating Status", taskName, outbondname)
    
   try {
    // const updatedTask = await v2taskModel.findOneAndUpdate(
    //     { taskName:taskName },
    //     { $set: { status:'completed' } },
    //     { new: true }
    //   );

      const updatedTask = await v2taskModel.findOneAndUpdate({ taskName: taskName }, { $set: { status: 'completed' } }, { new: true })
    
      if (updatedTask) {
        return true;
      } else {
        return false;
      }
   } catch (error) {
    console.log("UPDATING TASK STATUS ERROR", error)
   }
}



async function taskAction(taskData) {
 
 console.log(taskData.outboundName)
 if (taskData.taskType == "newoutbound") {

  console.log("new outbound:", taskData.outboundName)
   console.log(taskData)
  console.log("STARTING NEWOUTBOUND",taskData.taskType)
  const newmessageIDs = await sendNewOutbound(taskData);
   console.log(newmessageIDs);

   let result = await UpdateOutboundMessageIDs(taskData.outboundName, newmessageIDs)
  if (result){
    updateTaskStatus(taskData.taskname,taskData.outboundName)
  }
}
 


 if (taskData.taskType == "followup") {

  console.log("FOLLOW UP:", taskData.outboundName)
  const outbound = await v2outBoundModel.findOne({outboundName: taskData.outboundName});
 const initialMessageIDs= outbound.messageIDs[0]
 taskData.messageIDs = initialMessageIDs

  // console.log(taskData)

  const newmessageIDs = await sendFollowUp(taskData);
   console.log("THE NEW FOLLOW UP IS:",newmessageIDs);

   let result = await UpdateOutboundMessageIDs(taskData.outboundName, newmessageIDs)
  if (result){
    updateTaskStatus(taskData.taskname,taskData.outboundName)
  }
}

     
  





}






async function saveTask(params) {
  try {
    console.log(params)

    const {outboundName,taskname, date,time, taskType, subject, newbody, status }= params
    
    let newtask= await v2taskModel.create({
    outboundName: outboundName,
    taskName: taskname,
    taskDate: date,
    taskTime: time,
    taskSubject: subject,
    taskBody: newbody,
    taskType: taskType,
    status:status
    })

    if (newtask){
        await UpdateOutboundTaskCount(outboundName, "plus")
        .then((result)=>{
            console.log("COUNT UPDATED",result);

        })
        .catch(error=>console.log(error))
      
    }


  } catch (error) {
    console.log(error);
    return false
  }
}


async function unsubscribeEmail(outboundName,emailAddress, reason){

    let outbound= await v2outBoundModel.find({outboundName})

    if (outbound){
     // console.log(outbound)
      let emailList= outbound[0].emailList
      let messageIDs= outbound[0].messageIDs
      let unSubscriptions = outbound[0].unSubscriptions


      let emailIndex=-1;
      for (let i =0; i<emailList.length; i++){
        if (emailList[i]==emailAddress){emailIndex = i}
      }

      if (emailIndex==-1){
        return("emaildoesnotexit")
      }

      let newEmailList= emailList.filter((_, index) => index !== emailIndex);


      let newmessageIDs=[]
      for (let i=0; i<messageIDs.length; i++){
          newmessageIDs.push(messageIDs[i].filter((_, index) => index !== emailIndex))
      }

      unSubscriptions.push({email:emailAddress, reason:reason })


      const updatedOutbound = await v2outBoundModel.findOneAndUpdate(
        { outboundName: outboundName },
        { $set: {emailList: newEmailList, messageIDs:newmessageIDs, unSubscriptions:unSubscriptions  } },
        { new: true }
      );

      if (updatedOutbound){
        console.log(newEmailList)
        console.log(newmessageIDs)
        console.log(unSubscriptions)
        return "deleted"
      }

      else{
        return "error"
      }
     
      
     


      

    }



}

async function deleteTask(outboundName, taskName, index){
   try {
    const task= await v2taskModel.findOne({outboundName, taskName});
    // console.log(task)

    if (task&&task.status =='completed'){
      const outbound = await v2outBoundModel.findOne({outboundName})
      if (outbound){
        let previousmessageIDs = outbound.messageIDs
        let newmessageIDs = previousmessageIDs.filter((_, arrayIndex) => arrayIndex !== index);

        const updatedOutbound = await v2outBoundModel.findOneAndUpdate(
          { outboundName: outboundName },
          { $set: { messageIDs: newmessageIDs } },
          { new: true }
        ); 
      }
    }


    const deletedTask = await v2taskModel.findOneAndDelete({ outboundName: outboundName, taskName: taskName });

   if (deleteTask){
      let result = await UpdateOutboundTaskCount(outboundName, "minus")
          if (result){
            return true;
          }
          else{
            return false
          }
   }
   else{
    return false
   }
   } catch (error) {
    console.log(error)
    return false
   }
}

module.exports = {
  findEmail,
  findOutbound,
  addV2Email,
  getallemails,
  getallOutbounds,
  addV2outbound,
  taskAction,
  saveTask,
  unsubscribeEmail,
  deleteTask,
  
};
