/**
 * Created with JetBrains WebStorm.
 * User: LEO
 * Date: 20/01/13
 * Time: 16:06
 * To change this template use File | Settings | File Templates.
 */
var REFRESH_RATE_SEC = 1;// TODO: use settings.js or something...
var RETRY_SENDING_EMAILS_SEC = 30;

function supports_html5_storage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}

$(document).ready(function () {
    (function poll() {
        setTimeout(function () {
            console.log('poll');
            $.post('/mail/mailList', {}, function (data, status) {
                if(status === "success") {
                    if(data === "FAIL") {
                        window.location.href = 'welcome.html';
                    }
                    else {
                        $('#list').html(data);
                        // //save data for offline mode
                        // if (supports_html5_storage) {
                        //     localStorage['mails'] = mails;//TODO can the data be sent in chunks? if yes, then this won't work properly.
                        // }
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
                    if (localStorage['noOfEmailsToSend'] === 'NaN') {
                        localStorage['noOfEmailsToSend'] = 0;
                    }
                    localStorage['noOfEmailsToSend'] = parseInt(localStorage['noOfEmailsToSend']) + 1
                    localStorage['emailsToSend.' + localStorage['noOfEmailsToSend'] + '.to'] = $("input[name=to]").val();
                    localStorage['emailsToSend.' + localStorage['noOfEmailsToSend'] + '.subject'] = $("input[name=subject]").val();
                    localStorage['emailsToSend.' + localStorage['noOfEmailsToSend'] + '.body'] = $("textarea[name=body]").val();

                    buttonPushed('backToMailbox');
                    //this resets the compose mail form for the next email
                    $("input[name=to]").val('');
                    $("input[name=subject]").val('');
                    $("textarea[name=body]").val('');
                } else {
                    alert('There was an error sending the email. Browser doesn\'t support HTML5 storage');
                }

                //try sending the emails every 30 secs till successfully sent. Then delete email from local storage
                (function sendOfflineEmails() {
                    setTimeout(function () {
                        console.log('Attempting to send all offline emails.');
                        for (var i = 0; i < parseInt(localStorage['noOfEmailsToSend']); i++) {
                            $.ajax({
                                type: 'POST',
                                url: '/mail/sendEmail',
                                data: {
                                    to: localStorage['emailsToSend.' + i + '.to'],
                                    subject: localStorage['emailsToSend.' + i + '.subject'],
                                    body: localStorage['emailsToSend.' + i + '.body'],
                                },
                                success: function (data, status) {
                                    if (status === 'success') {
                                        console.log('Successfully sent offline email. Deleting local storage of email.');
                                        //remove email from local storage
                                        localStorage.removeItem('emailsToSend.' + i + '.to');
                                        localStorage.removeItem('emailsToSend.' + i + '.subject');
                                        localStorage.removeItem('emailsToSend.' + i + '.body');
                                        localStorage['noOfEmailsToSend'] = parseInt(localStorage['noOfEmailsToSend']) - 1;                                    
                                    }
                                },
                                error: function (xhr, textStatus, error) {
                                    //try sending again in another 30 seconds.
                                    console.log('Failed to send offline emails. Will retry in 30 seconds.');
                                    sendOfflineEmails();
                                }//,
                                //timeout: 1000. don't think the timeout works.
                            });
                        }
                    }, RETRY_SENDING_EMAILS_SEC * 1000);
                })();
            }
        });
    });

    $(function() {
        $( "#people" ).autocomplete({
            source: "/mail/getAllUsers",
            minLength: 1
        });
    });
});

function deleteMail(id) {
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
        $(".fullScreen").hide();
        $("#mailList").show();
    } else {
        console.log(button+' is not a button name.');
    }
}