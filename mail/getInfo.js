var login = require('./login');

exports.getUsernameCallback = {call: function (request, response, parameters) {
    response.end(login.validate(request,response));
}};

exports.getAllUsersCallback = {call: function (request, response, parameters) {
    var usersToReturn = [];
    var allUsers = Object.keys(request.getPublicMemory().users);
    //console.log('allUsers: ' + allUsers);
    //allUsers.splice(allUsers.indexOf(login.validate(request,response)),1);//FOR REMOVING CURRENTLY LOGGED IN USER FROM THE RETURNED LIST.
    //console.log('allUsers with sender: ' + allUsers);
    //console.log('request.parameters.term: ' + request.parameters.term);
    for (var i=0; i<allUsers.length; ++i) {
        console.log(allUsers[i]);
        if (allUsers[i].indexOf(request.parameters.term)===0) {
            //console.log('TRUE');
            usersToReturn.push(allUsers[i]);
        }
        //console.log('FALSE');
    }
    //console.log('usersToReturn: ' + JSON.stringify(usersToReturn));
    if (usersToReturn.length===0) {
        usersToReturn.push('No user begins that starts with those letters.');
    }
    response.end(JSON.stringify(usersToReturn));
}};