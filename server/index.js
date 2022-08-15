const {WebSocketServer, WebSocket} = require('ws')

var usernameToWS = new Map();
var wsToUsername = new Map();


const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data, isBinary) {
    if (!isBinary){
      const msg = JSON.parse(data);
      switch (msg.type) {
        case 'username':
          const username = msg.senderUsername;
          console.log(`username: ${username}, has: ${usernameToWS.has(username)}`);
          if (usernameToWS.has(username)) {
            ws.send(JSON.stringify({
              type: 'rejectusername'
            }))
            ws.close();
          }
          usernameToWS.set(username, ws);
          wsToUsername.set(ws, username);
          m_username = username;

          _sendActiveUsersMessage(username, true);
          break;

          case 'message':
            if (wsToUsername.has(ws)) {
              const senderUsername = wsToUsername.get(ws);
              msg.senderUsername = senderUsername;

              _sendBrodcast(JSON.stringify(msg), false, ws);
            }

          break;
      }
    }

    console.log('received: %s', data);
  });

  ws.on('close', function(code, reason) {
    if (wsToUsername.has(ws)) {
      const username = wsToUsername.get(ws);
      wsToUsername.delete(ws);
      usernameToWS.delete(username);
      _sendActiveUsersMessage(username, false);
    } else {
      console.warn('username not found when disconnected')
    }
  });


  
});


function _sendActiveUsersMessage(username, active) {
  _sendBrodcast(JSON.stringify({
    type: 'activeusers',
    username: username,
    active: active,
    connectedUserList: Array.from(usernameToWS.keys())
  }));
}


function _sendBrodcast(data, isBinary = false, excludeWS = undefined) {
  console.log(`Send: ${data}`)
  wss.clients.forEach(function each(client) {
    if (client !== excludeWS && client.readyState === WebSocket.OPEN) {
      client.send(data, { binary: isBinary });
    }
  });
}
