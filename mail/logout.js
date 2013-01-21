/**
 * Created with JetBrains WebStorm.
 * User: LEO
 * Date: 21/01/13
 * Time: 22:43
 * To change this template use File | Settings | File Templates.
 */
exports.callBack = { call : function (request, response) {
    var currentSession = request.getSession();
    currentSession['mailUser'] = null;
    response.status = 303;
    response.headers['Location'] = 'welcome.html';
    response.end('');
}};