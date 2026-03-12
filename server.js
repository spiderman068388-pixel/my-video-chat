const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Cyber OmeTV</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000; color: #fff; font-family: Arial, sans-serif; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
        .video-grid { flex: 1; display: flex; background: #111; }
        .video-box { flex: 1; border: 1px solid #333; position: relative; display: flex; align-items: center; justify-content: center; }
        .watermark { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6); padding: 5px 10px; border-radius: 5px; font-size: 12px; z-index: 10; }
        .bottom-bar { height: 120px; background: #fff; display: flex; align-items: center; padding: 0 20px; }
        .btn { width: 80px; height: 80px; border-radius: 15px; border: none; font-weight: bold; cursor: pointer; margin-right: 10px; color: white; }
        .start { background: #2ecc71; }
        .stop { background: #e74c3c; }
        video { width: 100%; height: 100%; object-fit: cover; }
        @media (max-width: 768px) { .video-grid { flex-direction: column; } }
    </style>
</head>
<body>
    <div class="video-grid">
        <div class="video-box" id="remoteBox"><div class="watermark">Stranger</div></div>
        <div class="video-box" id="localBox"><div class="watermark">You</div></div>
    </div>
    <div class="bottom-bar">
        <button class="btn start" id="startBtn">Start</button>
        <button class="btn stop" onclick="location.reload()">Stop</button>
        <input type="text" placeholder="Write a message..." style="flex:1; margin-left:20px; padding:15px; border:none; border-bottom:1px solid #ddd; outline:none;">
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const startBtn = document.getElementById('startBtn');
        const localBox = document.getElementById('localBox');
        let stream;

        startBtn.onclick = async () => {
            try {
                if(!stream) {
                    stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
                    localBox.innerHTML = '<div class="watermark">You</div><video id="v" autoplay muted playsinline></video>';
                    document.getElementById('v').srcObject = stream;
                }
                startBtn.innerText = "Next";
                socket.emit('find-partner');
            } catch(e) { alert("Camera allow karo bhai!"); }
        };

        socket.on('partner-found', () => {
            console.log("Partner mil gaya!");
        });
    </script>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Server running on ' + PORT);
});
