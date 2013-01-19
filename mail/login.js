/**
 * Created with JetBrains WebStorm.
 * User: DOM
 * Date: 18/01/13
 * Time: 17:07
 * To change this template use File | Settings | File Templates.
 */
var crypto = require('crypto');
exports.callBack = {call: function (request, response, parameters) {

    //console.log(request.getPublicMemory());
    //console.log(request);
    //console.log(response);
    //console.log(parameters);
    console.log(request.parameters.username);
    console.log(request.parameters.password);

    var hash = crypto.createHash('sha1');
    hash.update(request.parameters.password);
    var passHash = hash.digest('hex');


    if(request.getPublicMemory().hasOwnProperty('users') &&
            request.getPublicMemory().users[request.parameters.username] &&
            request.getPublicMemory().users[request.parameters.username].details.password === passHash) {
            success(request,response,request.parameters.username);
    }
    else {
        invalidUsernameOrPassword();
    }



    function invalidUsernameOrPassword () {
        response.status = 200;
        response.end('Wrong Username or password!');
    }


}};

function success(request, response, username) {

    request.getSession().mailUser = username;

    response.status = 200;
    response.end("OK");
}

function validate(request,response) {
    var currentSession = request.getSession();

    if(!currentSession['mailUser']) return null;
    if(!request.getPublicMemory().users) return null;
    if(!request.getPublicMemory().users[currentSession['mailUser']]) return null;

    return currentSession['mailUser'];
}

exports.success = success;
exports.validate = validate;