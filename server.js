const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('./')); // Aapki index.html file load karne ke liye

io.on('connection', (socket) => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);
    });
});

// YEH WOH FIX HAI JO RENDER KO CHAHIYE
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server live hai port ${PORT} par`);
});
