/**
 * Created with JetBrains WebStorm.
 * User: LEO
 * Date: 16/01/13
 * Time: 22:34
 * To change this template use File | Settings | File Templates.
 */


var myHttp = require("./myHttp");
var mail = require('./mail/include');



//var rootFolder = 'C:\\Users\\LEO\\Documents\\HUJI\\Internet Technologies\\hw6\\internetEx6\\www';
//var rootFolder = '/Users/Elie2/WebstormProjects/internetEx6/www';
var rootFolder ='D:\\Leonid\\internet\\hw6\\internetEx6\\www';


var port = 8888;
var resourceMap = {
    '/': 'mail/welcome.html'
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
    response.write(JSON.stringify(request.getPublicMemory()));
    response.end('</body></html>');
}	
};

var server = myHttp.createHTTPServer(resourceMap, rootFolder);

server.onStart(function () {
	console.log('Mail server started.');

	server.post('/mail/login', mail.login.callBack);
	server.post('/mail/register', mail.register.callBack);
	server.post('/mail/sendEmail', mail.sendMail.callBack);


	server.get('/mail/publicMemory.html', seePublicMemoryCallbackObj);
	server.get('/mail/emails', getEmailsCallbackObj);
});

server.startServer(port);