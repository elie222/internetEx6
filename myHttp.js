var net = require('net');
var url = require('url');
var fs = require('fs');
var path = require('path');
var util = require("util");
var events = require("events");
var querystring = require("querystring");
var settings = require('./settings');
var uuid = require("./uuid");
/***************** TODO ************************

 1. Add keep-alive upon receiving one            NO NEED
 2. Support all kind of headers (with spaces, multiple lines     DONE
 3. support all kind of characters in file name  DONE
 4. finish status - make sure it contains right names (As in ex4) CONTAINS RIGHT NAMES
 5. implement stopServer DONE
 6. add support for params in GET (separated by '?')    DONE
 7. make sure content-length is there for POST (otherwise output an error)  DONE
 8. limit the size of headers , values and filename     DONE
 9. support for full path in URI (GET http://127.0.0.1 HTTP/1.1)    OVERSPEC
 10. fix a bug in timeouts DONE

 *************************************************/
function createHTTPServer(pResourceMap, pRootFolder) {
    //try {
    function Server () {

        /*******************/
        /* Private Members */
        /*******************/

        var that = this;
        var isStarted = false;
        var startedTime = 0;
        var numOfSuccessfulRequests = 0;
        var numOfCurrentRequests = 0;
        var numOfTotalRequests = 0;
        var resourceMap = pResourceMap;
        var rootFolder = pRootFolder;
        var port = null;
        var server = null;
        var requestMapGet = {};
        var requestMapPost = {};
       // var allSessions = {};//TODO why is this commented out?
        var socketNum = 0;
        var shuttingDown = false;

        var publicMemory = {};

        var CONTENT_TYPES = {
            "js" : "application/javascript",
            "txt" : "text/plain",
            "html" : "text/html",
            "htm" : "text/html",
            "css" : "text/css",
            "jpg" : "image/jpeg",
            "jpeg" : "image/jpeg",
            "gif" : "image/gif",
            "png" :"image/png",
            "ico" : "image/vnd.microsoft.icon",
            "manifest" : "text/cache-manifest"
        };

        /******************/
        /* Public Members */
        /******************/


        /*******************/
        /* Private Methods */
        /*******************/
        function Mutex() {
            var waitQueue = [];
            //noinspection JSUnusedLocalSymbols,JSUnusedLocalSymbols
            var that = this;
            function execute() {
                var code;
                var param;
                if (waitQueue.length > 0) {
                    code = (waitQueue[0])[0];
                    param = (waitQueue[0])[1];
                    code(param);
                }
            }
            this.lock = function (param, code) {
                if (!code || !param) throw new Error('Must specify code to the mutex');
                waitQueue.push([code, param]);
                //console.log('Locked');
                if (waitQueue.length === 1) {
                    code(param);
                }
            };
            this.unlock = function () {
                //var func = null;
                if (waitQueue.length > 0) {
                    //console.log('Unlocked');
                    waitQueue.shift();
                }
                execute();
            };
            this.sizeOfQueue = function () {
                return waitQueue.length;
            }
        }
        /*********************/
        /* Interface Methods */
        /*********************/

        this.startServer = function (pPort,callBack) {
            if(port != null) {
                console.log('ERROR: The server is already listening to port ' + port + '\n');
                if(callBack) {
                    callBack();
                }
                return;
            }
            port = pPort;
            console.log('Starting server at port: ' + port + '\n');

            startedTime = new Date();
            server = net.createServer({allowHalfOpen: false});
            shuttingDown = false;
            // Server event handlers //

            function onServerConnection(socket) {

                //var isSocketActive = false;
                var isKeepAlive = true;
                var numOfSocketRequests = 0;
                var activeFileName = null;

                var fileType = '';
                var requestedFile = '';
                var fileLocation = '';

                //for parsing
                var dataCollectedSoFar = '';
                var bodyCollectedSoFar = '';
                var parsedHeader = {};
                //var isTimeout = true;
                var mutex = new Mutex();
                var sessionId = null;
                // TODO: remove after debugging
                var socketId = socketNum++;
                //console.log('Server connected at port: ' + port + '\n');

                if(numOfCurrentRequests >= settings.MAX_REQUESTS) {
                    reportError(503,'Server overloaded - no more new connections accepted');
                    return;
                }

                function buildDefaultHeaders() {
                    return {
                        'Content-Type' : CONTENT_TYPES['html'],
                        'Host' : '127.0.0.1',//TODO shouldn't this be dependent on the situation?
                        'Accept-Ranges' : 'binary'
                    };
                }

                function createRequestObject(parsedData) {
                    return new function() {
                        //console.log(parsedData);

                        var thatServer = that;
                        var thatRequest = this;
                        var paramsRegex = new RegExp('([^=&]+[=][^=&]*)([&]?([^=&]+[=][^=&]*)[&]?)*');
                        //var session = getActiveSession();
                        var search = '';

                        // fields
                        this.headers =  {};
                        this.body = parsedData['RequestBody'];
                        this.method = parsedData['Method'];
                        this.resource = parsedData['RequestURI'];

                        if (parsedData['Method']==='GET') {
                            search = parsedData['URIParameters'];
                        } else if (parsedData['Method']==='POST') {                            
                            //checking if body is in parameter format
                            search = parsedData['RequestBody'];

                            //console.log('paramsRegex.exec(search): ' + paramsRegex.exec(search));
                            if (paramsRegex.exec(search)) {
                                if (search!==paramsRegex.exec(search)[0]) {
                                    //console.log('----------REGEX DIDNT MATCH');
                                    search = '';
                                }
                            } else {
                                search = '';
                            }
                        } else {
                            console.log('ERROR! Method must be GET or POST');//should never reach here
                        }
                        //console.log('search: ' + search);
                        thatRequest.parameters = querystring.parse(search);
                        /*
                        for(var key in thatRequest.parameters) {
                            console.log("key = "+key);
                        }
                        */
                        this.getPublicMemory = function () {
                            return publicMemory;
                        };

                        // private methods //
                        /*
                        function getCurrentUUID() {
                            var id = null;
                            that.getCookies(); // that will store sessionId if found in the request
                            console.log('request has the following session id: '+sessionCookie)
                            if(sessionId)
                                id = sessionId;
                            return id;
                        }
                        */
                        function resetTimer() {
                            if(!sessionId || !thatServer.allSessions[sessionId]) return;
                            var timer = setTimeout(function () {
                                delete thatServer.allSessions[sessionId];
                                sessionId = null;
                                //console.log('session deleted!');
                            },settings.SESSION_TIMEOUT_MIN * 60 * 1000);

                            if(thatServer.allSessions[sessionId][1])
                                clearTimeout(thatServer.allSessions[sessionId][1]);
                            // reset the timer...
                            thatServer.allSessions[sessionId][1] = timer;
                        }

                        function generateUUID() {
                            var buffer = new Buffer(16);
                            var uid = '';
                            uuid.v1(null,buffer,0);
                            uid = uuid.unparse(buffer,0);
                            //console.log('UID is: ' + uid);
                            return uid;
                        }
                        //  privileged methods //

                        this.getCookies = function () {
                            var cookies = [];
                            var keys = {};
                            var parsedCookies = [];
                            var key = '';
                            var value = '';
                            var keyValue = [];

                            if(parsedData['cookie']) {
                                //console.log('cookie header = ' + parsedData['cookie'] + '\n');
                                parsedCookies = parsedData['cookie'].toString().split(';');
                                for(var i in parsedCookies) {
                                    keyValue = parsedCookies[i].toString().split('=');
                                    if(keyValue.length !== 2)
                                        throw new Error('Invalid cookie header received from the client(1) '+ keyValue.length);

                                    key = keyValue[0].toString().trim();
                                    value = keyValue[1].toString().trim();
                                    if(!key)
                                        throw new Error('Invalid cookie header received from the client(2)');
                                    if(keys['key'])
                                        throw new Error('Duplicate key received from the client');
                                    // set session id if found...
                                    if(key === '__sessionId__')
                                        sessionId = value;

                                    keys[key] = true;
                                    cookies.push({
                                        'key' : key,
                                        'value' : value,
                                        'host' : '/'
                                    });
                                }
                            }
                            return cookies;
                        };

                        this.getSessionUUID = function () {
                            //sessionId = getCurrentUUID();
                            thatRequest.getCookies(); // that will set sessionId if found in the request...
                            if(sessionId && thatServer.allSessions[sessionId])
                                return sessionId;
                            sessionId = generateUUID();
                            //console.log('Generated a new session id: '+ sessionId + '\n');
                            resetTimer();
                            return sessionId;
                        };

                        this.getSession = function () {
                            sessionId = thatRequest.getSessionUUID();
                            if(!thatServer.allSessions[sessionId])
                                thatServer.allSessions[sessionId] = [{},null];
                            resetTimer();
                            return thatServer.allSessions[sessionId][0];
                        };


                        // constructor //
                        (function () {
                            sessionId = null;
                            for (var property in parsedData) {
                                if (property === 'Method' || property === 'RequestURI' || property === 'HttpVersion' || property === 'body')
                                    continue;
                                if(parsedData.hasOwnProperty(property))
                                    thatRequest.headers[property] = parsedData[property.toString()];
                            }
                        })();
                    };
                }

                function createResponseObject(callback) {
                    return new function() {
                        var that = this;
                        var content = '';
                        var cookies = {};
                        var cookieOutput = '';
                        // initiate timeout //
                        //console.log('setting timeout ('+socketId+') at: ' + new Date().getTime());
                        socket.setTimeout(0);
                        socket.removeAllListeners('timeout');
                        socket.on('timeout',function () {
                            //console.log('Dynamic request timeout!\n');
                            reportError(408,'Dynamic request timeout',callback);
                            return;
                        });
                        socket.setTimeout(settings.DYNAMIC_REQUEST_TIMEOUT_SEC * 1000);

                        // fields //
                        this.headers = buildDefaultHeaders();
                        this.status = 200;

                        // private methods //

                        function formatCookies() {
                            // write cookies
                            if(Object.keys(cookies).length > 0) {
                                //console.log('A cookie is found!');
                                for(var cookie in cookies) {
                                    if(cookies.hasOwnProperty(cookie)) {
                                        //console.log('writing cookie:');
                                        // set the key=value pair
                                        cookieOutput += 'Set-Cookie: ' + cookie + '=' + cookies[cookie]['value'];
                                        // check for additional properties and add as necessary
                                        if(cookies[cookie]['expire'])
                                            cookieOutput += '; Expires=' + cookies[cookie]['expire'];
                                        if(cookies[cookie]['domain'])
                                            cookieOutput += '; Domain=' + cookies[cookie]['domain'];
                                        if(cookies[cookie]['path'])
                                            cookieOutput += '; Path=' + cookies[cookie]['path'];
                                        if(cookies[cookie]['httpOnly'])
                                            cookieOutput += '; HttpOnly';
                                        cookieOutput += '\r\n';
                                    }
                                }
                                //console.log('cookieOutput =\n' + cookieOutput);
                            }
                        }

                        // privileged methods //

                        this.write = function (s) {
                            content += s;
                        };

                        this.end = function (s) {
                            var sessionExpiration = new Date();

                            //console.log('Ending response...');
                            //console.log('cookies size is: ' + cookies.length);
                            if (s)
                                content += s;
                            // add a session cookie
                            if(sessionId) {
                                //console.log('\nCurrent Time is: '+sessionExpiration.);
                                sessionExpiration.setTime(sessionExpiration.getTime() + settings.SESSION_TIMEOUT_MIN * 60 * 1000);
                                //console.log('Next Time is: '+sessionExpiration.toUTCString().replace(':','-') + '\n');
                                cookies['__sessionId__'] = {
                                    'key' : '__sessionId__',
                                    'value' : sessionId,
                                    'expire' : sessionExpiration.toUTCString(),
                                    'httpOnly' : true
                                };
                            }
                            formatCookies();
                            /*
                            if(sessionId) {
                                sessionExpiration.setTime(sessionExpiration.getTime() + settings.SESSION_TIMEOUT_MIN * 60 * 1000);
                                cookieOutput += 'Set-Cookie: __sessionId__=' + sessionId.toString() ;
                                cookieOutput += '; Expires=' + sessionExpiration;
                                cookieOutput += '; Path=\'/\'';
                                cookieOutput += '; HttpOnly';
                                cookieOutput += '\r\n';
                            }
                            */
                            writeHeader(that.status,'User Defined',that.headers['Content-Type'],content.length, that.headers, function () {
                                    socket.write(cookieOutput, function() {
                                        socket.write('\r\n' + content, function() {
                                            cleanUpAndClose();
                                            if(callback)
                                                callback();
                                        }) ;
                                    });
                            });
                        };

                        this.sendStaticPage = function (page, callback) {

                            parsedData = {};
                            parsedData.RequestURI = page;

                            staticResponse(parsedData, callback);

                            /*
                            that.status = 303;
                            that.headers['Location'] = page;
                            that.end('');
                            */
                        };

                        this.addCookie = function (cookie) {
                            // TODO: what happens if the user uses a Set-Cookie header?
                            if(!cookie || !cookie['key']) {
                                throw new Error('The argument is not a valid cookie object');
                            }
                            if(!cookie['path'])
                                cookie['path'] = '/';
                            //console.log('cookie is set! ('+cookie.key+' , '+cookie.value+')');
                            cookies[cookie.key] = cookie;

                            //console.log('cookies size is: ' + cookies.length);
                        };

                        this.deleteCookie = function (cookieKey) {
                            if(!cookieKey) {
                                throw new Error('The argument is not a valid cookie object');
                            }
                           delete  cookies[cookieKey] ;
                        };
                    };
                }

                //example of what this method will receive: ('a/b/c/', 'a/:x/:y/')
                //('a/b/c/d/', 'a/:x/c/:y/') is also considered valid and we handle it well. 
                function createParameters(requestURI, pathFormat) {
                    // console.log('function createParameters(requestURI, pathFormat)');
                    // console.log('requestURI: ' + requestURI);
                    // console.log('pathFormat: ' + pathFormat);

                    var parameters = {};
                    var splitPathFormat, splitRequestURI;

                    if (pathFormat ==='') {
                        return [];
                    }

                    //remove leading and trailing whitespace
                    pathFormat = pathFormat.toString().trim();
                    requestURI = requestURI.toString().trim();

                    if (pathFormat.charAt(0)==='/') {
                        pathFormat = pathFormat.slice(1);//remove the / from the beginning of the string
                    }
                    if (requestURI.charAt(0)==='/') {
                        requestURI = requestURI.slice(1);//remove the / from the beginning of the string
                    }

                    if (pathFormat.charAt(pathFormat.length-1)==='/') {
                        pathFormat = pathFormat.slice(0, -1);//remove the / from the end of the string
                    }
                    if (requestURI.charAt(requestURI.length-1)==='/') {
                        requestURI = requestURI.slice(0, -1);//remove the / from the end of the string
                    }

                    //console.log('pathFormat: ' + pathFormat);
                    //console.log('requestURI: ' + requestURI);

                    splitPathFormat = pathFormat.split('/');
                    splitRequestURI = requestURI.split('/');

                    //console.log('splitPathFormat.length: ' + splitPathFormat.length);
                    //console.log('splitRequestURI.length: ' + splitRequestURI.length);

                    for (var j=0; j<splitPathFormat.length; j++) {
                        //console.log('splitPathFormat[j]: ' + splitPathFormat[j]);
                        if (splitPathFormat[j].trim().charAt(0)===':') {
                            //console.log('found :');
                            parameters[splitPathFormat[j].trim().slice(1)] = splitRequestURI[j];
                        }
                    }

                    // console.log('--printing parameters:');
                    // for (var property in parameters) {
                    //     console.log(property + ':' + parameters[property]);
                    // }

                    return parameters;
                }

                /* responds to a request */
                function respond(parsedData, callback) {
                    console.log('responding... socketId: ' + socketId + ' requestUri: '+parsedData.RequestURI);

                    var userCallBack = null;
                    var request = null;
                    var response = null;
                    var parameters = null;
                    var requestMapKey = '';

                    isKeepAlive = !((parsedData.httpVersion === '1.0' && parsedData['connection'].toString().toLowerCase() === 'keep-alive') || parsedData['connection'] === 'close');

                    //console.log('isKeepAlive = ' + isKeepAlive);
                    //console.log('parsedData.RequestURI: ' + parsedData.RequestURI);

                    // TODO: add the status event to the requestMap (both to POST and GET)
                    if (parsedData.RequestURI === '/status') {
                         writeStatus(callback);
                        return;
                    }

                    //check if requestURI matches key's format
                    function matches(key, requestURI) {
                        //remove leading and trailing whitespace
                        key = key.toString().trim();
                        requestURI = requestURI.toString().trim();

                        if (key.charAt(0)==='/') {
                            key = key.slice(1);//remove the / from the beginning of the string
                        }
                        if (requestURI.charAt(0)==='/') {
                            requestURI = requestURI.slice(1);//remove the / from the beginning of the string
                        }

                        //TODO Don't remove the / from the end of the string
                        // if (key.charAt(key.length-1)==='/') {
                        //     key = key.slice(0, -1);//remove the / from the end of the string
                        // }
                        // if (requestURI.charAt(requestURI.length-1)==='/') {
                        //     requestURI = requestURI.slice(0, -1);//remove the / from the end of the string
                        // }

                        var splitKey = key.split('/');
                        var splitRequestURI = requestURI.split('/');
                        if (splitKey.length!==splitRequestURI.length) {
                            // console.log('lengths dont match');
                            return false;
                        }

                        for (var i=0; i<splitKey.length; ++i) {
                            // console.log('splitRequestURI[i]: ' + splitRequestURI[i]);
                            // console.log('splitKey[i]: ' + splitKey[i]);
                            if (splitKey[i].charAt(0)===':') {
                                //console.log('continue');
                                continue;
                            }
                            if (splitKey[i]!==splitRequestURI[i]) {
                                // console.log('params dont match');
                                return false;
                            }
                        }

                        return true;
                    }

                    if (parsedData.Method === 'GET') {
                        for (var key in requestMapGet) {
                            // console.log('KEY: ' + key);
                            // console.log('parsedData.RequestURI: ' + parsedData.RequestURI);
                            if (matches(key, parsedData.RequestURI)) {
                                // console.log('matches');
                                requestMapKey = key;
                                break;
                            }
                            // console.log('doesnt match');
                        }
                    }

                    if (parsedData.Method === 'POST') {
                        for (var key in requestMapPost) {
                            if (matches(key, parsedData.RequestURI)) {
                                requestMapKey = key;
                                break;
                            }
                        }
                    }

                    //console.log('requestMapKey: ' + requestMapKey);
                    //console.log('parsedData.Method: ' + parsedData.Method);

                    if (requestMapGet[requestMapKey] && parsedData.Method === 'GET') {
                        userCallBack = requestMapGet[requestMapKey];
                        // invoke the user-callback
                        request = createRequestObject(parsedData);
                        response = createResponseObject(callback);
                        parameters = createParameters(parsedData['RequestURI'], requestMapKey);
                        try {
                            userCallBack.call(request, response, parameters);
                        }
                        catch(e) {
                            reportError(500, e.message , callback);
                        }
                        return;
                    } else if (requestMapPost[requestMapKey] && parsedData.Method === 'POST') {
                        userCallBack = requestMapPost[requestMapKey];
                        // invoke the user-callback
                        request = createRequestObject(parsedData);
                        response = createResponseObject(callback);
                        parameters = createParameters(parsedData['RequestURI'], requestMapKey);
                        try {
                            userCallBack.call(request,response,parameters);
                        }
                        catch(e) {
                            reportError(500, e.message, callback);
                        }
                        return;
                    }

                    staticResponse(parsedData, callback);
                }

                function staticResponse(parsedData, callback) {
                    //console.log('Num of current requests:  '+ numOfCurrentRequests);
                    fileType = '';
                    requestedFile = (!resourceMap[parsedData.RequestURI]) ? parsedData.RequestURI : resourceMap[parsedData.RequestURI];
                    requestedFile = path.normalize(requestedFile);

                    console.log('requestedFile is: ' + requestedFile);

                    if (requestedFile[0] !== path.sep) {
                        requestedFile =path.normalize('/' + requestedFile);
                    }
                    fileLocation = path.join(rootFolder,path.normalize(requestedFile));
                    activeFileName = fileLocation;
                    //console.log('parsed file is ' + requestedFile);

                    fileType = path.extname(fileLocation).slice(1);

                    // check for correct method
                    if (!CONTENT_TYPES[fileType]) {
                        reportError(415, 'Invalid file type (' + fileType + ') requested',callback);
                        return;
                    }

                    // validate that the requested URI is a valid file
                    fs.exists(fileLocation, function (isExist) {
                        if (!isExist) {
                            reportError(404,'The File (' + fileLocation + ') was not found',callback);
                            return;
                        }
                        fs.stat(fileLocation, function (err, stat) {
                            if (err) {
                                reportError(500,'Internal Server Error');
                                console.log('500 : Internal Server Error\nError is: ' + err.message,callback);
                                return;
                            }
                            if (!stat.isFile()) {
                                reportError(404,'The File (' + fileLocation + ') was not found',callback);
                                return;
                            }
                            //console.log('File size is ' + stat.size + '\n');

                            writeFile(fileLocation,CONTENT_TYPES[fileType],stat.size, callback);
                        });
                    });
                }

                function writeStatus(callback) {
                    var resourceMapOutput;
                    var rm;
                    resourceMapOutput = '';
                    rm = that.status().resourceMap;
                    for (var property in rm)
                        if (rm.hasOwnProperty(property))
                            resourceMapOutput += property.toString() + ' : ' + rm[property] + '<br />';

                    var content = '<html><body><h1> Status: </h1><br />';
                    content += 'isStarted = ' + (that.status().isStarted ? 'True' : 'False') + '<br />';
                    content += 'startedDate = ' + that.status().startedDate.toDateString() + ', ' + that.status().startedDate.toTimeString() + '<br />';
                    content += 'port = ' + that.status().port + '<br />';
                    content += 'resourceMap = <br />' + resourceMapOutput;
                    content += 'numOfCurrentRequests = ' + that.status().numOfCurrentRequests + '<br />';
                    content += 'precntageOfSuccesfulRequests = ' + that.status().precntageOfSuccesfulRequests + '<br />';

                    content += '</body></html>';
                    writeHeader(200,'OK',CONTENT_TYPES['html'],content.length, buildDefaultHeaders(), function () {
                        if (!socket.writable) {
                            isKeepAlive = false;
                            cleanUpAndClose();
                            return;
                        }

                        socket.write('\r\n' + content, function () {
                            cleanUpAndClose();
                            if (callback)
                                callback();
                        });
                    });
                }

                /* report error and display an HTML on the screen */
                function reportError(errorId, errorMessage, callback) {
                    //console.log('reporting error: ' + errorId + ' ' + errorMessage);
                    var content = '<html><body><h1>' + errorId + ' : ' + errorMessage + '</h1></body></html>';
                    writeHeader(errorId,errorMessage,CONTENT_TYPES['html'],content.length, buildDefaultHeaders(), function () {
                        if (!socket.writable) {
                            isKeepAlive = false;
                            cleanUpAndClose();
                            return;
                        }
                        socket.write('\r\n' + content, function () {
                            //isKeepAlive = false;
                            cleanUpAndClose();
                            if (callback)
                                callback();
                        });
                    });
                }

                /* manages statistics and destroys the socket */
                function cleanUpAndClose() {
                    //console.log('Cleaning-up before closing... ('+ socketId +')');
                    //if(!isSocketActive) return;
                    //isSocketActive = false;
                    if (numOfCurrentRequests < 0) throw new Error( "impossible number of current requests");
                    if (numOfSocketRequests > numOfCurrentRequests) throw new Error("the are more socket requests than total - impossible!");
                    //if(numOfSocketRequests === 0) return;

                    if (!isKeepAlive) {
                        numOfCurrentRequests -= numOfSocketRequests;
                        numOfSocketRequests = 0;
                    }
                    else if (numOfSocketRequests > 0) {
                        numOfSocketRequests--;
                        numOfCurrentRequests--;
                    }

                    if (numOfSocketRequests === 0 && !isKeepAlive) {
                        socket.end();
                        if(shuttingDown && numOfCurrentRequests === 0 ) {
                            shutDownServer();
                        }
                    }
                    else {
                        socket.setTimeout(0);
                        socket.removeAllListeners('timeout');
                        socket.setTimeout(settings.LAST_REQUEST_TIMEOUT_SEC * 1000,onSocketTimeout);
                    }
                }

                /* outputs a file to the client browser */
                // function writeFileWithoutPipe(fileLocation, contentType, fileSize, callback) {
                //     var readStream = fs.createReadStream(fileLocation);
                //     readStream.setEncoding();
                //     var bodyContent = '';

                //     // ReadStream event handlers //
                //     function onStreamData(data) {
                //         console.log(data);
                //         bodyContent += data;
                //     }

                //     function onStreamEnd() {
                //         if (!socket.writable) {
                //             isKeepAlive = false;
                //             cleanUpAndClose();
                //             return;
                //         }
                //         console.log('Read a total of ' + fileSize + ' bytes from ' + fileLocation + '\n');
                //         //socket.write('\r\n');

                //         var headers  = buildDefaultHeaders();

                //         var content = 'HTTP/1.1 200 OK\r\n';
                //         if (!socket.writable) {
                //             isKeepAlive = false;
                //             cleanUpAndClose();
                //             return;
                //         }

                //         numOfSuccessfulRequests++;

                //         headers['Content-Type'] = contentType;
                //         if (!headers['Host'])
                //             headers['Host'] = socket.address().address;

                //         for (var header in headers)
                //             if (headers.hasOwnProperty(header) && headers[header])
                //                 content += header + ': ' + headers[header] + '\r\n';

                //         content += 'Content-Length: '+ bodyContent.length + '\r\n';

                //         //console.log('response content:\n' + content);

                //         //console.log('Content: ' + content);

                //         socket.write(content);
                //         socket.write(bodyContent);
                //         cleanUpAndClose();
                //         if (callback)
                //             callback();
                //     }

                //     function onStreamClose() {
                //         //console.log('File ' + fileLocation +' is closed.\n');
                //     }

                //     function onStreamError() {
                //         console.log('Error reading the file... \n');
                //         readStream.destroy();
                //         reportError(500,"Unable to open file",callback);
                //     }

                //     function onStreamOpen() {
                //         //console.log('Opening the file...\n');
                //     }
                //     // add event listeners
                //     readStream.on('open',onStreamOpen);
                //     readStream.on('data',onStreamData);
                //     readStream.on('end',onStreamEnd);
                //     readStream.on('close',onStreamClose);
                //     readStream.on('error',onStreamError);
                // }


                /* outputs a file to the client browser */
                function writeFile(fileLocation, contentType, fileSize, callback) {
                    var readStream = fs.createReadStream(fileLocation);
                    // ReadStream event handlers //

                    // function onStreamData() {
                    //     var content = ;
                    // }

                    function onStreamEnd() {
                        if (!socket.writable) {
                            isKeepAlive = false;
                            cleanUpAndClose();
                            return;
                        }
                        console.log('Read a total of ' + fileSize + ' bytes from ' + fileLocation + '\n');
                        //socket.write('\r\n');
                        cleanUpAndClose();
                        if (callback)
                            callback();
                    }

                    function onStreamClose() {
                        //console.log('File ' + fileLocation +' is closed.\n');
                    }

                    function onStreamError() {
                        console.log('Error reading the file... \n');
                        readStream.destroy();
                        reportError(500,"Unable to open file",callback);
                    }

                    function onStreamOpen() {
                        //console.log('Opening the file...\n');
                    }
                    // add event listeners
                    readStream.on('open',onStreamOpen);
                    //readStream.on('data',onStreamData);
                    readStream.on('end',onStreamEnd);
                    readStream.on('close',onStreamClose);
                    readStream.on('error',onStreamError);

                    writeHeader(200,'OK',contentType,fileSize, buildDefaultHeaders(), function () {
                        console.log('writeHeader callback');
                        if (!socket.writable) {
                            isKeepAlive = false;
                            cleanUpAndClose();
                            return;
                        }
                        console.log('contentType: ' + contentType);
                        console.log('contentType: ' + fileSize);
                        socket.write('\r\n', function() {
                            readStream.pipe(socket,{end:false});
                        });
                    });
                }

                /* writes a header */
                function writeHeader(code, message, contentType, contentSize, headers, callBackFunction) {
                    var content = 'HTTP/1.1 ' + code + ' ' + message + '\r\n';
                    if (!socket.writable) {
                        isKeepAlive = false;
                        cleanUpAndClose();
                        return;
                    }

                    if (code === 200)
                        numOfSuccessfulRequests++;


                    if (!headers) {
                        reportError(500,'BUG');
                        return;
                    }

                    headers['Content-Type'] = contentType;
                    if (!headers['Host'])
                        headers['Host'] = socket.address().address;


                    for (var header in headers)
                        if (headers.hasOwnProperty(header) && headers[header])
                            content += header + ': ' + headers[header] + '\r\n';

                    content += 'Content-Length: '+ contentSize + '\r\n';

                    //console.log('response content:\n' + content);

                    //console.log('Content: ' + content);

                    socket.write(content, callBackFunction);
                }

                function parseData(data) {
                    //console.log('---------data: ' + data);

                    var parsedData = {};
                    var bodyLengthRemaining = 0;

                    //console.log('Data received:' + '\n' + data + '\n');

                    dataCollectedSoFar += data.toString();

                    if (dataCollectedSoFar.length >= settings.MAX_MESSAGE_SIZE) {
                        reportError(413,'HTTP Request exceeds 10MB - blocked due to security reasons');
                        return;
                    }
                    //a new line within a certain amount of time
                    if (dataCollectedSoFar.indexOf('\r\n\r\n') === -1) {
                        return;
                    } else if (!parsedHeader['Method']) {
                        parsedHeader = parseHeader(dataCollectedSoFar.slice(0, dataCollectedSoFar.indexOf('\r\n\r\n')));
                        bodyCollectedSoFar = dataCollectedSoFar.slice(dataCollectedSoFar.indexOf('\r\n\r\n') + '\r\n\r\n'.length);
                    } else {
                        bodyCollectedSoFar += data.toString();
                    }

                    if (!parsedHeader['Method']) {
                        return;
                    }

                    if (mutex.sizeOfQueue() >= settings.MAX_REQUESTS_PER_CONNECTION) {
                        reportError(503,'Too many requests from the same connection.');
                        return;
                    }
                    if (parsedHeader['Method']==='GET') {
                        mutex.lock(parsedHeader, function (header) {
                            numOfCurrentRequests++;
                            numOfTotalRequests++;
                            numOfSocketRequests++;
                            that.emit('request');
                            respond(header, function() {
                                mutex.unlock();
                            });
                        });

                        dataCollectedSoFar = bodyCollectedSoFar;
                        bodyCollectedSoFar = '';
                        parsedHeader = {};
                        parseData('');
                        // return;
                    } else {//POST
                        bodyLengthRemaining = parsedHeader['content-length'] - bodyCollectedSoFar.length;

                        if (bodyLengthRemaining <= 0) {
                            if (bodyLengthRemaining === 0) {
                                parsedData = parseBody(bodyCollectedSoFar, parsedHeader);
                                mutex.lock(parsedData, function (header) {
                                    numOfCurrentRequests++;
                                    numOfTotalRequests++;
                                    numOfSocketRequests++;
                                    that.emit('request');
                                    respond(header, function () {
                                        mutex.unlock();
                                    });

                                });
                                dataCollectedSoFar = '';
                                parsedHeader = {};
                            } else {
                                parsedData = parseBody(bodyCollectedSoFar.slice(0, bodyLengthRemaining), parsedHeader);
                                //data for next request
                                dataCollectedSoFar = dataCollectedSoFar.slice(bodyLengthRemaining);
                                mutex.lock(parsedData, function (header) {
                                    numOfCurrentRequests++;
                                    numOfTotalRequests++;
                                    numOfSocketRequests++;
                                    that.emit('request');
                                    respond(header, function () {
                                        mutex.unlock();
                                    });
                                });
                                parsedHeader = {};
                                parseData('');
                            }
                        }
                    }
                }
                /*Returns an object containing all the information about the HTTP request in the initial line and headers.
                 The object maps strings to strings for all fields. Note: all headers are lower-case strings!*/
                function parseHeader(data) {
                    //console.log('parsing request header');
                    //console.log('data: ' + data);
                    var parsedData = {};
                    var splitLine = '';
                    var splitDataLines = data.split('\r\n');
                    var splitInitialLine = splitDataLines[0].split(' ');

                    var headerName = '';
                    var headerValue = '';
                    var length = 0;

                    var splitURI;

                    // check maximum header size
                    if(data.length >= settings.MAX_HEADER_SIZE) {
                        reportError(413,'Header is limited to 8KB');
                        return {};
                    }

                    // check maximum string size of the first line
                    if(splitDataLines[0].length >= settings.MAX_STRING_LENGTH) {
                        reportError(414,'Initial line (probably URI) is too long');
                        return {};
                    }
                    //check initial line has exactly 3 arguments
                    if (splitInitialLine.length!==3) {
                        console.log('Request in invalid format.('+socketId+')');
                        reportError(400, 'Request in invalid format. Initial line does not have exactly 3 arguments (has only '+ splitInitialLine.length+')');
                        return {};
                    }

                    //check method is GET or POST
                    if (splitInitialLine[0]!=='GET' && splitInitialLine[0]!=='POST') {
                        console.log('Request in invalid format. Method is: ' + splitInitialLine[0]);
                        reportError(405, 'Request method must be GET or POST.');
                        return {};
                    }

                    if (splitInitialLine[2].trim()!=='HTTP/1.0' && splitInitialLine[2].trim()!=='HTTP/1.1') {
                        console.log('Request in invalid format. HTTP/[Ver] is: ' + splitInitialLine[2]);
                        reportError( 505, 'HTTP version is not supported or note specified correctly');
                        return {};
                    }

                    parsedData['Method'] = splitInitialLine[0];
                    splitURI = decodeURIComponent(splitInitialLine[1]).toString().split('?');

                    parsedData['RequestURI'] = splitURI[0];//get the URI itself (without url parameters
                    if(splitURI.length > 1) {
                        parsedData['URIParameters'] = splitURI[1];//get the URI itself (without url parameters
                    }
                    parsedData['HttpVersion'] = splitInitialLine[2].slice('HTTP/'.length);

                    //console.log('hi');
                    //request headers
                    for (var i = 1; i < splitDataLines.length; ++i) {


                        headerValue = splitDataLines[i].toString();

                        // check maximum string size of the first line
                        if(headerValue.length >= settings.MAX_STRING_LENGTH) {
                            reportError(413,'Header field is too big');
                            return {};
                        }
                        //console.log('firstChar' + headerValue[0]);
                        if(i > 1 && (headerValue[0] === '\t' || headerValue[0] === ' ' )) {
                            if(headerValue.match(new RegExp('[:]'))) {
                                reportError(400,'Invalid Header structure (1)');
                                return {};
                            }
                            // join this value to the previous header
                            headerValue = headerValue.replace(/^\s+|\s+$/g,'');
                            parsedData[headerName] += headerValue;
                            continue;
                        }
                        splitLine = splitDataLines[i].split(':');

                        if(splitLine.length < 2) {
                            reportError(400,'Invalid Header structure (2) on line: '+splitDataLines[i]);
                            return {};
                        }

                        headerName = splitLine[0].toString().toLocaleLowerCase();
                        headerValue = splitLine[1].toString();

                        if(headerName.length < 1 || headerValue.length < 1) {
                            reportError(400,'Invalid Header structure (3)');
                            return {};
                        }

                        if(headerName.match(new RegExp('\\s|\\t'))) {
                            reportError(400,'Invalid Header structure (4)');
                            return {};
                        }

                        headerValue = headerValue.replace(/^\s+|\s+$/g,'');
                        //headerValue.replace(' ','');
                        //headerValue.replace('\t','');

                        //parsedData[splitLine[0].toString().toLowerCase()] = splitLine[1].trim();
                        parsedData[headerName] = headerValue;
                    }

                    //if POST, check for Content-Length header

                    if (splitInitialLine[0] === 'POST') {
                        length = parsedData['content-length'];
                        if (!length || parseFloat(length) != parseInt(length) || parseInt(length) < 0) {
                            console.log('Request in invalid format. Method type is POST and no Content-Length was specified.');
                            reportError(411, 'POST method requires Content-length header');
                            return {};
                        }
                    }

                    // if exist, validate "connection" header.

                    if(parsedData['connection']) {
                        if( parsedData['connection'] !== 'close' &&  parsedData['connection'].toString().toLowerCase() !== 'keep-alive') {
                            console.log('Connection header is invalid: '+parsedData['connection']);
                            reportError(400, 'Invalid Connection header');
                            return {};
                        }
                    }

                    return parsedData;
                }

                function parseBody(data, parsedHeader) {
                    //console.log('parsing request body');
                    //var parsedData = parsedHeader;
                    parsedHeader['RequestBody'] = data;
                    return parsedHeader;
                }



                // Socket event handlers

                function onSocketConnected() {
                    //console.log('Socket (' + socketId + ') connection successfully established at: '+new Date().getTime()+' .\n');
                }

                function onSocketData(data) {
                    //console.log('---------data: ' + data);
                    //if shutting down, don't allow new requests:
                    if (!shuttingDown)
                        parseData(data);
                }

                function onSocketEnd() {
                    //console.log('The client-side has requested to close the connection (' + socketId + ')\n');
                    //isSocketActive = false;

                    isKeepAlive = false;
                    cleanUpAndClose();

                    /*
                     if(isSocketActive) {
                     isKeepAlive = false;
                     }
                     else {
                     socket.end();
                     socket.destroy();
                     }
                     */
                }

                function onSocketError(e) {
                    console.log('Socket ('+ socketId+') Error\n');
                    console.log('Error is: ' + e.message);
                    cleanUpAndClose();
                }

                function onSocketTimeout() {
                    if(socket.writable) {
                        //console.log('Socket ('+socketId+') Timeout at: '+new Date().getTime()+' \n');
                        isKeepAlive = false;
                        reportError(408,'Timeout');
                        //cleanUpAndClose();
                    }

                }

                function onSocketClose(had_error) {
                    //console.log('Socket ('+socketId+') is closed for file:' + activeFileName + (had_error ? ' due to an error' : '') + '\n');
                    //socket.setTimeout(0);
                }

                function onSocketDrain() {
                    //console.log('Socket is drained\n');
                }

                // add socket event listeners...

                socket.on('connect', onSocketConnected);
                socket.on('data', onSocketData);
                socket.on('end', onSocketEnd);
                socket.on('error',onSocketError);
                socket.on('timeout',onSocketTimeout);
                socket.on('drain',onSocketDrain);
                socket.on('close',onSocketClose);
                socket.setTimeout(settings.LAST_REQUEST_TIMEOUT_SEC * 1000);
            }


            function onServerClose() {
                // This handler is just for debugging.. should not be executed at any time
                //console.log('Server was unexpectedly closed - terminating program\n');
                //throw {msg : 'Server stopped without an explicit order'};
                //console.log("Server has finished closing...!");
                port = null;
                isStarted = false;
                shuttingDown = false;
                //that.stopServer(callBack);
            }

            function onServerListening() {
                console.log('Server is listening on port ' + port + '\n');
                this.isStarted = true;
                if(callBack) {
                    callBack();
                }
            }

            function onServerError(e) {
                console.log('The server has encountered an error: '+e.message+'\n');
                //throw {msg : 'Internal server error \n'};
               that.stopServer();
               if(callBack)
                callBack();
            }

            // add server event listeners...
            server.on('connection',onServerConnection);
            server.on('error',onServerError);
            server.on('listening',onServerListening);
            server.on('close',onServerClose);
            // start listening...
            server.listen(parseInt(port));
            that.emit('start');
        };

        //TODO important! need to call shutDownServer() from somewhere else when numOfCurrentRequests===0
        this.stopServer = function () {
            console.log('Stopping server activity at port: ' + port);
            //stop accepting new requests and wait till we're finished with all current requests
            shuttingDown = true;

            console.log('numOfCurrentRequests = ' + numOfCurrentRequests);

            if (numOfCurrentRequests===0) {
                shutDownServer();
            }
        };

        function shutDownServer() {
            console.log('shutDownServer() called');
            try{
                console.log("Trying to shut down the server...");
                server.close();
            }
            catch(e) {
                console.log('myHttp Exception: ' + e.message);
                port = null;
                isStarted = false;
                console.log("Server shut down!");
            }
            finally {
                shuttingDown = false;
            }
        }

        this.status = function () {
            return {
                isStarted: isStarted,
                startedDate: startedTime,
                port: port,
                resourceMap: resourceMap,
                numOfCurrentRequests: numOfCurrentRequests,
                precntageOfSuccesfulRequests: (numOfTotalRequests === 0) ? 0 : (numOfSuccessfulRequests / numOfTotalRequests * 100)
            };
        };

        this.onStart = function (callback) {
            that.on('start', callback);
        };

        this.any = function (resource, callBackObject) {
            if (!callBackObject || !(callBackObject.call)) return;//throw new Error("Can't register an empty callback method");
            if (!resource || (resource.toString())[0] !== '/') return;//throw new Error("Invalid resource key");
            requestMapGet[resource] = callBackObject;
            requestMapPost[resource] = callBackObject;
        };

        this.get = function (resource, callBackObject) {
            if (!callBackObject ||  !(callBackObject.call)) return;//throw new Error("Can't register an empty callback method");
            if (!resource || (resource.toString())[0] !== '/') return;//throw new Error("Invalid resource key");
            requestMapGet[resource] = callBackObject;
        };

        this.post = function (resource, callBackObject) {
            if (!callBackObject ||  !(callBackObject.call)) return;//throw new Error("Can't register an empty callback method");
            if (!resource || (resource.toString())[0] !== '/') return;//throw new Error("Invalid resource key");
            requestMapPost[resource] = callBackObject;
        };

        this.allSessions = {};
    }

    util.inherits(Server, events.EventEmitter);

    return new Server();
}

exports.createHTTPServer = createHTTPServer;
