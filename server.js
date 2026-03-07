const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Ye logic file system ko bypass karke direct interface load karega
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Cyber OmeTV - Final Fix</title>
        <style>
            body { background: #0a0b1e; color: white; font-family: sans-serif; text-align: center; margin: 0; display: flex; flex-direction: column; height: 100vh; justify-content: center; }
            .video-container { display: flex; gap: 10px; justify-content: center; padding: 20px; flex-wrap: wrap; }
            video { width: 45%; max-width: 400px; border: 2px solid #00f2ff; border-radius: 15px; background: black; transform: scaleX(-1); }
            .controls { margin-top: 20px; }
            button { padding: 15px 30px; font-weight: bold; border-radius: 30px; border: none; cursor: pointer; margin: 5px; }
            #start { background: #00f2ff; box-shadow: 0 0 15px #00f2ff; }
            #next { background: #2ecc71; }
        </style>
    </head>
    <body>
        <h2 id="status">CYBER OME-TV: LIVE</h2>
        <div class="video-container">
            <video id="remoteVideo" autoplay playsinline></video>
            <video id="localVideo" autoplay muted playsinline></video>
        </div>
        <div class="controls">
            <button id="start" onclick="startMatching()">START MATCH</button>
            <button id="next" onclick="location.reload()">NEXT</button>
        </div>

        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            let localStream, pc, currentRoomId;
            const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

            async function startMatching() {
                document.getElementById('status').innerText = "CONNECTING...";
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                document.getElementById('localVideo').srcObject = localStream;
                socket.emit('start-match');
            }

            socket.on('matched', async (roomId) => {
                currentRoomId = roomId;
                document.getElementById('status').innerText = "STRANGER FOUND!";
                pc = new RTCPeerConnection(config);
                localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
                pc.ontrack = (e) => document.getElementById('remoteVideo').srcObject = e.streams[0];
                pc.onicecandidate = (e) => e.candidate && socket.emit('signal', { candidate: e.candidate, roomId });
                
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('signal', { offer, roomId });
            });

            socket.on('signal', async (data) => {
                if (!pc) return;
                if (data.offer) {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                    const ans = await pc.createAnswer();
                    await pc.setLocalDescription(ans);
                    socket.emit('signal', { answer: ans, roomId: currentRoomId });
                } else if (data.answer) await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                else if (data.candidate) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            });
        </script>
    </body>
    </html>
    `);
});

let waitingUser = null;
io.on('connection', (socket) => {
    socket.on('start-match', () => {
        if (waitingUser && waitingUser.id !== socket.id) {
            const roomId = waitingUser.id + '#' + socket.id;
            socket.join(roomId); waitingUser.join(roomId);
            io.to(roomId).emit('matched', roomId);
            waitingUser = null;
        } else { waitingUser = socket; }
    });
    socket.on('signal', (data) => { if (data.roomId) socket.to(data.roomId).emit('signal', data); });
    socket.on('disconnect', () => { if (waitingUser === socket) waitingUser = null; });
});

server.listen(process.env.PORT || 10000);
