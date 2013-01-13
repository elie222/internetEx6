var net = require('net');
var http = require('http');
var fs = require('fs');
var myHttp = require('./myHttp');

var PORT = 8888;
var NO_RESPONSE_TIMEOUT = 100;

function PartialRequest(callback) {
    var client = net.connect({port: PORT} , function () {
        console.log('socket connected! \n');
        ready = true;
        callback(that);
    });
    var that = this;
    var ready = false;
    var responseCallback = null;
    var requestString = '';
    var responseString = '';

    function onData (data) {
        //console.log(data.toString());
        responseString += data;
        if(responseCallback) {
            responseCallback(that);
        }
    }

    function onError() {
        //console.log('Error in socket! \n');
    }

    function onEnd() {
        //console.log('Server requested to close the socket \n');
        console.log('----------------------------------------');
        console.log('Request was: \n');
        console.log(requestString);
        //console.log('\n');
        console.log('Response was: \n');
        console.log(responseString);
        //console.log('\n');
        console.log('----------------------------------------');
    }

    function onClose() {
        //console.log('Socket is close \n');

    }

    function onTimeout() {
        //console.log('No response from the server... \n');
        if(responseCallback) {
            responseCallback(that);
        }
    }


    client.on('data', onData);
    client.on('end',onEnd);
    client.on('error', onError);
    client.on('close', onClose);
    client.on('timeout',onTimeout);
    that.addChunk = function (chunk, callback) {
        //if (!ready || !chunk || !callback) throw 'please wait until ready';
        ready = false;
        //console.log('writing to server: ' + chunk);
        client.write(chunk.toString(), function () {
            ready = true;
            responseCallback = callback;
            requestString += chunk.toString();
            client.setTimeout(NO_RESPONSE_TIMEOUT);
        });
    };

    that.end = function() {

        client.end();
    }
}

function createFullRequests() {
    console.log('POST message\n');
    var request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.1\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    console.log('GET message\n');
    request = new PartialRequest(function (request) {
        request.addChunk('GET /status HTTP/1.1\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('GET /status HTTP/1.1\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('GET /status HTTP/1.1\r\nContent-length: 5\r\nConnection: Keep-Alive\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('GET /status HTTP/1.1\r\nContent-length: 5\r\nConnection: Keep-\r\n Alive\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('GET /status HTTP/1.1\r\nContent-length: 5\r\nConnection: close\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    console.log('Unusual headers\n');
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.1\r\nContent-length:           5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.1\r\nContent-length:5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.1\r\nContent-length:  5\r\n@_#Dumm-y@#@$#,@$6546456:345351  AAd,f sdf\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    var request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.1\r\nContent-length: 5\r\ndummy: long-value\r\n rest-ofit         \r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
}


function createPartialRequests() {
    var body = 'Hello\r\nWorld!';
    var request = new PartialRequest(function (request) {
        request.addChunk('POS', function (request) {
            request.addChunk('T /stat', function (request) {
                request.addChunk('us HT', function (request) {
                    request.addChunk('TP/1.', function (request) {
                        request.addChunk('1\r', function (request) {
                            request.addChunk('\nContent-', function (request) {
                                request.addChunk('length:', function (request) {
                                    request.addChunk(' '+body.length+'\r', function (request) {
                                        request.addChunk('\n\r\n', function (request) {
                                            request.addChunk('Hello\r\n', function (request) {
                                                request.addChunk('World!\r\n', function (request) {
                                                    request.end();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    request = new PartialRequest(function (request) {
        request.addChunk('GE', function (request) {
            request.addChunk('T /', function (request) {
                request.addChunk('status HT', function (request) {
                    request.addChunk('TP/1.', function (request) {
                        request.addChunk('1\r', function (request) {
                            request.addChunk('\nContent-', function (request) {
                                request.addChunk('length:', function (request) {
                                    request.addChunk(' '+body.length+'\r', function (request) {
                                        request.addChunk('\n\r\n', function (request) {
                                            request.addChunk('Hello\r\n', function (request) {
                                                request.addChunk('World!\r\n', function (request) {
                                                    request.end();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}


function createCorruptedRequests() {
    // wrong protocol...//
    console.log('wrong protocol\n');
    var request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/2.1\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.5\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.a\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.11\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/-1.1\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP 1.1\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });

    // wrong method //
    console.log('wrong method\n');
    request = new PartialRequest(function (request) {
        request.addChunk('POS /status HTTP/1.1\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('HEAD /status HTTP/1.1\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });

    // Invalid parameters num //
    console.log('invalid parameters num\n');
    request = new PartialRequest(function (request) {
        request.addChunk('POST HTTP/1.1\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status \r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.1 \r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.1 hello\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status\r\n HTTP/1.1\r\nContent-length: 5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });

    console.log('corrupted headers\n');
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.1\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.1\r\n\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.1\r\n Content-length:   \t        5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.1\r\nContent-length:  5\r\nDummy:first:second\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    console.log('content-length corrupted\n');
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.1\r\nContent-length:  -5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('POST /status HTTP/1.1\r\nContent-length:  5.5\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    // connection field
    request = new PartialRequest(function (request) {
        request.addChunk('GET /status HTTP/1.1\r\nContent-length: 5\r\nConnection: -1\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
    request = new PartialRequest(function (request) {
        request.addChunk('GET /status HTTP/1.1\r\nContent-length: 5\r\nConnection: keep-Alive\r\n\r\nHello\r\n', function (request) {
            request.end();
        });
    });
}

function createGetRequest(uri) {
    var options = {
        host: '127.0.0.1',
        path:uri,
        method: 'GET',
        port: PORT
    };
    var response = '';
    var request = http.request(options,function (res) {
        res.on('data', function (data) {
           response += data.toString();
        });
        res.on('close', function() {
            console.log('The server hs closed the socket\n');
        });
        res.on('end', function() {
            console.log('-------------------------------');
            console.log('response for: ' + uri);
            console.log('-------------------------------');
            console.log('Code: '+res.statusCode);
            console.log('Total Bytes received: '+response.length);
            console.log('-------------------------------\n');
        });
        res.on('error', function() {
           console.log('An error in request!');
        });
    });

    request.on('error', function(e) {
        console.log('ERROR: '+ e.message);
    })
    request.end();

}

function createPostRequest(uri,readStream,size) {
    var options = {
        host: '127.0.0.1',
        path:uri,
        method: 'POST',
        port: PORT,
        headers : {
            'Content-Length': size
        }
    };
    var response = '';
    var request = http.request(options,function (res) {
        res.on('data', function (data) {
            response += data.toString();
        });
        res.on('close', function() {
            console.log('The server hs closed the socket\n');
        });
        res.on('end', function() {
            console.log('-------------------------------');
            console.log('response for: ' + uri);
            console.log('-------------------------------');
            console.log('Code: '+res.statusCode);
            console.log('Total Bytes received: '+response.length);
            console.log('-------------------------------\n');
        });
        res.on('error', function() {
            console.log('An error in request!');
        });
    });
    readStream.pipe(request);
    request.on('end',function () {
       request.end();
    });
}

function testURIField() {
    // correct requests
    createGetRequest('/');
    createGetRequest('/?hi=3');
    createGetRequest('/files%20test/split%20name.txt');
    createGetRequest('/files%20test/עברית.txt');
    createGetRequest('/files%20test/עברית.txt?a=3');

    // wrong requests
    createGetRequest('/files%20test');
    createGetRequest('/files%20test/');
    createGetRequest('/files test/split%20name.txt');
    createGetRequest('/files%20test/split name.txt');
}

function testURISecurity() {
    // uri security issues
    createGetRequest('2/password.txt');
    createGetRequest('../www2/password.txt');
    createGetRequest('/../www2/password.txt');
    createGetRequest('/files%20test/split..%20name.txt');
    createGetRequest('/files%20test/split%20name.zip');
    createGetRequest('/files%20test/split%20name.');
    createGetRequest('/files%20test/split%20name');
    createGetRequest('?hi=3');
    createGetRequest('/files%20test/spl?it%20name.txt');
    createGetRequest('C:\\test\\test.txt');
    createGetRequest('/files%20test/test.html');
}

function testOverflow() {
    var fileLocation = '/Users/Elie2/Desktop/ex4/myWww/video.jpg';
    var readStream = fs.createReadStream(fileLocation);
    createPostRequest('/', readStream, 2000000000);
}

function testMassiveGetRequest() {
    //initial line too long
    location = '/';
    for (var i=0; i<5; ++i) {
        location += '12345678901234567890123456789012345678901234567890';//length = 51
    }
    location += '.txt';
    createGetRequest(location);
}

function testMassivePostRequest() {
    //request bigger than 8KB.
    var location = '/';
    for (var i=0; i<200; ++i) {
        location += '12345678901234567890123456789012345678901234567890';//length = 51
    }
    location += '.txt';
    createGetRequest(location);

    //initial line probably too long
    location = '/';
    for (var i=0; i<100; ++i) {
        location += '12345678901234567890123456789012345678901234567890';//length = 51
    }
    location += '.txt';
    createGetRequest(location);
}

function testDoSSecurity() {
    for (var i = 0; i<10000; ++i) {
        createGetRequest('/');
    }
}

function testSequentialRequests() {
    var client = net.connect({port: PORT},
        function() { //'connect' listener
            console.log('client connected');
            for (var i = 0; i<200; ++i) {
                client.write('GET / HTTP/1.1\r\n\r\n');
            }
        });
    client.on('data', function(data) {
        //console.log(data.toString());
    });
    client.on('end', function() {
        console.log('client disconnected');
    });
}

function testSequentialRequestsWithClose() {
    for (var i = 0; i<200; ++i) {
        var client = net.connect({port: PORT},
        function() { //'connect' listener
            console.log('client connected');
            client.end('GET / HTTP/1.1\r\n\r\n');

        });
        client.on('data', function(data) {
            console.log(data.toString());
        });
        client.on('end', function() {
            console.log('client disconnected');
        });
    }
}

function testTimeOut() {
    var client = net.connect({port: PORT},
        function() { //'connect' listener
            console.log('client connected');
            client.write('GET / HTTP');
            function sleep(seconds) {
                var milliSeconds = seconds * 1000;
                var startTime = new Date().getTime();
                while (new Date().getTime() < startTime + milliSeconds);
            }

            sleep(5);
            console.log('awake');
            client.write('/1.1\r\n\r\n');
        });
    client.on('data', function(data) {
        console.log(data.toString());
    });
    client.on('end', function() {
        console.log('client disconnected');
    });
}

// MAKE SURE THAT NO OTHER APP IS RUNNING //
function testServerInterface()  {
    var resourceMap = {
        '/hi': '/a.html',
        '/' : '\\profile.html'
        //'\\' : '\\index.html'
    };

    var rootFolder = 'D:\\Leonid\\internet\\hw5\\www';

    // create a server
    var server = myHttp.createHTTPServer(resourceMap, rootFolder);
    // create another instance:
    var server2 = myHttp.createHTTPServer(resourceMap, rootFolder);

    server.on('request', function () {
        console.log('---request event emitted.')
    });
    server.on('start', function () {
        console.log('---start event emitted.')
    });
    
    // make them listen on a same port:
    server.startServer(8887, function () {
        console.log("Started server at 8887\n");
        server2.startServer(8887, function () {
            server2.startServer(8888, function () {
                console.log("started server2 at 8888\n");
                server.startServer(8887, function () {
                    //console.log("stopped server at 8887\n");
                    //server.stopServer(); // exception
                }); // should raise an exception
                //console.log("stopped server2 at 8888\n");
                //server2.stopServer();
            }); // should raise an exception
        });
    });


}


////////////////
//  TESTS  //
////////////////
//createFullRequests();
//createCorruptedRequests();

//testURIField(); // PASS
//testURISecurity(); //PASS
//testOverflow(); // TODO: check on your PC
testServerInterface(); // TODO: extend this test for testing new onStop and emit user events
//testMassiveGetRequest(); // PASS
//testDoSSecurity(); // PASS (10000)
//testSequentialRequests();// INVALID TEST
//testSequentialRequestsWithClose();// INVALID TEST
//testTimeOut(); // PASS
