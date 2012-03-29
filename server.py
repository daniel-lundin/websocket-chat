import json
import os

import tornado.ioloop
import tornado.web
import tornado.websocket

# For showing the code
from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import HtmlFormatter

class MainHandler(tornado.web.RequestHandler):
    """ Renders the index file """
    def get(self):
        return self.write(open("index.html", 'r').read())

class CodeHandler(tornado.web.RequestHandler):
    """ Prints the source code for the current file highlighted in HTML """
    def get(self):
        thisfile = open(__file__, 'r')
        code = highlight(thisfile.read(), PythonLexer(), HtmlFormatter())
        html = '<style>%s</style>%s' % (HtmlFormatter().get_style_defs('.highlight'), code)
        self.write(html)
        thisfile.close()

# Different message types
MESSAGE     = 0
NAMECHANGE  = 1
JOIN        = 2
LEAVE       = 3
USERLIST    = 4
ERROR       = 5

# The list of currently connected clients
CONNECTED_CLIENTS = []

class ChatWebSocket(tornado.websocket.WebSocketHandler):
    """ The chat implemententation, all data send to server is json, all responses are json """

    def open(self):
        CONNECTED_CLIENTS.append(self)
        self.client_name = ''
        self.join_completed = False # Not completed until a name has been selected

    def on_message(self, message):
        try:
            pkg = json.loads(message)
        except:
            return self.write_message(self.create_error_pkg(u'Format error'))
        if pkg['TYPE'] == JOIN:
            self.join_completed = True
            self.client_name = pkg['USER']
            self.join_completed = True
            self.broadcast(self.create_join_pkg())
            self.write_message(self.create_userlist_pkg())
        elif pkg['TYPE'] == MESSAGE:
            self.broadcast(self.create_message_pkg(pkg['MESSAGE']))
        elif pkg['TYPE'] == USERLIST:
            self.write_message(self.create_userlist_pkg())
        elif pkg['TYPE'] == NAMECHANGE:
            old_name = self.client_name
            self.client_name = pkg['NEWNAME']
            self.broadcast(self.create_name_change_pkg(old_name))
        else:
            self.write_message(self.create_error_pkg('unknown message type'))

    def broadcast(self, pkg, all_but=None):
        for c in CONNECTED_CLIENTS:
            if c.join_completed and c != all_but:
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

    def create_leave_pkg(self):
        pkgdata = {'TYPE': LEAVE, 'USER': self.client_name}
        return json.dumps(pkgdata)

    def create_userlist_pkg(self):
        pkgdata = {'TYPE': USERLIST, 'USERS': [c.client_name for c in CONNECTED_CLIENTS]}
        return json.dumps(pkgdata)

    def create_error_pkg(self, detail):
        pkgdata = {'TYPE': ERROR, 'DETAIL': detail}
        return json.dumps(pkgdata)

    def on_close(self):
        self.broadcast(self.create_leave_pkg(), all_but=self)
        CONNECTED_CLIENTS.remove(self)

app = tornado.web.Application([
    (r"/", MainHandler),
    (r"/code", CodeHandler),
    (r"/chat", ChatWebSocket),
    (r"/js/(.*)", tornado.web.StaticFileHandler, {"path": os.path.join(os.path.dirname(__file__), 'js')}),
    (r"/css/(.*)", tornado.web.StaticFileHandler, {"path": os.path.join(os.path.dirname(__file__), 'css')})
])

if __name__ == '__main__':
    app.listen(8080)
    tornado.ioloop.IOLoop.instance().start()

