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
    var output = '';
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
            output += "<tr>" +
                "<td>"+sender.firstName+"   "+sender.lastName + "</td>" +
                "<td>("+mails[mail].arrivalDate.toUTCString()   +")</td>"+
                "<td>"+ mails[mail].subject+"</td>" +
                "<td>TODO: deletebutton</td>" +
                "</tr>";
        }
        response.end(output);
    }
}};

exports.getUsernameCallback = {call: function (request, response, parameters) {
    response.end(login.validate(request,response));
}};
