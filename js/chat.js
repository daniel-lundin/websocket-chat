function print_date() {
    var date = new Date();
    var datestring = (date.getHours() < 10 ? "0"+date.getHours():date.getHours());
    datestring += ":";
    datestring += (date.getMinutes() < 10 ? "0"+date.getMinutes():date.getMinutes());
    $("#chat-log").append($("<p>").addClass("timestamp").html(datestring));
}
function print_namechange(oldname, newname) {
    $("#chat-log").append($("<p>").addClass("notification").text(oldname + " is now known as " + newname));
}

function print_message(sender, message) {
    $("#chat-log").append($("<p>").addClass("sender").text('<'+sender+'>'));
    $("#chat-log").append($("<p>").addClass("message").text(message));
}

function print_join(joiner) {
    $("#chat-log").append($("<p>").addClass("notification").text(joiner + " joined"));
}

function print_leave(leaver) {
    $("#chat-log").append($("<p>").addClass("notification").text(leaver + " left"));
}

function print_userlist(users) {
    var userlist = "";
    //$("#userlist").empty();
    for(var i=0;i<users.length;++i) {
        userlist += users[i] + ", ";
        //$("#userlist").append($("<li>").html(users[i]));
    }
    userlist = userlist.substr(0, userlist.length-2)
    $("#chat-log").append($("<p>").addClass("notification").text("Connected users: " + userlist));

}

// Different message types(Use dict with functions instead, and let them parse the jsondata?)
var MESSAGE     = 0;
var NAMECHANGE  = 1;
var JOIN        = 2;
var LEAVE       = 3;
var USERLIST    = 4;

function print_response(jsondata) {
    print_date();
    if(jsondata["TYPE"] == MESSAGE) {
        print_message(jsondata["SENDER"], jsondata["MESSAGE"]);
    } 
    else if(jsondata["TYPE"] == JOIN) {
        print_join(jsondata["USER"]);
    }
    else if(jsondata["TYPE"] == NAMECHANGE) {
        print_namechange(jsondata["OLDNAME"], jsondata["NEWNAME"]);
    }
    else if(jsondata["TYPE"] == LEAVE) {
        print_leave(jsondata['USER']);
    }
    else if(jsondata["TYPE"] == USERLIST) {
        print_userlist(jsondata['USERS']);
    }
    $("#chat-log").scrollTop($("#chat-log")[0].scrollHeight);
}

$(function() {
    $("form[name=connect]").submit(function(evt) {
        var nick = $("#nickname").val();

        var ws = new WebSocket("ws://192.168.1.65:8080/chat");
        ws.onopen = function() { ws.send("/name " + nick); }
        ws.onmessage = function(event) { 
            // TODO: Error handling
            var jsondata = jQuery.parseJSON(event.data);
            print_response(jsondata)
        }
        ws.onclose = function() { }//append_chat("Connection closed"); }
        $("#connect-form").hide();
        $("#chat").show();

        $('form[name=chat]').submit(function(e) {
            ws.send($('#say').val());
            $('#say').val('');
            return false; // Or e.preventDefault() ?
        });
        evt.preventDefault();
    });
});
