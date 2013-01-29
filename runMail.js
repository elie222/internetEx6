/**
 * Created with JetBrains WebStorm.
 * User: LEO
 * Date: 16/01/13
 * Time: 22:34
 * To change this template use File | Settings | File Templates.
 */

/* TODO (tests)
1. fix a bug where two users can be logged-on as one from the same session
2. protect against session theft
3. fix bug with partial page refresh


 */


var myHttp = require("./myHttp");
var mail = require('./mail/include');



var rootFolder = 'C:\\Users\\LEO\\Documents\\HUJI\\Internet Technologies\\hw6\\internetEx6\\www';
//var rootFolder = '/Users/Elie2/WebstormProjects/internetEx6/www';
//var rootFolder ='D:\\Leonid\\internet\\hw6\\internetEx6\\www';


var port = 8888;
var resourceMap = {
    '/': 'mail/welcome.html'
};

var loginCallbackObj = {call: function (request, response, parameters) {
	console.log(request.getPublicMemory());
	console.log(request);
	console.log(response);
	console.log(parameters);
	console.log(request.parameters.password);

	if (request.getPublicMemory().users[request.parameters.username]) {
		if (request.getPublicMemory().users[request.parameters.username].details.password === request.parameters.password) {
			console.log('login succuessful. sending static page: /mail/mail.html');
			response.sendStaticPage('/mail/mail.html', function () {});
		} else {
			invalidUsernameOrPassword();
		}
	} else {
		invalidUsernameOrPassword();
	}

	function invalidUsernameOrPassword () {
		console.log('Invalid username or password. Sending STATUS 401.1');
		response.status = 401.1;//TODO don't think this actually works though. automatically changes to 200 I think
		response.end('Wrong Username or password.');
	}
}
};

var registerCallbackObj = {call: function (request, response, parameters) {
	var userObj = {};
	if (!request.getPublicMemory().users[request.parameters.username]) {
		userObj = {
			details: {
				username: request.parameters.username,
				password: request.parameters.password,
				firstname: request.parameters.firstname,
				lastname: request.parameters.surname,
				age: request.parameters.age
			},
			mails: [],
			sent: []
		};
		request.getPublicMemory().users[request.parameters.username] = userObj;
		console.log('sending static page: /mail/mail.html');
		response.sendStaticPage('/mail/mail.html', function () {});
	} else {
		console.log('Username already exists.');
		response.status = 200;//TODO should be something else probably
		response.write('Username already exists.');
		response.end();
	}
}
};



//TODO. This callback has to return all the emails for the currently logged in user, to the browser, which will then display it.
var getEmailsCallbackObj = {call: function (request, response, parameters) {
	console.log('getEmailsCallbackObj.');
	response.end('some response');
}	
};

//--------------------------------------------------------------
//FOR TESTING PURPOSES
//--------------------------------------------------------------
var seePublicMemoryCallbackObj = {call: function (request, response, parameters) {
	console.log('Displaying Public Memory.');

	response.write('<html><body><h1>Public Memory</h1>');
    response.write(JSON.stringify(request.getPublicMemory()),{},'<br />');
    response.end('</body></html>');
}	
};

var server = myHttp.createHTTPServer(resourceMap, rootFolder);

server.onStart(function () {
	console.log('Mail server started.');

    /* static pages handlers */
    server.any('/mail/mail.html', mail.security.callBack);
    server.any('/mail/welcome.html', mail.security.callBack);

    /* virtual pages handlers */
	server.post('/mail/login', mail.login.callBack);
	server.post('/mail/register', mail.register.callBack);
	server.post('/mail/sendEmail', mail.sendMail.callBack);
    server.post('/mail/deleteMail',mail.deleteMail.callBack);
    server.any('/mail/mailList/:box', mail.mailList.callBack);
    server.any('/mail/logout',mail.logout.callBack);

    /* debug */
	server.get('/mail/publicMemory.html', seePublicMemoryCallbackObj);
	server.get('/mail/emails', getEmailsCallbackObj);


	server.get('/mail/getLoggedInUsername', mail.getInfo.getUsernameCallback);
	server.get('/mail/getAllUsers', mail.getInfo.getAllUsersCallback);
});

server.startServer(port);