/**
 * Created with JetBrains WebStorm.
 * User: LEO
 * Date: 20/01/13
 * Time: 20:48
 * To change this template use File | Settings | File Templates.
 */
var login = require('./login');
exports.callBack = { call : function (request,response,parameters) {
    //console.log("here");
    var currentUser = login.validate(request,response);
    if(!currentUser) {
        response.end('FAIL');
    }
    //console.log("here2");
    var mails = request.getPublicMemory().users[currentUser].mails;
    //console.log("here3");
    var requestId = parseInt(request.parameters['id']);
    //console.log('delete mail for: ' + currentUser + ' ' + mails.length + ' ' + requestId);
    if(!request.parameters['id']) {
        response.end('FAIL');
    }
    if(requestId < 0 || requestId >= mails.length) {
        response.end('FAIL');
    }

    mails.splice(requestId,1);
    response.end('OK');
}};