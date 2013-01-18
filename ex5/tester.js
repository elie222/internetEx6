var myHttp = require("./../myHttp");
var http = require('http');

var port = 8888;
var resourceMap = {
    '/hi': '/a',
    '/': '/profile.html',
};
//var rootFolder = 'C:\\Users\\LEO\\Documents\\HUJI\\Internet Technologies\\hw4\\www';
var rootFolder = '/Users/Elie2/WebstormProjects/internet_hw5/www';

var server = myHttp.createHTTPServer(resourceMap, rootFolder);

//======================================================================================================
// TEST 1
// Usage: go to localhost:8888/ajaxTest.html
// Ajax/jQuery test. The HTML page asks the user to enter a name and using AJAX, our server
// tells the user what his name is backwards. eg. Eliezer becomes Rezeile. The HTML page sends a GET
// reuqest to '/testOneAjax' with the user's name as a parameter. For 'testOneAjax' we defined a
// callback object (callbackObjAjax) whose call function receives a request parameter, reverses it and
// sends it back in the response body. The HTML page then displays this on screen.
//======================================================================================================
var callbackObj1 = {call: function (request, response, parameters) {
    console.log('---------TEST ONE - AJAX/JQUERY TEST--------');

    var nameBackwards = request.parameters.key.split("").reverse().join("").toLowerCase();
    var responseBody = nameBackwards.charAt(0).toUpperCase() + nameBackwards.slice(1);

    response.write(responseBody);
    response.end();
}
};

//======================================================================================================
// TEST 2
// Go to localhost:8888/test/two/James/David
// Tests a parametrized GET request. When we receive a request of the form:
// '/test/two/:person1/:person2', the server responds with an HTML that says: 'person1 says hi to
// person2'. We also print the request object to the console to check that everything is in order with
// the request object.
//======================================================================================================
var callbackObj2 = {call: function (request, response, parameters) {
    console.log('---------TEST TWO--------');

    console.log('printing request.method: ' + request.method);
    console.log('printing request.resource: ' + request.resource);
    console.log('printing request.body: ' + request.body);

    console.log('printing request.headers:');
    for (var property in request.headers) {
        console.log(property + ': ' + request.headers[property]);
    }

    console.log('printing request.parameters:');
    for (var property in request.parameters) {
        console.log(property + ': ' + request.parameters[property]);
    }

    response.write('<html><body><h1>' + parameters['person1']);
    response.write(' says hi to ' + parameters['person2'] + '</h1>');
    response.end('</body></html>');
}
};

//======================================================================================================
// TEST 3
// Usage: go to localhost:8888/postTest.html
// Tests that we correctly receive the request parameters of a POST request. Same test as
// above, except that person1 and person 2 are now taken from the POST body instead of the url. Uses 
// jQuery to send the post request. Also, AJAX. It's basically a combination of tests one and two that
// tests POST requests.
//======================================================================================================
var callbackObj3 = {call: function (request, response, parameters) {
    console.log('---------TEST THREE--------');

    console.log('printing request.method: ' + request.method);
    console.log('printing request.resource: ' + request.resource);
    console.log('printing request.body: ' + request.body);

    console.log('printing request.headers:');
    for (var property in request.headers) {
        console.log(property + ': ' + request.headers[property]);
    }

    console.log('printing request.parameters:');
    for (var property in request.parameters) {
        console.log(property + ': ' + request.parameters[property]);
    }

    response.write('<html><body><h1>' + request.parameters.person1);
    response.write(' says hi to ' + request.parameters.person2 + '</h1>');
    response.end('</body></html>');
}
};

//------------

server.onStart(function () {
    console.log('onStart callback test.');
    
    server.any('/test/one', callbackObj1);
    server.get('/test/two/:person1/:person2', callbackObj2);
    server.post('/test/three', callbackObj3);

    server.any('/stopServer', {call: function (request, response, parameters) {
        response.write('<html><body><h1>Stopping Server');
        response.end('</h1></body></html>');
        server.stopServer();
    }
    });
});

server.startServer(port);
