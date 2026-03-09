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
        <title>Cyber OmeTV Pro Max - Login Interface</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
                background: #050510; color: #00f2ff; 
                font-family: 'Segoe UI', sans-serif; height: 100vh;
                display: flex; flex-direction: column; overflow: hidden;
            }
            #status { 
                height: 40px; display: flex; align-items: center; justify-content: center;
                font-size: 13px; font-weight: bold; letter-spacing: 2px;
                background: rgba(0,0,0,0.8); border-bottom: 1px solid rgba(0, 242, 255, 0.2);
                text-transform: uppercase; text-shadow: 0 0 10px #00f2ff;
            }
            .video-grid { flex: 1; display: flex; flex-direction: column; padding: 10px; gap: 12px; }
            @media (min-width: 768px) { .video-grid { flex-direction: row; padding: 20px; } }

            .video-box { 
                flex: 1; position: relative; border-radius: 20px; overflow: hidden;
                background: #000; max-height: 45%;
                box-shadow: 0 0 20px rgba(0,0,0,0.5);
            }
            @media (min-width: 768px) { .video-box { max-height: 100%; } }

            video { width: 100%; height: 100%; object-fit: cover; background: #000; }
            
            /* Cyber Glow Style */
            #remoteVideoBox { border: 3px solid #ff0055; box-shadow: 0 0 25px rgba(255, 0, 85, 0.4); }
            #localVideoBox { border: 3px solid #00f2ff; box-shadow: 0 0 25px rgba(0, 242, 255, 0.4); }
            #localVideo { transform: scaleX(-1); }

            /* Bottom Buttons Section - Based on your SS */
            .controls { 
                padding: 12px; display: flex; flex-wrap: wrap; justify-content: center; 
                gap: 8px; background: #0a0a1a; border-top: 2px solid #1a1a3a;
                padding-bottom: env(safe-area-inset-bottom);
            }
            .btn {
                height: 52px; border: none; border-radius: 10px; font-weight: bold;
                cursor: pointer; text-transform: uppercase; font-size: 11px;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                transition: 0.2s; min-width: 75px; flex: 1;
            }

            .next-btn { background: #2ecc71; color: #000; box-shadow: 0 0 15px rgba(46, 204, 113, 0.4); }
            .stop-btn { background: #ff3e3e; color: white; box-shadow: 0 0 15px rgba(255, 62, 62, 0.4); }
            .info-btn { background: #ffffff; color: #000; border: 1px solid #ddd; }
            .start-btn { background: #00f2ff; color: #000; font-size: 14px; box-shadow: 0 0 20px #00f2ff; min-width: 100px; }

            .btn:active { transform: scale(0.9); }
            .label { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.7); padding: 4px 10px; border-radius: 5px; font-size: 10px; z-index: 10; border: 1px solid #333; }
        </style>
    </head>
    <body>
        <div id="status">CYBER SYSTEM ONLINE</div>
        <div class="video-grid">
            <div id="remoteVideoBox" class="video-box">
                <video id="remoteVideo" autoplay playsinline></video>
                <div class="label">STRANGER SOURCE</div>
            </div>
            <div id="localVideoBox" class="video-box">
                <video id="localVideo" autoplay muted playsinline></video>
                <div class="label">LOCAL SOURCE</div>
            </div>
        </div>
        
        <div class="controls">
            <button class="btn next-btn" onclick="nextMatch()">NEXT</button>
            <button class="btn stop-btn" onclick="location.reload()">STOP</button>
            <button class="btn info-btn">Country<br><b>INDIA</b></button>
            <button class="btn info-btn">I AM<br><b>👦</b></button>
            <button id="startBtn" class="btn start-btn" onclick="joinMatrix()">START</button>
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
                    document.getElementById('status').innerText = "SEARCHING FOR STRANGERS...";
                    document.getElementById('startBtn').innerText = "JOINED";
                    document.getElementById('startBtn').style.opacity = "0.7";
                } catch(e) { alert("Camera Access Dedo Bhai!"); }
            }

            function nextMatch() {
                if(pc) pc.close();
                document.getElementById('remoteVideo').srcObject = null;
                socket.emit('start-match');
                document.getElementById('status').innerText = "FINDING NEXT...";
            }

            socket.on('matched', async (roomId) => {
                currentRoomId = roomId;
                document.getElementById('status').innerText = "SUBJECT LOCATED!";
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
