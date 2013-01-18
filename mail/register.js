/**
 * Created with JetBrains WebStorm.
 * User: DOM
 * Date: 18/01/13
 * Time: 17:07
 * To change this template use File | Settings | File Templates.
 */
exports.callBack = {call: function (request, response, parameters) {
    var userObj = {};
    if(!request.parameters['username']) {
        response.status = 200;
        response.end('Username cannot be an empty string!');
    }
    else if(!request.parameters.username.toString().match('^[a-zA-Z0-9]+$')) {
        response.status = 200;
        response.end('The username contains invalid characters');
    }
    else if(!request.parameters.password) {
        response.status = 200;
        response.end('The password cannot be empty!');
    }
    else if(!request.parameters.firstName.toString().match('^[a-zA-Z0-9]+$')) {
        response.status = 200;
        response.end('The First Name contains invalid characters or empty');
    }
    else if(!request.parameters.lastName.toString().match('^[a-zA-Z0-9]+$')) {
        response.status = 200;
        response.end('The Last Name contains invalid characters or empty');
    }
    else if(!request.parameters.age.toString().match('^[0-9]+$')) {
        response.status = 200;
        response.end('The Age must be numeric');
    }
    else if (!request.getPublicMemory().hasOwnProperty('users') ||  !request.getPublicMemory()['users'][request.parameters.username]) {
        if(!request.getPublicMemory().hasOwnProperty('users')) {
            console.log('First user!');
            request.getPublicMemory().users = {};
        }

        userObj = {
            details: {
                username: request.parameters.username,
                password: request.parameters.password,
                firstName: request.parameters.firstName,
                lastName: request.parameters.lastName,
                age: request.parameters.age
            },
            mails: [],
            sent: []
        };

        request.getPublicMemory().users[request.parameters.username] = userObj;
        response.status = 200;
        response.end('OK');
        //console.log('sending static page: /mail/mail.html');
        //response.sendStaticPage('/mail/mail.html', function () {
            //console.log('sending static page: /mail/stylesheet.css');
            //response.sendStaticPage('/mail/stylesheet.css', function () {});
        //});
    } else {
        //console.log('Username already exists.');
        response.status = 200;//TODO should be something else probably
        response.write('Username already exists.');
        response.end();
    }
}};