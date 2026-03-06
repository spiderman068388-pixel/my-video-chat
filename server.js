io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // YEH WALA HISSA ZAROORI HAI: Jab user "START" dabaye
    socket.on('start-match', () => {
        if (waitingUser && waitingUser.id !== socket.id) {
            const roomId = waitingUser.id + '#' + socket.id;
            socket.join(roomId);
            waitingUser.join(roomId);

            io.to(roomId).emit('matched', roomId);
            console.log("Match Found! Room:", roomId);
            waitingUser = null;
        } else {
            waitingUser = socket;
            console.log("User waiting for match...");
        }
    });

    socket.on('signal', (data) => {
        // Signal ko uske partner tak pahuchao
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
