import json
import os

import tornado.ioloop
import tornado.web
import tornado.websocket

# For showing the code
from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import HtmlFormatter

CONNECTED_CLIENTS = []

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        return self.write(open("index.html", 'r').read())

class CodeHandler(tornado.web.RequestHandler):
    """ Handler which prints the current files source code syntax highlighted in HTML """
    def get(self):
        thisfile = open(__file__, 'r')
        code = highlight(thisfile.read(), PythonLexer(), HtmlFormatter())
        html = '<html><head><style>%s</style></head><body>%s</body></html>' % (HtmlFormatter().get_style_defs('.highlight'), code)
        self.write(html)
        thisfile.close()


# Different message types
MESSAGE     = 0
NAMECHANGE  = 1
JOIN        = 2
LEAVE       = 3
USERLIST    = 4
class ChatWebSocket(tornado.websocket.WebSocketHandler):

    def open(self):
        CONNECTED_CLIENTS.append(self)
        self.client_name=''
        self.join_completed = False # Not completed until a name has been selected

    def on_message(self, message):
        if message.startswith("/"):
            # A command
            spl = message.split(" ")
            if len(spl) == 1:
                cmd,arg = spl[0], ""
            elif len(spl) == 2:
                cmd, arg = spl
            else:
                return self.write_message('Invalid command')
            self.execute_command(cmd, arg)
        else:
            self.broadcast(self.create_message_pkg(message))

    def broadcast(self, pkg):
        for c in CONNECTED_CLIENTS:
            if c.join_completed:
                c.write_message(pkg)

    def create_join_pkg(self):
        pkgdata = {'TYPE': JOIN, 'USER': self.client_name}
        return json.dumps(pkgdata)

    def create_name_change_pkg(self, old_name):
        pkgdata = {'TYPE': NAMECHANGE, 'OLDNAME': old_name, 'NEWNAME': self.client_name}
        return json.dumps(pkgdata)
    
    def create_message_pkg(self, msg):
        pkgdata = {'TYPE': MESSAGE, 'SENDER': self.client_name, 'MESSAGE': msg}
        return json.dumps(pkgdata)

    def create_userlist_pkg(self):
        pkgdata = {'TYPE': USERLIST, 'USERS': [c.client_name for c in CONNECTED_CLIENTS]}
        return json.dumps(pkgdata)

    def execute_command(self, cmd, arg):
        if cmd == '/name':
            if self.join_completed:
                old_name = self.client_name
                self.client_name = arg
                self.broadcast(self.create_name_change_pkg(old_name))
                self.broadcast(self.create_userlist_pkg())
            else:
                self.client_name = arg
                self.join_completed = True
                self.broadcast(self.create_join_pkg())
                self.broadcast(self.create_userlist_pkg())
        elif cmd == '/names':
            self.write_message(self.create_userlist_pkg())
        else:
            pass
            # Error

    def on_close(self):
        CONNECTED_CLIENTS.remove(self)

app = tornado.web.Application([
    (r"/", MainHandler),
    (r"/code", CodeHandler),
    (r"/chat", ChatWebSocket),
    (r"/js/(.*)", tornado.web.StaticFileHandler, {"path": os.path.join(os.path.dirname(__file__), 'js')})
])

if __name__ == '__main__':
    app.listen(8080)
    tornado.ioloop.IOLoop.instance().start()

