const express = require('express');
const morgan = require('morgan');
require('dotenv').config();
const cors = require('cors');
const http = require('http'); //to bind WebSocket to the HTTP server

const admin = require('./routes/authRoute');
const dashboard = require('./routes/dashboardRoute');
const sensorRoute = require('./routes/sensorRoute'); //Will inject broadcast
const notify = require('./routes/notifyRoute');

// App & HTTP Server
const app = express();
const server = http.createServer(app); //Needed for WebSocket

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    credentials: true
}));

//Init WebSocket & inject broadcast function
const {initWebSocket} = require('./services/websocket');
const { broadcast } = initWebSocket(server);

// Route setup
app.use('/api/admin', admin);
app.use('/api/dashboard', dashboard);
app.use('/api/sensors', sensorRoute(broadcast)); 
app.use('/api/notify', notify);

// Server listen
const port = process.env.PORT || 8080;
server.listen(port, () => {
    console.log(`Server running in ${process.env.DEV_MODE} Mode on http://localhost:${port}`);
});
