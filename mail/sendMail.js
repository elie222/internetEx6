/**
 * Created with JetBrains WebStorm.
 * User: DOM
 * Date: 18/01/13
 * Time: 17:08
 * To change this template use File | Settings | File Templates.
 */
var mail = require('./include');

var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';
var settings = require('./settings');
var tagOrComment = new RegExp(
    '<(?:'
    // Comment body.
    + '!--(?:(?:-*[^->])*--+|-?)'
    // Special "raw text" elements whose content should be elided.
    + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
    + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
    // Regular name
    + '|/?[a-z]'
    + tagBody
    + ')>',
    'gi');


function removeTags(html) {
  var oldHtml;
  do {
    oldHtml = html;
    html = html.replace(tagOrComment, '');
  } while (html !== oldHtml);
  return html.replace(/</g, '&lt;');
}

var Encoder = require('./encoder').Encoder;

exports.callBack = {call: function (request, response, parameters) {
    //console.log(request);
    //console.log('SENDMAIL CALLBACK');
    var encoder = new Encoder('entity');
    var emailObj = {
        from: mail.login.validate(request, response),
        to: request.parameters.to,
        //subject: removeTags(request.parameters.subject),
        //body: removeTags(request.parameters.body),
        subject: encoder.htmlEncode(request.parameters.subject,true),
        body: encoder.htmlEncode(request.parameters.body,true),
        arrivalDate: new Date()
    };
    //console.log("html decoded");
    if(emailObj.subject &&  emailObj.subject.toString().length > settings.MAX_SUBJECT_LENGTH) {
        response.status = 200;
        response.end('Subject is too big (up to 200 characters are allowed)');
    }
    else if (request.getPublicMemory().users[emailObj.from] && request.getPublicMemory().users[emailObj.to]) {
        request.getPublicMemory().users[emailObj.from].sent.push(emailObj);
        request.getPublicMemory().users[emailObj.to].mails.push(emailObj);
        response.status = 200;
        response.end('Email successfully sent!');
        //return;
    }
    else {
        //console.log('Error sending email. Receiver: ' + emailObj.to + ' or sender: ' + emailObj.from + ' does not exist.');
        response.status = 200;
        response.end('Sender or receiver does not exist.');
    }
    /*
    response.status = 404;
    response.end('Sender or receiver does not exist.');
    */
}};