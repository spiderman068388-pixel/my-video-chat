const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('./'));

let waitingUser = null;

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Jab user "START" dabaye (index.html se aata hai)
    socket.on('start-match', () => {
        if (waitingUser && waitingUser.id !== socket.id) {
            const roomId = waitingUser.id + '#' + socket.id;
            socket.join(roomId);
            waitingUser.join(roomId);

            // Dono ko batao ki partner mil gaya
            io.to(roomId).emit('matched', roomId);
            console.log("Match Found! Room:", roomId);
            waitingUser = null;
        } else {
            waitingUser = socket;
            console.log("User waiting for match...");
        }
    });

    // Sabse important: Video signals exchange karna
    socket.on('signal', (data) => {
        // Signal ko uske room ke doosre partner tak bhejo
        const rooms = Array.from(socket.rooms);
        const roomId = rooms.find(r => r.includes('#'));
        if (roomId) {
            socket.to(roomId).emit('signal', data);
        }
    });

    socket.on('disconnect', () => {
        if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server live hai port ${PORT} par`));
