function create_date_element() {
    var date = new Date();
    var datestring = (date.getHours() < 10 ? "0"+date.getHours():date.getHours());
    datestring += ":";
    datestring += (date.getMinutes() < 10 ? "0"+date.getMinutes():date.getMinutes());
    return $("<div>").addClass("span1").addClass("timestamp").text(datestring);
}
function create_namechange_element(oldname, newname) {
    return $("<div>").addClass("span15").addClass("notification").text(oldname + " is now known as " + newname);
}

function create_message_element(sender, message) {
    return $("<div>").addClass("span15").text('<'+sender+'> '+message);
}

function create_join_element(joiner) {
    return $("<div>").addClass("span15").addClass("notification").text(joiner + " joined");
}

function create_leave_element(leaver) {
    return $("<div>").addClass("span15").addClass("notification").text(leaver + " left");
}

function create_userlist_element(users) {
    return $("<div>").addClass("span15").addClass("notification").text("Connected users: " + users.join(", "));
}

// Different message types
var MESSAGE     = 0;
var NAMECHANGE  = 1;
var JOIN        = 2;
var LEAVE       = 3;
var USERLIST    = 4;

// TODO: Use dict with functions instead, and let them parse the jsondata?
function print_response(jsondata) {
    var date_element = create_date_element();
    var element;
    if(jsondata["TYPE"] == MESSAGE) {
        element = create_message_element(jsondata["SENDER"], jsondata["MESSAGE"]);
    } 
    else if(jsondata["TYPE"] == JOIN) {
        element = create_join_element(jsondata["USER"]);
    }
    else if(jsondata["TYPE"] == NAMECHANGE) {
        element = create_namechange_element(jsondata["OLDNAME"], jsondata["NEWNAME"]);
    }
    else if(jsondata["TYPE"] == LEAVE) {
        element = create_leave_element(jsondata['USER']);
    }
    else if(jsondata["TYPE"] == USERLIST) {
        element = create_userlist_element(jsondata['USERS']);
    }
    $("#chat-log").append($("<div>").addClass("row").append(date_element).append(element));
    //$("#chat-log").scrollTop($("#chat-log")[0].scrollHeight);
    document.body.scrollTop = document.body.scrollHeight;
}

$(function() {
    $("#nickname").focus();
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
        $("#say").focus();

        $('form[name=chat]').submit(function(e) {
            ws.send($('#say').val());
            $('#say').val('');
            return false; // Or e.preventDefault() ?
        });
        evt.preventDefault();
    });
    $("#code-menu").click(function(e) {
        $("#code-content").load('/code');
        $("#chat-content").hide();
        $("#code-content").show();
        $(".nav li").removeClass("active");
        $(this).parent().addClass("active");
        e.preventDefault();
    });
    $("#chat-menu").click(function(e) {
        $("#chat-content").show();
        $("#code-content").hide();
        $(".nav li").removeClass("active");
        $(this).parent().addClass("active");
        document.body.scrollTop = document.body.scrollHeight;
        e.preventDefault();
    });
});
