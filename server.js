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
        <title>Cyber OmeTV Pro Max</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
                background: radial-gradient(circle, #1a1a2e 0%, #050510 100%); 
                color: #00f2ff; font-family: 'Segoe UI', sans-serif; height: 100vh;
                display: flex; flex-direction: column; overflow: hidden;
            }
            #status { 
                height: 45px; display: flex; align-items: center; justify-content: center;
                font-size: 12px; font-weight: bold; letter-spacing: 2px;
                background: rgba(0,0,0,0.7); border-bottom: 1px solid rgba(0, 242, 255, 0.2);
                text-transform: uppercase; text-shadow: 0 0 10px #00f2ff;
            }
            .video-grid { flex: 1; display: flex; flex-direction: column; padding: 10px; gap: 10px; }
            @media (min-width: 768px) { .video-grid { flex-direction: row; padding: 20px; } }

            .video-box { 
                flex: 1; position: relative; border-radius: 20px; overflow: hidden;
                background: #000; border: 2.5px solid rgba(0, 242, 255, 0.2); max-height: 45%;
                box-shadow: 0 0 20px rgba(0,0,0,0.5);
            }
            @media (min-width: 768px) { .video-box { max-height: 100%; } }

            video { width: 100%; height: 100%; object-fit: cover; background: #000; }
            /* SS1 Wala Neon Look */
            #remoteVideo { border: 3px solid #ff0055; box-shadow: 0 0 25px rgba(255, 0, 85, 0.4); }
            #localVideo { transform: scaleX(-1); border: 3px solid #00f2ff; box-shadow: 0 0 25px rgba(0, 242, 255, 0.4); }

            /* SS2 Wala Button Setup in SS1 Style */
            .controls { 
                padding: 15px; display: flex; justify-content: center; 
                gap: 12px; background: #0a0a1a; border-top: 2px solid #1a1a3a;
                padding-bottom: env(safe-area-inset-bottom);
            }
            .btn {
                flex: 1; max-width: 140px; height: 55px; border: none; border-radius: 12px;
                font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 13px;
                transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                display: flex; align-items: center; justify-content: center;
            }

            .start-btn { 
                background: #00f2ff; color: #000; 
                box-shadow: 0 0 20px rgba(0, 242, 255, 0.6); 
            }
            .next-btn { 
                background: #2ecc71; color: #000; 
                box-shadow: 0 0 20px rgba(46, 204, 113, 0.6); 
                display: none; 
            }
            .stop-btn { 
                background: #ff0055; color: white; 
                box-shadow: 0 0 20px rgba(255, 0, 85, 0.6); 
                display: none;
            }
            
            .btn:active { transform: scale(0.9); }
            .label { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.7); padding: 5px 12px; border-radius: 6px; font-size: 10px; border: 1px solid #333; z-index: 10; color: #fff; }
        </style>
    </head>
    <body>
        <div id="status">NEON SYSTEM: IDLE</div>
        <div class="video-grid">
            <div class="video-box">
                <video id="remoteVideo" autoplay playsinline></video>
                <div class="label">STRANGER SOURCE</div>
            </div>
            <div class="video-box">
                <video id="localVideo" autoplay muted playsinline></video>
                <div class="label">LOCAL SOURCE</div>
            </div>
        </div>
        <div class="controls">
            <button id="startBtn" class="btn start-btn" onclick="joinMatrix()">START</button>
            <button id="nextBtn" class="btn next-btn" onclick="nextMatch()">NEXT</button>
            <button id="stopBtn" class="btn stop-btn" onclick="stopEverything()">STOP</button>
        </div>

        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            let localStream, pc, currentRoomId;
            const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

            async function joinMatrix() {
                try {
                    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    document.getElementById('localVideo').srcObject = localStream;
                    socket.emit('start-match');
                    
                    document.getElementById('startBtn').style.display = 'none';
                    document.getElementById('stopBtn').style.display = 'flex';
                    document.getElementById('status').innerText = "SEARCHING MATRIX...";
                } catch(e) { alert("Camera Access Denied!"); }
            }

            function nextMatch() {
                if(pc) pc.close();
                document.getElementById('remoteVideo').srcObject = null;
                socket.emit('start-match');
                document.getElementById('status').innerText = "SCANNING NEW SOURCE...";
            }

            function stopEverything() {
                location.reload(); 
            }

            socket.on('matched', async (roomId) => {
                currentRoomId = roomId;
                document.getElementById('status').innerText = "CONNECTION SECURED";
                document.getElementById('nextBtn').style.display = 'flex';
                
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
