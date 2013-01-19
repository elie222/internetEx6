/**
 * Created with JetBrains WebStorm.
 * User: DOM
 * Date: 18/01/13
 * Time: 17:08
 * To change this template use File | Settings | File Templates.
 */
exports.callBack = {call: function (request, response, parameters) {
    //console.log(request);
    var emailObj = {
        from: '',//TODO
        to: request.parameters.to,
        subject: request.parameters.subject,
        body: request.parameters.body,
        arrivalDate: ''//TODO
    };
    //console.log(emailObj);
    if (request.getPublicMemory().users[request.parameters.from]) {
        console.log('Sender exists.');
        request.getPublicMemory().users[request.parameters.from].sent.push(emailObj);
        if (request.getPublicMemory().users[request.parameters.to]) {
            console.log('Receiver exists.');
            request.getPublicMemory().users[request.parameters.to].mails.push(emailObj);
        } else {
            console.log('ERROR sending email. Receiver ' + request.parameters.to + ' does not exist.');
        }
    } else {
        console.log('ERROR sending email. Sender ' + request.parameters.from + ' does not exist.');
    }
}};