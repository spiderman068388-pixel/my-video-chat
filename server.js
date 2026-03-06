const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('./'));

let waitingUser = null;

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Jab koi "Match" mangta hai
    if (waitingUser) {
        // Agar koi pehle se wait kar raha hai, toh unhe ek room mein daal do
        const roomId = waitingUser.id + '#' + socket.id;
        socket.join(roomId);
        waitingUser.join(roomId);

        // Dono ko batao ki partner mil gaya
        io.to(roomId).emit('matched', roomId);
        waitingUser = null;
    } else {
        // Agar koi nahi hai, toh is user ko wait karao
        waitingUser = socket;
    }

    socket.on('signal', (data) => {
        // Signal sirf uske room mein bhejo
        const rooms = Array.from(socket.rooms);
        const roomId = rooms.find(r => r.includes('#'));
        if (roomId) {
            socket.to(roomId).emit('signal', data);
        }
    });

    socket.on('disconnect', () => {
        if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server live on ${PORT}`));
