/**
 * Created with JetBrains WebStorm.
 * User: DOM
 * Date: 19/01/13
 * Time: 13:44
 * To change this template use File | Settings | File Templates.
 */
var login = require('./login');

exports.callBack = {call: function (request, response, parameters) {
    var currentUser = login.validate(request,response);
    console.log("currentUser " + currentUser);
    var mails = null;
    var output = "<tr><th style=\"width:30px\">From</th><th style=\"width:100px\">Arrival Date:</th><th style=\"width:200px\">  Subject</th><th style=\"width:50px\">Actions</th></tr>";
    var sender = {};
    var receiver = {};
    if(!currentUser) {
        console.log("here again");
        response.end('FAIL');
    }
    else {
        console.log("here");
        mails = request.getPublicMemory().users[currentUser].mails;


        for(var mail in mails) {
            sender.firstName =  request.getPublicMemory().users[mails[mail].from].details.firstName;
            sender.lastName =  request.getPublicMemory().users[mails[mail].from].details.lastName;
            receiver.firstName =  request.getPublicMemory().users[currentUser].details.firstName;
            receiver.lastName =  request.getPublicMemory().users[currentUser].details.lastName;
            //console.log(request.getPublicMemory().users[mails[mail].from].details.lastName);
            //console.log(mails[mail]);
            output +=
                "<tr>" +
                    "<td>"+sender.firstName+"   "+sender.lastName + "</td>" +
                    //"<td>("+mails[mail].arrivalDate.toUTCString()   +")</td>"+
                    "<td>"+mails[mail].arrivalDate+"</td>" +
                    "<td>"+ mails[mail].subject+"</td>" +
                    "<td>" +
                        "<script type='text/javascript'>window.mails["+mail+"] = {"+
                            "from: '"+sender.firstName+" "+sender.lastName +"'," +
                            "to: '" + receiver.firstName+" "+receiver.lastName +"'," +
                            "arrivalDate: '"+mails[mail].arrivalDate + "'," +
                            "subject: '"+mails[mail].subject + "'," +
                            "body: '"+mails[mail].body + "'" +
                        "};" +
                        "</script>" +
                        "<input type='button' class='button smallButton' value='Read' onclick='readMail("+mail+")'> " +
                        "<input type='button' class='button smallButton' value='Delete' onclick='deleteMail("+mail+")'> " +
                        "<input type='button' class='button smallButton' value='Reply' onclick='replyMail("+mail+")'> " +

                    "</td>" +
                "</tr>";
        }
        response.end(output);
    }
}};

exports.getUsernameCallback = {call: function (request, response, parameters) {
    response.end(login.validate(request,response));
}};

exports.getAllUsersCallback = {call: function (request, response, parameters) {
    var usersToReturn = [];
    var allUsers = Object.keys(request.getPublicMemory().users);
    //console.log('allUsers: ' + allUsers);
    //allUsers.splice(allUsers.indexOf(login.validate(request,response)),1);//FOR REMOVING CURRENTLY LOGGED IN USER FROM THE RETURNED LIST.
    //console.log('allUsers with sender: ' + allUsers);
    //console.log('request.parameters.term: ' + request.parameters.term);
    for (var i=0; i<allUsers.length; ++i) {
        console.log(allUsers[i]);
        if (allUsers[i].indexOf(request.parameters.term)===0) {
            //console.log('TRUE');
            usersToReturn.push(allUsers[i]);
        }
        //console.log('FALSE');
    }
    //console.log('usersToReturn: ' + JSON.stringify(usersToReturn));
    response.end(JSON.stringify(usersToReturn));
}};
