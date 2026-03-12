const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Sabse safe tarika files load karne ka
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Basic Matching Logic
io.on('connection', (socket) => {
    socket.on('find-partner', () => {
        socket.broadcast.emit('partner-found');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('App is live!');
});
