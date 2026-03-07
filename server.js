const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');

// Sabse zaroori line: Ye index.html ko dhoond kar screen par layega
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

let waitingUser = null;

io.on('connection', (socket) => {
    socket.on('start-match', () => {
        if (waitingUser && waitingUser.id !== socket.id) {
            const roomId = waitingUser.id + '#' + socket.id;
            socket.join(roomId);
            waitingUser.join(roomId);
            io.to(roomId).emit('matched', roomId);
            waitingUser = null;
        } else {
            waitingUser = socket;
        }
    });

    socket.on('signal', (data) => {
        if (data.roomId) {
            socket.to(data.roomId).emit('signal', data);
        }
    });

    socket.on('disconnect', () => {
        if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log('Server is running on port ' + PORT));
