const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('./'));

let waitingUser = null;

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('start-match', () => {
        // Agar koi pehle se wait kar raha hai aur wo main khud nahi hoon
        if (waitingUser && waitingUser.id !== socket.id) {
            const roomId = `${waitingUser.id}#${socket.id}`;
            
            socket.join(roomId);
            waitingUser.join(roomId);

            // Dono ko roomId bhej rahe hain taaki wo isi room mein signal karein
            io.to(roomId).emit('matched', roomId);
            
            console.log("Match Found! Room:", roomId);
            waitingUser = null; 
        } else {
            waitingUser = socket;
            console.log("User waiting for match...");
        }
    });

    socket.on('signal', (data) => {
        // Sabse zaroori: Signal ko sirf uske partner ko bhejo room ke zariye
        if (data.roomId) {
            socket.to(data.roomId).emit('signal', data);
        }
    });

    socket.on('disconnect', () => {
        if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server live on port ${PORT}`));
