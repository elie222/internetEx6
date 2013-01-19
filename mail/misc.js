/**
 * Created with JetBrains WebStorm.
 * User: DOM
 * Date: 19/01/13
 * Time: 15:29
 * To change this template use File | Settings | File Templates.
 */
/*This method validates the user in two ways:
1. by recognizing sessionId
2. cookie (for minimizing chances for session theft)
 */
exports.validateUser = function (request,response,parameters) {
    var currentSession = request.getSession();
    var loginCookie = request.getCookies()['login'];
    var passCookie = request.getCookies()['passHash'];

    if(!currentSession || !loginCookie || !passCookie) return null;
    if(!request.getPublicMemory().users || !request.getPublicMemory().users[loginCookie]) return null;
    if(passCookie !== request.getPublicMemory().users[loginCookie].password) return null;
    if(currentSession !== request.getPublicMemory().users[loginCookie].lastLoginSession) return null;

    return currentSession;



};
