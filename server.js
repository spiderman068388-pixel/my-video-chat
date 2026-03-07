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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
        <title>Cyber OmeTV Fixed</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
                background: #050510; color: #00f2ff; 
                font-family: 'Segoe UI', sans-serif; 
                height: 100vh; height: -webkit-fill-available; /* Mobile height fix */
                display: flex; flex-direction: column; overflow: hidden;
            }
            
            #status { 
                height: 40px; display: flex; align-items: center; justify-content: center;
                font-size: 11px; font-weight: bold; letter-spacing: 1px;
                background: rgba(0,0,0,0.4); border-bottom: 1px solid #1a1a3a;
            }

            .video-grid { 
                flex: 1; display: flex; flex-direction: column; 
                padding: 10px; gap: 8px; overflow: hidden; /* Taaki scroll na aaye */
            }
            
            @media (min-width: 768px) { .video-grid { flex-direction: row; padding: 15px; } }

            .video-box { 
                flex: 1; position: relative; border-radius: 12px; overflow: hidden;
                background: #000; border: 1px solid rgba(0, 242, 255, 0.3);
                /* Mobile par video ko limit karna taaki buttons ke liye jagah bache */
                max-height: 40%; 
            }
            
            @media (min-width: 768px) { .video-box { max-height: 100%; } }

            video { width: 100%; height: 100%; object-fit: cover; }
            #remoteVideo { border-color: #ff0055; }
            #localVideo { transform: scaleX(-1); }

            /* Fixed Bottom Controls */
            .controls { 
                height: 85px; display: flex; justify-content: center; align-items: center; 
                gap: 12px; background: #0a0a1a; border-top: 2px solid #1a1a3a;
                padding: 0 15px; padding-bottom: env(safe-area-inset-bottom);
            }

            .btn {
                flex: 1; max-width: 200px; height: 50px; border: none; border-radius: 10px;
                font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 14px;
                transition: 0.2s; -webkit-tap-highlight-color: transparent;
            }
            .connect-btn { background: #00f2ff; color: #000; box-shadow: 0 0 15px rgba(0, 242, 255, 0.5); }
            .skip-btn { background: transparent; border: 1px solid #ff0055; color: #ff0055; }
            
            .btn:active { transform: scale(0.92); filter: brightness(1.2); }

            .label {
                position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.6);
                padding: 3px 8px; border-radius: 4px; font-size: 9px; border: 1px solid #222;
            }
        </style>
    </head>
    <body>
        <div id="status">READY FOR UPLINK</div>
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
            // ... (Baki purana matching script wahi rahega) ...
            const socket = io();
            let localStream, pc, currentRoomId;
            const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

            async function startMatching() {
                document.getElementById('status').innerText = "SEARCHING...";
                try {
                    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    document.getElementById('localVideo').srcObject = localStream;
                    socket.emit('start-match');
                } catch(e) { alert("Camera Access Required!"); }
            }

            socket.on('matched', async (roomId) => {
                currentRoomId = roomId;
                document.getElementById('status').innerText = "CONNECTED!";
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

// ... (Server matching logic wahi rahega) ...
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
