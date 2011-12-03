import tornado.ioloop
import tornado.web
import tornado.websocket

# For showing the code
from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import HtmlFormatter

INDEX_TEMPLATE = """
<html>
    <head>
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.7.0/jquery.min.js" type="text/javascript"></script>
    </head>
    <script type="text/javascript">
    function append_chat(text) {
        $("#chat").append($("<p>").html(text));
    }
    var ws;
    $(function() {
        ws = new WebSocket("ws://localhost:8080/chat");
        ws.onopen = function() { append_chat("Connected to server"); }
        ws.onmessage = function(event) { append_chat(event.data); }
        ws.onclose = function() { append_chat("Connection closed"); }
        $('form').submit(function(e) {
            ws.send($('#say').val());
            $('#say').val('');
            return false; // Or e.preventDefault() ?
        });
    });
    </script>
    <body>
        <h1>Chat</h1>
        <div id="chat"/>
        <form method="post" actions="/notused">
            <label for="say">Say:</label>
            <input type="text" name="say" id="say" />
        </form>

    </body>
</html>
"""

CONNECTED_CLIENTS = []

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        return self.write(INDEX_TEMPLATE)

class CodeHandler(tornado.web.RequestHandler):
    def get(self):
        thisfile = open(__file__, 'r')
        code = highlight(thisfile.read(), PythonLexer(), HtmlFormatter())
        html = '<html><head><style>%s</style></head><body>%s</body></html>' % (HtmlFormatter().get_style_defs('.highlight'), code)
        self.write(html)
        thisfile.close()

class ChatWebSocket(tornado.websocket.WebSocketHandler):
    def open(self, *args):
        print 'Connection initiated'
        CONNECTED_CLIENTS.append(self)

    def on_message(self, message):
        for c in CONNECTED_CLIENTS:
            c.write_message('> ' + message);

    def on_close(self):
        print 'Connection closed'
        CONNECTED_CLIENTS.remove(self)

app = tornado.web.Application([
    (r"/", MainHandler),
    (r"/code", CodeHandler),
    (r"/chat", ChatWebSocket)
])

if __name__ == '__main__':
    app.listen(8080)
    tornado.ioloop.IOLoop.instance().start()

