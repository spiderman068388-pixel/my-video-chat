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
        .video-box { flex: 1; border: 1px solid #333; position: relative; display: flex; align-items: center; justify-content: center; background:#222; }
        .watermark { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6); padding: 5px 10px; border-radius: 5px; font-size: 12px; z-index: 10; }
        .bottom-bar { height: 100px; background: #fff; display: flex; align-items: center; padding: 0 20px; }
        .btn { width: 70px; height: 70px; border-radius: 15px; border: none; font-weight: bold; cursor: pointer; margin-right: 10px; color: white; transition: 0.3s; }
        .start { background: #2ecc71; }
        .stop { background: #e74c3c; }
        video { width: 100%; height: 100%; object-fit: cover; }
        @media (max-width: 768px) { .video-grid { flex-direction: column; } }
    </style>
</head>
<body>
    <div class="video-grid">
        <div class="video-box" id="remoteBox"><div class="watermark">Stranger</div><div id="status">Waiting for partner...</div></div>
        <div class="video-box" id="localBox"><div class="watermark">You</div></div>
    </div>
    <div class="bottom-bar">
        <button class="btn start" id="startBtn">Start</button>
        <button class="btn stop" onclick="location.reload()">Stop</button>
        <input type="text" placeholder="Type a message..." style="flex:1; margin-left:15px; padding:12px; border:none; border-bottom:2px solid #eee; outline:none; font-size:16px;">
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let localStream;
        let peerConnection;
        const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

        const startBtn = document.getElementById('startBtn');
        const localBox = document.getElementById('localBox');
        const remoteBox = document.getElementById('remoteBox');

        startBtn.onclick = async () => {
            if(!localStream) {
                localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
                localBox.innerHTML = '<div class="watermark">You</div><video id="v1" autoplay muted playsinline></video>';
                document.getElementById('v1').srcObject = localStream;
            }
            startBtn.innerText = "Next";
            socket.emit('find-partner');
        };

        socket.on('partner-found', async (data) => {
            document.getElementById('status').innerText = "Connecting...";
            peerConnection = new RTCPeerConnection(config);
            
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            peerConnection.ontrack = (event) => {
                remoteBox.innerHTML = '<div class="watermark">Stranger</div><video id="v2" autoplay playsinline></video>';
                document.getElementById('v2').srcObject = event.streams[0];
            };

            peerConnection.onicecandidate = (event) => {
                if(event.candidate) socket.emit('ice-candidate', event.candidate);
            };

            if(data.role === 'offerer') {
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                socket.emit('offer', offer);
            }
        });

        socket.on('offer', async (offer) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('answer', answer);
        });

        socket.on('answer', async (answer) => {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('ice-candidate', async (candidate) => {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });
    </script>
</body>
</html>
    `);
});

// SERVER LOGIC FOR MATCHING
let users = [];
io.on('connection', (socket) => {
    socket.on('find-partner', () => {
        users.push(socket.id);
        if(users.length >= 2) {
            const p1 = users.pop();
            const p2 = users.pop();
            io.to(p1).emit('partner-found', { role: 'offerer' });
            io.to(p2).emit('partner-found', { role: 'answerer' });
            
            // Link both for signaling
            socket.on('offer', (offer) => socket.to(p2).emit('offer', offer));
            socket.on('answer', (answer) => socket.to(p1).emit('answer', answer));
            socket.on('ice-candidate', (cand) => socket.broadcast.emit('ice-candidate', cand));
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Live on ' + PORT));
