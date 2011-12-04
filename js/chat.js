function print_date() {
    var date = new Date();
    var datestring = (date.getHours() < 10 ? "0"+date.getHours():date.getHours());
    datestring += ":";
    datestring += (date.getMinutes() < 10 ? "0"+date.getMinutes():date.getMinutes());
    $("#chat").append($("<p>").addClass("timestamp").html(datestring));
}
function print_namechange(oldname, newname) {
    print_date();
    $("#chat").append($("<p>").addClass("notification").html(oldname + " is now known as " + newname));
    $("#chat").attr({ scrollTop: $("#chat").attr("scrollHeight") });
}

function print_message(sender, message) {
    print_date();
    $("#chat").append($("<p>").addClass("sender").html('&lt;'+sender+'&gt; '));
    $("#chat").append($("<p>").addClass("message").html(message));
    $("#chat").attr({ scrollTop: $("#chat").attr("scrollHeight") });
}

function print_join(joiner) {
    print_date();
    $("#chat").append($("<p>").addClass("notification").html(joiner + " joined"));
}

function print_leave(leaver) {
}

function update_userlist(users) {
    $("#userlist").empty();
    for(var i=0;i<users.length;++i) {
        $("#userlist").append($("<li>").html(users[i]));
    }
}

// Different message types(Use dict with functions instead, and let them parse the jsondata?)
var MESSAGE     = 0;
var NAMECHANGE  = 1;
var JOIN        = 2;
var LEAVE       = 3;
var USERLIST    = 4;

$(function() {
    $("form[name=connect]").submit(function(evt) {
        var nick = $("#nickname").val();

        var ws = new WebSocket("ws://192.168.1.65:8080/chat");
        ws.onopen = function() { ws.send("/name " + nick); }
        ws.onmessage = function(event) { 
            // TODO: Error handling
            var jsondata = jQuery.parseJSON(event.data);
            if(jsondata["TYPE"] == MESSAGE) {
                print_message(jsondata["SENDER"], jsondata["MESSAGE"]);
            } 
            else if(jsondata["TYPE"] == JOIN) {
                print_join(jsondata["USER"]);
            }
            else if(jsondata["TYPE"] == NAMECHANGE) {
                print_namechange(jsondata["OLDNAME"], jsondata["NEWNAME"]);
            }
            else if(jsondata["TYPE"] == USERLIST) {
                update_userlist(jsondata['USERS']);
            }

        }
        ws.onclose = function() { }//append_chat("Connection closed"); }
        $("#login-form").hide();
        $("#chat-holder").show();

        $('form[name=chat]').submit(function(e) {
            ws.send($('#say').val());
            $('#say').val('');
            return false; // Or e.preventDefault() ?
        });
        evt.preventDefault();
    });
});
