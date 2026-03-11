const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path'); // Ye line path setup karti hai

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Sabhi static files (css, js, images) ko load karne ke liye
app.use(express.static(path.join(__dirname, '/')));

// Sirf index.html file ko serve karne ke liye
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
