/**
 * Created with JetBrains WebStorm.
 * User: DOM
 * Date: 18/01/13
 * Time: 17:07
 * To change this template use File | Settings | File Templates.
 */
exports.callBack = {call: function (request, response, parameters) {

    //console.log(request.getPublicMemory());
    //console.log(request);
    //console.log(response);
    //console.log(parameters);
    console.log(request.parameters.username);
    console.log(request.parameters.password);

    if(request.getPublicMemory().hasOwnProperty('users') &&
            request.getPublicMemory().users[request.parameters.username] &&
            request.getPublicMemory().users[request.parameters.username].details.password === request.parameters.password) {
                //console.log('login succuessful. sending static page: /mail/mail.html');
               // response.sendStaticPage('/mail/mail.html', function () {
                  //  console.log('sending static page: /mail/stylesheet.css');
                    //response.sendStaticPage('/mail/stylesheet.css', function () {});
                //});
                response.status = 200;
                response.end("OK");
    } else {
        invalidUsernameOrPassword();
    }



    function invalidUsernameOrPassword () {
        //console.log('Invalid username or password. Sending STATUS 401.1');
        //response.status = 401.1;//TODO don't think this actually works though. automatically changes to 200 I think
        response.status = 200;
        response.end('Wrong Username or password!');
    }
}};

