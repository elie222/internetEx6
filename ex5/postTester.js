var net = require('net');

var port = 8888;

var client = net.connect({port: port},
    function() { //'connect' listener
        console.log('client connected');
        //multiple requests test
        var body = 'key1=value1';
        client.write('POST /photos/gary/to/david HTTP/1.1\r\nContent-length: ' + body.length + '\r\n\r\n' + body);
        //client.write('POST / HTTP/1.1\r\nContent-length: 6\r\n\r\nWorld!');
        //client.write('GET / HTTP/1.1\r\n\r\n');

        //single request split up test
        //client.write('GET / HTTP/1.1\r\n\r\nGET / HTTP/1.1\r\n\r\n');

        //split request test
        //client.write('GET / HTTP');
        //client.write('/1.1\r\n\r\n');
    });
client.on('data', function(data) {
    console.log(data.toString());
    //client.end();
});
client.on('end', function() {
    console.log('client disconnected');
});
