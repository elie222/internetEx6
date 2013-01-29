/**
 * Created with JetBrains WebStorm.
 * User: LEO
 * Date: 20/01/13
 * Time: 16:06
 * To change this template use File | Settings | File Templates.
 */
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
        //console.log('getLoggedInUsername working!');
        if(status === "success") {
            $('#userDetails').html('Welcome Back ' + data + '!');//TODO atm data is the username. We can change this to the user's first name.
        } else {
            window.location.href = "welcome.html";
        }
    }).fail(function (xhr, textStatus, errorThrown) {
        //alert('FAILLLL!!');
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
                        $('#list').html(data);
                    }
                }
                else {
                    window.location.href = 'welcome.html';
                }
                poll();
            }).fail(function (xhr, textStatus, errorThrown) {
                //alert('FAILLLL!!');
            });
        }, REFRESH_RATE_SEC * 1000);
    })();

    $("#sendEmailForm").submit(function (event){
        //alert($(this).serialize());
        event.preventDefault();

        $.ajax({
            type: 'POST',
            url: '/mail/sendEmail',
            data: $(this).serialize(),
            success: function (data, status) {
                //alert(data);
                if (status === "success") {
                    //alert('Your email has been successfully sent.');//TODO can remove this and just print a message on the mail.html page. alerts are annoying.
                    buttonPushed('backToMailbox');
                    //this resets the compose mail form for the next email
                    $("input[name=to]").val('');
                    $("input[name=subject]").val('');
                    $("textarea[name=body]").val('');
                } else {
                    alert('There was an error sending the email.\n' + data);
                }
            },
            error: function (xhr, textStatus, error) {
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

                    // if (!localStorage['noOfEmailsToSend']) {
                    //     localStorage['noOfEmailsToSend'] = 0;
                    // }
                    // localStorage['emailsToSend.' + localStorage['noOfEmailsToSend'] + '.to'] = $("input[name=to]").val();
                    // localStorage['emailsToSend.' + localStorage['noOfEmailsToSend'] + '.subject'] = $("input[name=subject]").val();
                    // localStorage['emailsToSend.' + localStorage['noOfEmailsToSend'] + '.body'] = $("textarea[name=body]").val();
                    // localStorage['noOfEmailsToSend'] = parseInt(localStorage['noOfEmailsToSend']) + 1;

                    buttonPushed('backToMailbox');
                    //this resets the compose mail form for the next email
                    $("input[name=to]").val('');
                    $("input[name=subject]").val('');
                    $("textarea[name=body]").val('');
                } else {
                    alert('There was an error sending the email. Browser doesn\'t support HTML5 storage');
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
                            //console.log('oldEmailsArray: ' + JSON.stringify(oldEmailsArray));
                            poppedEmail = oldEmailsArray.shift();
                            //console.log('oldEmailsArray.length: ' + oldEmailsArray.length);
                            //console.log('poppedEmail: ' + JSON.stringify(poppedEmail));
                            $.ajax({
                                type: 'POST',
                                url: '/mail/sendEmail',
                                data: poppedEmail,
                                async: false,
                                success: function (data, status) {
                                    if (status === 'success') {
                                        console.log('Successfully sent offline email. Deleting local storage of email.');                                  
                                    }
                                },
                                error: function (xhr, textStatus, error) {
                                    //console.log('push');
                                    newEmailsArray.push(poppedEmail);
                                }
                            });
                        }
                        //console.log('newEmailsArray: ' + JSON.stringify(newEmailsArray));
                        localStorage['emailsArray'] = JSON.stringify(newEmailsArray);
                        
                        if (newEmailsArray.length!==0) {
                            //try sending again in another 3 seconds.
                            console.log('Failed to send offline emails. Will retry in 3 seconds.');
                            sendOfflineEmails();
                        }
                    }, RETRY_SENDING_EMAILS_SEC * 1000);
                })();
            }
        });
    });

    try {
        $(function() {
            $( "#people" ).autocomplete({
                source: "/mail/getAllUsers",
                minLength: 1
            });
        });
    } catch (e) {

    }
});


function deleteMail(id) {
    //alert("here")
    //$.post('/mail/deleteMail',{id: id}, function (data,status) {
    alert("here")
    $.post('/mail/deleteMail',{id: id}, function (data, status) {
        if(status === 'success') {
            if('data' === 'FAIL') {
                window.location.href = "welcome.html";
            }
        }
        else {
            window.location.href = "welcome.html";
        }
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

    $("#mailSubject").html("<div id='subjectContent'>"+mails[id].subject+"</div>");
    $("#mailBody").html("<div id='bodyContent'>"+mails[id].body+"</div>");
}

function replyMail(id) {
    $(".fullScreen").hide();
    $("#composeDialog").show();
    $("input[name=to]").val(mails[id].fromUsername);
}

function buttonPushed(button, id) {
    //console.log('button pushed!');
    if (button === 'composeNewEmail') {
        $(".fullScreen").hide();
        $("#composeDialog").show();
    }
    else if (button === 'backToMailbox') {
        /*
        document.getElementById("mailList").style.display="block";
        document.getElementById("composeDialog").style.display="none";
        */
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