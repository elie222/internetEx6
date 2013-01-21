/**
 * Created with JetBrains WebStorm.
 * User: DOM
 * Date: 18/01/13
 * Time: 23:56
 * To change this template use File | Settings | File Templates.
 */
var login = require('./login');
exports.callBack = {call : function(request,response,parameters) {
    if(login.validate(request,response)) {
        /*
        response.sendStaticPage('mail/mail.html',function () {
            response.end('');
        });
        */
        if(request.resource !== '/mail/mail.html') {
            response.status = 303;
            response.headers['Location'] = 'mail.html';
            response.end('');
        }
        else {
            response.sendStaticPage('/mail/mail.html',function () {
                response.end('');
            });
        }

    }
    else {
        /*
        response.sendStaticPage('mail/welcome.html',function () {
            response.end('');
        });
        */
        if(request.resource !== '/mail/welcome.html') {
            response.status = 303;
            response.headers['Location'] = 'welcome.html';
            response.end('');
        }
        else {
            response.sendStaticPage('mail/welcome.html',function () {
                response.end('');
            });
        }

    }
}};