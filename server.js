const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('./'));

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
server.listen(PORT, () => console.log('Server running on port ' + PORT));
