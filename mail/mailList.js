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
            //console.log(request.getPublicMemory().users[mails[mail].from].details.lastName);
            console.log(mails[mail]);
            output +=
                "<tr>" +
                    "<td>"+sender.firstName+"   "+sender.lastName + "</td>" +
                    //"<td>("+mails[mail].arrivalDate.toUTCString()   +")</td>"+
                    "<td>TODO: UTC TIME</td>" +
                    "<td>"+ mails[mail].subject+"</td>" +
                    "<td>TODO: delete button, reply button, show email button</td>" +
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
    allUsers.splice(allUsers.indexOf(login.validate(request,response)),1);
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
