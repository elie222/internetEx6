/**
 * Created with JetBrains WebStorm.
 * User: LEO
 * Date: 20/01/13
 * Time: 16:06
 * To change this template use File | Settings | File Templates.
 */
var REFRESH_RATE_SEC = 1;// TODO: use settings.js or something...
$(document).ready(function () {

    (function poll() {
        setTimeout(function () {
            $.post('/mail/mailList', {}, function (data, status) {
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
            });
        },REFRESH_RATE_SEC * 1000);
    })();




    $.get('/mail/getLoggedInUsername', function (data, status) {
        if(status === "success") {
            $('#userDetails').html('Welcome Back ' +data + '!');
        } else {
            window.location.href = "welcome.html";
        }
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
    $.post('/mail/deleteMail',{id: id}, function (data,status) {
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