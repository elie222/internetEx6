/**
 * Created with JetBrains WebStorm.
 * User: LEO
 * Date: 16/01/13
 * Time: 22:34
 * To change this template use File | Settings | File Templates.
 */
var myHttp = require("./myHttp");


var rootFolder = 'C:\\Users\\LEO\\Documents\\HUJI\\Internet Technologies\\hw6\\internetEx6\\www';
//var rootFolder = '/Users/Elie2/WebstormProjects/internet_hw5/www';


var port = 8888;
var resourceMap = {
    '/': 'mail/welcome.html'
};

var server = myHttp.createHTTPServer(resourceMap, rootFolder);
server.startServer(port);