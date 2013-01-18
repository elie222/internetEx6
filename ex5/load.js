var net = require('net');
var myHttp = require('./../myHttp');

var port = 8888;

var resourceMap = {
    '/hi': '/a',
    '/': '/index.html'
};
var rootFolder = '/Users/Elie2/WebstormProjects/internet_hw5/www';//CHANGE TO ROOT FOLDER

//server
var server = myHttp.createHTTPServer(resourceMap, rootFolder);

server.startServer(port);

//clients
for (var i = 0; i<1000; i++) {
    var client = net.connect({port: port},
        function() { //'connect' listener
            console.log('client connected');
            client.write('GET / HTTP/1.1\r\n\r\n');
        });
    client.on('data', function(data) {
        console.log(data.toString());
        //client.end();
    });
    client.on('end', function() {
        console.log('client disconnected');
    });
    client.on('error', function() {
        console.log('client error');
    });
}

