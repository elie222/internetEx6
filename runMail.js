/**
 * Created with JetBrains WebStorm.
 * User: LEO
 * Date: 16/01/13
 * Time: 22:34
 * To change this template use File | Settings | File Templates.
 */
var myHttp = require("./myHttp");


//var rootFolder = 'C:\\Users\\LEO\\Documents\\HUJI\\Internet Technologies\\hw6\\internetEx6\\www';
var rootFolder = '/Users/Elie2/WebstormProjects/internetEx6/www';


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
			response.sendStaticPage('/mail/mail.html', function () {
				console.log('sending static page: /mail/stylesheet.css');
				response.sendStaticPage('/mail/stylesheet.css', function () {});
			});
		} else {
			console.log('Invalid username or password.');
			//TODO
		}
	} else {
		console.log('Invalid username or password.');
		//TODO
	}
}
};

var registerCallbackObj = {call: function (request, response, parameters) {
	var userObj = {};
	console.log('sending static page: /mail/mail.html');
	if (!request.getPublicMemory().users[request.parameters.username]) {
		userObj = {details: {
				username: request.parameters.username,
				password: request.parameters.password,
				firstname: request.parameters.firstname,
				lastname: request.parameters.surname,
				age: request.parameters.age
			},
			mails: {},
			sent: {}
		};
		request.getPublicMemory().users[request.parameters.username] = userObj;
		response.sendStaticPage('/mail/mail.html', function () {});
	} else {
		console.log('Username already exists.');
		//TODO more stuff here
		response.write('Username already exists.');
		response.end();
	}
}
};

var server = myHttp.createHTTPServer(resourceMap, rootFolder);

server.onStart(function () {
	console.log('Mail server started.');
	server.post('/mail/login', loginCallbackObj);
	server.post('/mail/register', registerCallbackObj);
});

server.startServer(port);