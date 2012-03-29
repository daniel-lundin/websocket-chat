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

function create_error_element(detail) {
    return $("<div>").addClass("span15").addClass("error").text(detail);
}

function update_user_list(users) {
    $("#userlist").empty();
    var userlist = $("<ul>").addClass("nav").addClass("nav-list");
    userlist.append($("<li>").addClass("nav-header").text("Users"));
    for(var idx in users) {
        userlist.append($("<li>").text(users[idx]));
    };
    $("#userlist").append(userlist);
}

// Different message types
var MESSAGE     = 0;
var NAMECHANGE  = 1;
var JOIN        = 2;
var LEAVE       = 3;
var USERLIST    = 4;
var ERROR       = 5;

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
        update_user_list(jsondata['USERS']);
    }
    else if(jsondata["TYPE"] == USERLIST) {
        element = create_userlist_element(jsondata['USERS']);
        update_user_list(jsondata['USERS']);
    }
    else if(jsondata["TYPE"] == ERROR) {
        element = create_error_element(jsondata['DETAIL']);
    }
    $("#chat-log").append($("<div>").addClass("row").append(date_element).append(element));
    $("#chat-log").scrollTop($("#chat-log")[0].scrollHeight);
}

function parse_user_message(message) {
    if(message.search("/nick") == 0) {
        var split = message.split(" ");
        if(split.length != 2) {
            // TODO: Show error
            return;
        }
        return ws.send(create_name_change_pkg(split[1]));
    }
    if(message.search("/names") == 0) {
        return ws.send(create_userlist_pkg());
    }
    return ws.send(create_msg_pkg(message));
}

function create_msg_pkg(message) {
    var msg = {"TYPE": MESSAGE, "MESSAGE": message};
    return JSON.stringify(msg);
}

function create_userlist_pkg() {
    var msg = {"TYPE": USERLIST};
    return JSON.stringify(msg);
}

function create_name_change_pkg(newname) {
    var msg = {"TYPE": NAMECHANGE, "NEWNAME": newname};
    return JSON.stringify(msg);
}

function create_join_pkg(name) {
    var msg = {"TYPE": JOIN, "USER": name};
    return JSON.stringify(msg);
}

$(function() {
    $("#nickname").focus();
    $("form[name=connect]").submit(function(evt) {
        var nick = $("#nickname").val();

        // global
        ws = new WebSocket("ws://localhost:8080/chat");
        ws.onopen = function() { ws.send(create_join_pkg(nick)); }
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
            parse_user_message($('#say').val());
            $('#say').val('');
            return false;
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
