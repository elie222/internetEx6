/**
 * Created with JetBrains WebStorm.
 * User: DOM
 * Date: 18/01/13
 * Time: 17:07
 * To change this template use File | Settings | File Templates.
 */
var login = require('./login');
var crypto = require('crypto');
var settings = require('./settings');

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
    else if(request.parameters.username.toString().length > settings.MAX_USER_NAME) {
        response.status = 200;
        response.end('Username is too long!');
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
    else if(request.parameters.firstName.toString().length +  request.parameters.lastName.toString().length > settings.MAX_FULL_NAME) {
        response.status = 200;
        response.end('Sorry, your full name is too long!!');
    }
    else if(!request.parameters.age.toString().match('^[0-9]+$')) {
        response.status = 200;
        response.end('The Age must be numeric');
    }
    else if (!request.getPublicMemory().hasOwnProperty('users') ||  !request.getPublicMemory()['users'][request.parameters.username]) {
        if(!request.getPublicMemory().hasOwnProperty('users')) {

            request.getPublicMemory().users = {

            };
        }

        userObj = {
            details: {
                username: request.parameters.username,
                password: crypto.createHash('sha1').update(request.parameters.password).digest('hex'),
                firstName: request.parameters.firstName,
                lastName: request.parameters.lastName,
                age: request.parameters.age
            },
            //mails: [ {from:'testUser', to:'admin', arrivalDate:new Date(), subject:'hello' , body: 'This is a test message'}],
            mails: [],
            sent: []
        };


        request.getPublicMemory().users[request.parameters.username] = userObj;
        login.success(request,response,request.parameters.username);

    }
    else {
        //console.log('Username already exists.');
        response.status = 200;//TODO should be something else probably
        response.write('Username already exists.');
        response.end();
    }
}};