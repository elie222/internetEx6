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
    console.log("currentUser: " + currentUser);
    console.log('box: ' +parameters['box'] );
    var box = (parameters['box'] === 'inbox') ? 'mails' : 'sent';
   // console.log("In mailList.js. CurrentUser: " + currentUser);
    var mails = null;
    var output = "<tr><th style=\"width:30px\">"+((box === 'mails')?('From'):('To'))+"</th><th style=\"width:100px\">Arrival Date:</th><th style=\"width:200px\">  Subject</th><th style=\"width:50px\">Actions</th></tr>";
    var sender = {};
    var receiver = {};
    var firstRow = (box === 'mails') ? sender : receiver;

    if(!currentUser) {
        //console.log("here again");
        //console.log("here again");
        response.end('FAIL');
    }
    else {
        console.log("here");
       // mails = request.getPublicMemory().users[currentUser].mails;
        //console.log("currentUser mails: "+JSON.stringify(request.getPublicMemory().users[currentUser]));
        //console.log("here");
        mails = request.getPublicMemory().users[currentUser][box];

        mails.sort(function(a,b) {
            return b.arrivalDate - a.arrivalDate;
        });
        console.log("here2");
        //console.log(JSON.stringify(mails));
        //console.log("after sort" + mails[0].from);
        for(var mail in mails) {
            //console.log('mails[mail]: ' + JSON.stringify(mails[mail]));
            //console.log('request.getPublicMemory().users[mails[mail].from]: ' + JSON.stringify(request.getPublicMemory().users[mails[mail].from]));
            sender.username = request.getPublicMemory().users[mails[mail].from].details.username;
            sender.firstName = request.getPublicMemory().users[mails[mail].from].details.firstName;
            sender.lastName = request.getPublicMemory().users[mails[mail].from].details.lastName;
           // console.log('request.getPublicMemory().users[mails[mail].to]: ' + JSON.stringify(request.getPublicMemory().users[mails[mail].to]));
            receiver.firstName = request.getPublicMemory().users[mails[mail].to].details.firstName;
            receiver.lastName = request.getPublicMemory().users[mails[mail].to].details.lastName;
            //console.log(request.getPublicMemory().users[mails[mail].from].details.lastName);
            //console.log(mails[mail].subject);

            output +=
                "<tr>" +
                    "<td><div class='listField'></div>"+firstRow.firstName+"   "+firstRow.lastName + "</div></td>" +
                    "<td>"+mails[mail].arrivalDate.toLocaleString()+"</td>" +
                    "<td><div class='listField'> "+ mails[mail].subject+"</div></td>" +
                    "<td>" +
                        "<script type='text/javascript'>window.mails["+mail+"] = {"+
                            "fromUsername: '" + sender.username + "'," +
                            "from: '" + sender.firstName+" " + sender.lastName + "'," +
                            "to: '" + receiver.firstName+" " + receiver.lastName +"'," +
                            "arrivalDate: '" + mails[mail].arrivalDate.toLocaleString() + "'," +
                            "subject: '" + mails[mail].subject + "'," +
                            "body: '" + mails[mail].body + "'" +
                        "};" +
                        "</script>" +
                        "<input type='button' class='button smallButton' value='Read' onclick='readMail("+mail+")'> " +
                       ( (box === 'mails') ? ("<input type='button' class='button smallButton' value='Delete' onclick='deleteMail("+mail+")'> "):("") )+
                        ((box === 'mails') ? ("<input type='button' class='button smallButton' value='Reply' onclick='replyMail("+mail+")'> ") : ("") )+
                    "</td>" +
                "</tr>";
            //console.log(output);
        }
        response.end(output);
    }
}};
