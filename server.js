const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Ye line sabse important hai, ise mat chhedna
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('find-partner', () => {
        socket.broadcast.emit('partner-found');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Server is live!');
});
