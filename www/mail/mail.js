/**
 * Created with JetBrains WebStorm.
 * User: LEO
 * Date: 20/01/13
 * Time: 16:06
 * To change this template use File | Settings | File Templates.
 */
$(document).ready(function () {
    $.post('/mail/mailList', {}, function (data, status) {
        if(status === "success") {
            if(data === "FAIL") {
                window.location.href = 'welcome.html';
            }
            else {
                $('#userDetails').html("Welcome Back " + data + "!"); //TODO what is this line? LEO: it's showing the current user on the top left
                $('#list').append(data);
            }
        }
    });

    $.get('/mail/getLoggedInUsername', function (data, status) {
        if(status === "success") {
            $('#userDetails').html(data);
        } else {
            console.log('ERROR getting currently logged in username!');
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