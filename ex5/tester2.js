// test
var http = require('./../myHttp');

var port = 8888;
var resourceMap = {
    '/': '/profile.html',
    'cookie1' : '/profile.html'

};
//var rootFolder = '/cs/stud/es222/workspace/internet/ex5/www';
//var rootFolder = 'C:\\Users\\LEO\\Documents\\HUJI\\Internet Technologies\\hw5\\repository\\internet_hw5\\www'; // Leonid's path (comment - but don't delete)
//var rootFolder = 'D:\\Leonid\\internet\\hw5\\internet_hw5\\www';
var rootFolder = '/Users/Elie2/WebstormProjects/internet_hw5/www';

var server = http.createHTTPServer(resourceMap, rootFolder);

server.onStart(function () {
    console.log('onStart called');
});

var callbackObject1 = {call: function (request, response, parameters) {
    console.log('---------callbackObject1--------\n');
    console.log('parameters[0] is: ' + parameters[0]);
}
}; 

var callbackObject2 = {call: function (request, response, parameters) {
    console.log('---------callbackObject2--------\n');
    response.headers.From = 'hello@hello.com';
    response.headers['Content-Type'] = 'html';
    response.headers['Accept-Ranges'] = '';
    response.headers['Content-Length'] = 0;
    response.headers['Host'] = '';
    response.write('<html><body><h1>Hello ');
    response.end('World </h1></body></html>');
}
};

var timeoutTest = {call: function (request,response,parameters) {
    console.log('timeout test');
    var x = 0;
    // large loop...
    for(var i = 0; i < 10000000; i++) x+=3;
}
}; 

var callbackObject4 = {call: function (request,response,parameters) {
    console.log('------------callbackObject4------------\n');
    // test for modifying headers....
    response.headers.From = 'hello@hello.com';
    response.headers['Content-Type'] = 'html';
    response.headers['Accept-Ranges'] = '';
    response.headers['Content-Length'] = 0;
    response.headers['Host'] = '';
    // test for modifying status code...
    response.status = 404;

    response.write('<html><body><h1>Hello ');
    response.end('World </h1></body></html>');
}
};

var callbackObject5 = {call: function (request,response,parameters) {
    console.log('------------callbackObject5------------\n');

    //console.log('parameters[0]: ' + parameters[0]);

    // test for modifying headers....
    response.headers.From = 'hello@hello.com';
    response.headers['Content-Type'] = 'html';
    response.headers['Accept-Ranges'] = '';
    response.headers['Content-Length'] = 0;
    response.headers['Host'] = '';
    // test for modifying status code...
    response.status = 404;

    response.write('<html><body><h1>' + parameters[0]);
    response.end(' says Hi! </h1></body></html>');
}
};

var callbackObject6 = {call: function (request,response,parameters) {
    console.log('------------callbackObject6------------\n');

    //console.log('parameters[0]: ' + parameters[0]);
    //console.log('parameters[1]: ' + parameters[1]);
    //console.log('parameters[2]: ' + parameters[2]);

    console.log('printing request.method: ' + request.method);
    console.log('printing request.resource: ' + request.resource);
    console.log('printing request.body: ' + request.body);

    console.log('printing request.headers: ');
    for (var property in request.headers) {
        console.log(property + ': ' + request.headers[property]);
    }

    console.log('printing request.parameters: ');
    for (var property in request.parameters) {
        console.log(property + ': ' + request.parameters[property]);
    }

    // test for modifying headers....
    response.headers.From = 'hello@hello.com';
    response.headers['Content-Type'] = 'html';
    response.headers['Accept-Ranges'] = '';
    response.headers['Content-Length'] = 0;
    response.headers['Host'] = '';
    // test for modifying status code...
    response.status = 404;

    response.write('<html><body><h1>' + parameters[0]);
    response.write(' says hi to ' + parameters[1] + '</h1>');
    //assuming request if of form: http://localhost:8888/photos/moshe/david?key1=val1&key2=val2
    response.write('<p>request.parameters.key1 is: ' + request.parameters.key1 + '</p>');
    response.write('<p>request.parameters.key2 is: ' + request.parameters.key2 + '</p>');
    response.end('</body></html>');
}
};

var cookieTest1 = {call: function (request,response,parameters) {
    // add good cookies
    response.addCookie({
       'key' : 'user' ,
        'value' : 'kuki' ,
        'path' : '/'
    });
    response.addCookie({
        'key' : 'photoid' ,
        'value' : '123' ,
        'path' : '/',
        'domain' : '',
        'httpOnly' : true
    });
    response.addCookie({
        'key' : 'email' ,
        'value' : 'kiki@mail.com' ,
        'path' : '/',
        'expire' : new Date()
    });
    // add partial cookies
    response.addCookie({
        'key' : 'email2' ,
        'value' : 'kiki@mail.com'
    });
    // override existing cookie
    response.addCookie({
        'key' : 'email2' ,
        'value' : 'kiki2@mail.com'
    });
    response.end('Cookie set!');
}};

var cookieTest2 = {call: function (request,response,parameters) {
    // add bad cookie
    response.addCookie({
        'value' : 'kuki' ,
        'path' : '/'
    });
    response.end('Cookie set!');
}};

var cookieTest3 = {call: function (request,response,parameters) {
    // delete a cookie
    response.deleteCookie('user');
    // delete the same cookie again
    response.deleteCookie('user');
    // delete unexsiting cookie
    response.deleteCookie('bla');
    // add and delete the same cookie
    response.addCookie({
       'key':'bla2',
        'value' : 'hello'
    });
    response.deleteCookie('bla2');
    response.end('Cookie deleted!');
}};

var cookieTest4 = {call: function (request,response,parameters) {
    // get cookies from the client:
    var cookies = request.getCookies();
    console.log('Got the following cookies: \n');
    for(var i in cookies) {
        console.log('key = '+cookies[i].key + ' , value = '+cookies[i].value);
    }
    response.end('Got Cookies!!');
}};

var sessionTest1 = {call: function (request,response,parameters) {
    var session = request.getSession();
    session.myVar = 'hello'
    response.end('session set!');
}};

var sessionTest2 = {call: function (request,response,parameters) {
   var myVar = request.getSession().myVar;
    response.end('myVar is: '+ myVar);
}};

//server.get('/profile.html', callbackObject1);
//server.get('/index.html', callbackObject2);
 server.any('/timeout', timeoutTest);
 server.any('/cookie1', cookieTest1);
 server.any('/cookie2', cookieTest2);
 server.any('/cookie3', cookieTest3);
 server.any('/cookie4', cookieTest4);
 server.any('/session1', sessionTest1);
 server.any('/session2', sessionTest2);
 //server.post('/profile.html', callbackObject3);
//server.post('/post.html', callbackObject4);

//server.get('/photos/:user', callbackObject5);//parametrized request test. go to: 'http://localhost:8888/photos/Moshe' to test
//server.get('/photos/:user/:friend', callbackObject6);//parametrized request test. go to: 'http://localhost:8888/photos/Eliezer/Leonid' to test
//server.get('/photos/:user/sayHelloTo/:friend', callbackObject6);

server.startServer(port);
