/**
 * Created with JetBrains WebStorm.
 * User: LEO
 * Date: 20/01/13
 * Time: 16:06
 * To change this template use File | Settings | File Templates.
 */

//note: localStorage['emailsArray'] are the user's unsent offline emails.
//      localStorage['usersEmails.inbox'] is the user's received emails.
//      localStorage['usersEmails.outbox'] is the user's sent emails.
//      localStorage['loggedInUsername'] is the username of the logged in person. 

var box = 'inbox';
var REFRESH_RATE_SEC = 1;// TODO: use settings.js or something...
var RETRY_SENDING_EMAILS_SEC = 3;

function supports_html5_storage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}

$(document).ready(function () {
    $.get('/mail/getLoggedInUsername', function (data, status) {
        if(status === "success") {
            if (supports_html5_storage()) {
                localStorage['loggedInUsername'] = data;
            }
            $('#userDetails').html('Welcome Back ' + data + '!');
        } else {
            window.location.href = "welcome.html";
        }
    }).fail(function (xhr, textStatus, errorThrown) {
        if (supports_html5_storage()) {
            if (localStorage['loggedInUsername']) {
                $('#userDetails').html('Welcome Back ' + localStorage['loggedInUsername'] + '!');
            } else {
                window.location.href = "welcome.html";
            }
        }
    });


    (function poll() {
        setTimeout(function () {
            console.log('poll');
           // $.post('/mail/mailList', {}, function (data, status) {
            $.post('/mail/mailList/'+box, {}, function (data, status) {
                if(status === "success") {
                    if(data === "FAIL") {
                        window.location.href = 'welcome.html';
                    }
                    else {
                        if (supports_html5_storage()) {
                            localStorage['usersEmails.' + box] = data;
                        }
                        $('#list').html(data);
                    }
                }
                else {
                    window.location.href = 'welcome.html';
                }
                poll();
            }).fail(function (xhr, textStatus, errorThrown) {
                console.log('failed getting mailList');
                if (supports_html5_storage()) {
                    if (localStorage['usersEmails.'+box]) {
                        console.log('box: ' + box);
                        $('#list').html(localStorage['usersEmails.'+box]);
                    } else {
                        $('#list').html(localStorage['usersEmails.outbox'] = "<tr><th style=\"width:30px\">"+((box === 'mails')?('From'):('To'))+"</th><th style=\"width:100px\">Arrival Date:</th><th style=\"width:200px\">  Subject</th><th style=\"width:50px\">Actions</th></tr>");
                    }
                }
                poll();
            });
        }, REFRESH_RATE_SEC * 1000);
    })();

    $("#sendEmailForm").submit(function (event){
        event.preventDefault();

        $.ajax({
            type: 'POST',
            url: '/mail/sendEmail',
            data: $(this).serialize(),
            success: function (data, status) {
                if (status === "success" && data === "Email successfully sent!") {
                    //alert('Your email has been successfully sent.');//TODO can remove this and just print a message on the mail.html page. alerts are annoying.
                    buttonPushed('backToMailbox');
                    $("#errorMessage").show();
                    $("#errorMessage").html(data);
                    $("#errorMessage").css('background-color','green');

                }
                else {
                    //alert(data);
                    $("#errorMessage").show();
                    $("#errorMessage").html(data);
                    $("#errorMessage").css('background-color','red');
                }
                //this resets the compose mail form for the next email
                $("input[name=to]").val('');
                $("input[name=subject]").val('');
                $("textarea[name=body]").val('');
            },
            error: function (xhr, textStatus, error) {
                console.log(JSON.stringify(xhr));
                console.log(JSON.stringify(textStatus));
                console.log(JSON.stringify(error));

                if (xhr.status===404) {
                    $("#errorMessage").show();
                    $("#errorMessage").html("User does not exist");
                    $("#errorMessage").css('background-color','red');
                    return;
                }

                $("#errorMessage").show();
                $("#errorMessage").html('There was a problem sending the email because you are offline. We\'ll retry to send the email every ' + RETRY_SENDING_EMAILS_SEC + ' seconds.\nYou will receive an alert when all your offline emails have been successfully sent.');
                $("#errorMessage").css('background-color','red');
                //alert('There was a problem sending the email because you are offline. We\'ll retry to send the email every ' + RETRY_SENDING_EMAILS_SEC + ' seconds.\nYou will receive an alert when all your offline emails have been successfully sent.');
                //save emails
                if (supports_html5_storage) {
                    console.log('Storing emails locally.');
                    var emailsArray = [];
                    var email = {
                        to: $("input[name=to]").val(),
                        subject: $("input[name=subject]").val(),
                        body: $("textarea[name=body]").val()
                    };
                    if (localStorage['emailsArray']) {
                        var emailsArray = JSON.parse(localStorage['emailsArray']);
                    }
                    emailsArray.push(email);
                    localStorage['emailsArray'] = JSON.stringify(emailsArray);

                    buttonPushed('backToMailbox');
                    //this resets the compose mail form for the next email
                    $("input[name=to]").val('');
                    $("input[name=subject]").val('');
                    $("textarea[name=body]").val('');
                } else {
                    alert('There was an error sending the email. Your browser doesn\'t support HTML5 storage.');
                }

                //try sending the emails every 3 secs till successfully sent. Then delete email from local storage
                (function sendOfflineEmails() {
                    setTimeout(function () {
                        console.log('Attempting to send all offline emails.');
                        var oldEmailsArray = [];
                        var newEmailsArray = [];
                        var poppedEmail = {};
                        if (localStorage['emailsArray']) {
                            var oldEmailsArray = JSON.parse(localStorage['emailsArray']);
                        }
                        while (oldEmailsArray.length!==0) {
                            poppedEmail = oldEmailsArray.shift();

                            $.ajax({
                                type: 'POST',
                                url: '/mail/sendEmail',
                                data: poppedEmail,
                                async: false,
                                success: function (data, status) {
                                    if (status === 'success') {
                                        console.log('Successfully sent offline email. Deleting local storage of email.');
                                        alert('All the emails you sent while offline have been successfully sent.');                            
                                    }
                                },
                                error: function (xhr, textStatus, error) {
                                    newEmailsArray.push(poppedEmail);
                                }
                            });
                        }
                        localStorage['emailsArray'] = JSON.stringify(newEmailsArray);
                        
                        if (newEmailsArray.length!==0) {
                            //try sending again in another 3 seconds.
                            console.log('Failed to send offline emails. Will retry in '+RETRY_SENDING_EMAILS_SEC+' seconds.');
                            sendOfflineEmails();
                        }
                    }, RETRY_SENDING_EMAILS_SEC * 1000);
                })();
            }
        });
    });

    $(function() {
        var cache = {};
        $( "#people" ).autocomplete({
            //source: "/mail/getAllUsers",
            source: function (request, response) {
                var term = request.term;
                if (term in cache) {
                    response(cache[term]);
                    return;
                }

                $.getJSON("/mail/getAllUsers", request, function (data, status, xhr) {
                    cache[term] = data;
                    response(data);
                });
            },
            minLength: 1
        });
    });
});

function deleteMail(id) {
    $.post('/mail/deleteMail',{id: id}, function (data, status) {
        if(status === 'success') {
            if('data' === 'FAIL') {
                window.location.href = "welcome.html";
            }
        }
        else {
            window.location.href = "welcome.html";
        }
    }).fail(function (xhr, textStatus, errorThrown) {
        alert('Currently offline. Cannot delete emails while offline.');
    });
}

function readMail(id) {
    $(".fullScreen").hide();
    $("#showMail").show();

    // fill-in data:
    $("#mailHeader").html("" +
        "<table id='headerContent'>" +
            "<tr>" +
                "<td style='width:150px'><u>From:</u> </td><td>"+mails[id].from+"</td>" +
            "</tr><tr>"+
                "<td style='width:150px'><u>To:</u> </td><td>"+mails[id].to+"</td>" +
             "</tr><tr>"+
                "<td style='width:150px'><u>Arrival Time:</u> </td><td>"+mails[id].arrivalDate+"</td>" +
            "</tr>" +
        "</table>" +
    "");

    // convert new line into <br>
    //alert(mails[id].body);
    mails[id].body = mails[id].body.replace(/(&#13;)/gm,"<br>");
    $("#mailSubject").html("<div id='subjectContent'>"+mails[id].subject+"</div>");
    $("#mailBody").html("<div id='bodyContent'>"+mails[id].body+"</div>");
    $("#mailReply").click(function() {
        replyMail(id);
    });
}

function replyMail(id) {
    var decodedBody = $("<div/>").html(mails[id].body).text();
    $(".fullScreen").hide();
    $("#composeDialog").show();
    $("input[name=to]").val(mails[id].fromUsername);
    $("input[name=subject]").val('Re: ' + mails[id].subject);
    $("textarea[name=body]").val('\r\n\r\n'+
        '---------------------------\r\n' +
        mails[id].from+' originally wrote: \r\n'+
        '---------------------------\r\n' +
        decodedBody);
}

function logout() {
    //alert user about unsent offline emails
    console.log('logging out.');
    if (localStorage['emailsArray']) {
        var emailsArray = JSON.parse(localStorage['emailsArray']);
        if (emailsArray.length!==0) {
            var r = confirm('You have ' + emailsArray.length + ' unsent emails that you attempted to send while offline. If you logout, these emails will not be sent and will be deleted.\nAre you sure you wish to log out?');
            if (r) {
                completeLogout();
            }
        }
    }
    completeLogout();
}

function completeLogout() {
    localStorage.clear();
    window.location.href='logout';
    deleteAllCookies();
}

function deleteAllCookies() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

function buttonPushed(button, id) {
    $("#errorMessage").hide();
    if (button === 'composeNewEmail') {
        $(".fullScreen").hide();
        $("#composeDialog").show();
    }
    else if (button === 'backToMailbox') {
        box  = 'inbox';
        $("#fromTo").text('From');
        $(".fullScreen").hide();
        $("#mailList").show();
    }
    else if(button === 'showSentItems') {
        box  = 'outbox';
        $("#fromTo").text('To');
        $(".fullScreen").hide();
        $("#mailList").show();
    } else {
        console.log(button+' is not a button name.');
    }
}