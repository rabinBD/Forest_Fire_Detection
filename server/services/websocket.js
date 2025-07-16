const WebSocket = require('ws');

const connectedClients = new Set();

function initWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('Dashboard WebSocket connected');
    connectedClients.add(ws);

    ws.on('close', () => {
      connectedClients.delete(ws);
      console.log('Dashboard WebSocket disconnected');
    });
  });

  const broadcast = (data) => {
    const message = JSON.stringify(data);
    for (let client of connectedClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  };

  return { broadcast };
}

module.exports = {initWebSocket};
