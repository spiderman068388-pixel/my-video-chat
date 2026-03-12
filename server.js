const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// SABSE ZAROORI: Ye line files ko dhoondhne mein madad karegi
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Stranger Matching Logic
let waitingUser = null;
io.on('connection', (socket) => {
    console.log('User connected: ' + socket.id);

    socket.on('find-partner', () => {
        if (waitingUser && waitingUser !== socket.id) {
            io.to(socket.id).emit('partner-found');
            io.to(waitingUser).emit('partner-found');
            waitingUser = null;
        } else {
            waitingUser = socket.id;
        }
    });

    socket.on('disconnect', () => {
        if (waitingUser === socket.id) waitingUser = null;
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
