const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Sabse zaroori: Files ko sahi se dhoondhne ke liye
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Stranger Matching Logic
let waitingUser = null;
io.on('connection', (socket) => {
    socket.on('find-partner', () => {
        if (waitingUser && waitingUser !== socket.id) {
            io.to(socket.id).emit('partner-found');
            io.to(waitingUser).emit('partner-found');
            waitingUser = null;
        } else {
            waitingUser = socket.id;
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('App is running on port ' + PORT);
});
