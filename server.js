const express = require('express');
const { PeerServer } = require('peerjs-server');
const cors = require('cors');
const http = require('http'); // Import http module

const app = express();
app.use(cors()); // Enable CORS for all routes

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Start the HTTP server
server.listen(9000, () => {
  console.log('Express server listening on port 9000');
});

// Pass the HTTP server to PeerServer
const peerServer = PeerServer({ debug: 3, path: '/peerjs' }, server); // Pass the server and specify path

peerServer.on('connection', (client) => {
  console.log('Client connected:', client.id);
});

peerServer.on('disconnect', (client) => {
  console.log('Client disconnected:', client.id);
});

console.log('PeerJS server integrated with Express app.');
