/**
 * Created with JetBrains WebStorm.
 * User: DOM
 * Date: 18/01/13
 * Time: 17:08
 * To change this template use File | Settings | File Templates.
 */
var mail = require('./include');

function XSSDefence(str) {
    //console.log('XSSDefence');
    // str = str.replace(/\</g,"lt;")   //for <
    // str = str.replace(/\>/g,"gt;")   //for >
    return str;
}

exports.callBack = {call: function (request, response, parameters) {
    console.log(request);
    console.log('SENDMAIL CALLBACK');
    var emailObj = {
        from: mail.login.validate(request, response),
        to: XSSDefence(request.parameters.to),
        subject: XSSDefence(request.parameters.subject),
        body: XSSDefence(request.parameters.body),
        arrivalDate: new Date()
    };
    //console.log('Sending emailObj:');
    //console.log(emailObj);
    if (request.getPublicMemory().users[emailObj.from]) {
        //console.log('Sender exists.');
        request.getPublicMemory().users[emailObj.from].sent.push(emailObj);
        if (request.getPublicMemory().users[emailObj.to]) {
            //console.log('Receiver exists.');
            request.getPublicMemory().users[emailObj.to].mails.push(emailObj);
            response.status = 200;//TODO don't think this actually works though. automatically changes to 200 I think
            response.end('Email sent. TODO change this.');
            return;
        } else {
            console.log('ERROR sending email. Receiver ' + emailObj.to + ' does not exist.');
        }
    } else {
        console.log('ERROR sending email. Sender ' + emailObj.from + ' does not exist.');
    }
    response.status = 500;//TODO don't think this actually works though. automatically changes to 200 I think
    response.end('Sender or receiver does not exist.');
}};