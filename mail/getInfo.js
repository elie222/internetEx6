var login = require('./login');

exports.getUsernameCallback = {call: function (request, response, parameters) {
    response.end(login.validate(request,response));
}};

exports.getAllUsersCallback = {call: function (request, response, parameters) {
    var usersToReturn = [];
    var allUsers = Object.keys(request.getPublicMemory().users);

    for (var i=0; i<allUsers.length; ++i) {
        console.log(allUsers[i]);
        if (allUsers[i].indexOf(request.parameters.term)===0) {
            usersToReturn.push(allUsers[i]);
        }
    }

    if (usersToReturn.length===0) {
        usersToReturn.push('No user begins that starts with those letters.');
    }
    response.end(JSON.stringify(usersToReturn));
}};