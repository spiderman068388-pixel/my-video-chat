const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Ye line sabse zaroori hai - ye aapki files (index, style, script) ko load karegi
app.use(express.static(__path.join(__dirname, '/')));

app.get('/', (req, res) => {
    res.sendFile(__path.join(__dirname, 'index.html'));
});

// Basic Socket connection for later
io.on('connection', (socket) => {
    console.log('A user connected');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
