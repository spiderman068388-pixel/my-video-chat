// Server-side logic for real-time chat
io.on('connection', (socket) => {
    console.log('User connected: ' + socket.id);

    socket.on('find-partner', (data) => {
        // Filhal logic simple rakha hai taaki connection turant ho jaye
        socket.join('chat-room-1'); 
        console.log('User searching in: ' + data.country);
    });

    // YE HAI MAIN CHAT LOGIC
    socket.on('send-msg', (msg) => {
        // Ye message aapke partner ko bhejega
        socket.to('chat-room-1').emit('recv-msg', msg);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
