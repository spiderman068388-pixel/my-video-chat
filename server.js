const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// SABSE ZAROORI LINE: Ye aapki CSS aur JS ko dhoondhne mein madad karegi
app.use(express.static(path.join(__dirname, '/')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Matching Logic (Abhi ke liye basic setup)
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
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
});
