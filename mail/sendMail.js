/**
 * Created with JetBrains WebStorm.
 * User: DOM
 * Date: 18/01/13
 * Time: 17:08
 * To change this template use File | Settings | File Templates.
 */
var mail = require('./include');

exports.callBack = {call: function (request, response, parameters) {
    //console.log(request);
    var emailObj = {
        from: mail.login.validate(request, response),
        to: request.parameters.to,
        subject: request.parameters.subject,
        body: request.parameters.body,
        arrivalDate: ''//TODO
    };
    console.log('emailObj:');
    console.log(emailObj);
    if (request.getPublicMemory().users[emailObj.from]) {
        console.log('Sender exists.');
        request.getPublicMemory().users[emailObj.from].sent.push(emailObj);
        if (request.getPublicMemory().users[emailObj.to]) {
            console.log('Receiver exists.');
            request.getPublicMemory().users[emailObj.to].mails.push(emailObj);
        } else {
            console.log('ERROR sending email. Receiver ' + emailObj.to + ' does not exist.');
        }
    } else {
        console.log('ERROR sending email. Sender ' + emailObj.from + ' does not exist.');
    }
}};