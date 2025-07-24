const WebSocket = require('ws');

const connectedClients = new Set();

function initWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('🟢 WebSocket client connected');
    connectedClients.add(ws);

    ws.on('close', () => {
      connectedClients.delete(ws);
      console.log('🔴 WebSocket client disconnected');
    });

    ws.on('error', (err) => {
      console.error('❌ WebSocket error:', err.message);
    });

    // Optional: If you want to listen to messages from frontend
    ws.on('message', (message) => {
      console.log('📩 Received from client:', message);
      // You can handle custom commands here
    });
  });

  const broadcast = (data) => {
    const message = JSON.stringify(data);
    for (const client of connectedClients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (err) {
          console.error('❌ Error broadcasting to client:', err.message);
        }
      }
    }
  };

  return { broadcast };
}

module.exports = { initWebSocket };
