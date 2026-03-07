const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="hi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Cyber OmeTV Pro</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
                background: #0a0b1e; color: #00f2ff; 
                font-family: 'Segoe UI', sans-serif; height: 100vh;
                display: flex; flex-direction: column; overflow: hidden;
            }
            #status { 
                padding: 10px; text-align: center; font-size: 12px; font-weight: bold;
                letter-spacing: 2px; text-shadow: 0 0 10px #00f2ff; background: rgba(0,0,0,0.3);
            }
            .video-grid { 
                flex: 1; display: flex; flex-direction: column; padding: 10px; gap: 10px; 
            }
            @media (min-width: 768px) { .video-grid { flex-direction: row; padding: 20px; } }

            .video-box { 
                flex: 1; position: relative; border-radius: 15px; overflow: hidden;
                background: #000; border: 2px solid rgba(0, 242, 255, 0.3);
                box-shadow: inset 0 0 20px rgba(0, 242, 255, 0.2);
            }
            video { width: 100%; height: 100%; object-fit: cover; }
            #remoteVideo { border-color: #ff0055; box-shadow: 0 0 15px rgba(255, 0, 85, 0.4); }
            #localVideo { transform: scaleX(-1); }

            .controls { 
                height: 90px; display: flex; justify-content: center; align-items: center; 
                gap: 15px; background: #050510; border-top: 1px solid #1a1a3a; padding: 0 15px;
            }
            .btn {
                flex: 1; max-width: 250px; height: 55px; border: none; border-radius: 12px;
                font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 16px;
                transition: 0.2s;
            }
            .connect-btn { 
                background: #00f2ff; color: #000; box-shadow: 0 0 20px #00f2ff;
            }
            .skip-btn { 
                background: transparent; border: 2px solid #ff0055; color: #ff0055;
            }
            .btn:active { transform: scale(0.95); }

            .label {
                position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6);
                padding: 4px 10px; border-radius: 5px; font-size: 10px; border: 1px solid #333;
            }
        </style>
    </head>
    <body>
        <div id="status">ACCESSING BIO-STREAM...</div>
        <div class="video-grid">
            <div class="video-box">
                <video id="remoteVideo" autoplay playsinline></video>
                <div class="label">STRANGER</div>
            </div>
            <div class="video-box">
                <video id="localVideo" autoplay muted playsinline></video>
                <div class="label">YOU</div>
            </div>
        </div>
        <div class="controls">
            <button class="btn connect-btn" onclick="startMatching()">Connect</button>
            <button class="btn skip-btn" onclick="location.reload()">Skip</button>
        </div>

        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            let localStream, pc, currentRoomId;
            const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

            async function startMatching() {
                document.getElementById('status').innerText = "SEARCHING SUBJECT...";
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                document.getElementById('localVideo').srcObject = localStream;
                socket.emit('start-match');
            }

            socket.on('matched', async (roomId) => {
                currentRoomId = roomId;
                document.getElementById('status').innerText = "STRANGER LOCATED!";
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
