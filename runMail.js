var myHttp = require("./myHttp");
var mail = require('./mail/include');

//var rootFolder = 'C:\\Users\\LEO\\Documents\\HUJI\\Internet Technologies\\hw6\\internetEx6\\www';
var rootFolder = '/Users/Elie2/WebstormProjects/internetEx6/www';
//var rootFolder ='D:\\Leonid\\internet\\hw6\\internetEx6\\www';

var port = 8888;
var resourceMap = {};

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

	server.get('/mail/getLoggedInUsername', mail.getInfo.getUsernameCallback);
	server.get('/mail/getAllUsers', mail.getInfo.getAllUsersCallback);

	/* debug */
	//server.get('/mail/publicMemory.html', seePublicMemoryCallbackObj);
});

server.startServer(port);