/**
 * Created with JetBrains WebStorm.
 * User: DOM
 * Date: 18/01/13
 * Time: 23:56
 * To change this template use File | Settings | File Templates.
 */
exports.callBack = {call : function(request,response,parameters) {
    // TODO: here is the place to validate the session
    response.sendStaticPage('mail/mail.html',function () {
       response.end('');
    });
    console.log("displaying gui...");
}};