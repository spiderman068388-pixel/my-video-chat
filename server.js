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
        <title>Cyber OmeTV Final</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; touch-action: none; }
            body { 
                background: #050510; color: #00f2ff; font-family: 'Segoe UI', sans-serif; 
                height: 100vh; display: flex; flex-direction: column; overflow: hidden;
            }
            #status { height: 35px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; background: #000; border-bottom: 1px solid #1a1a3a; text-transform: uppercase; }

            /* Grid Fix */
            .video-grid { flex: 1; display: flex; flex-direction: column; padding: 10px; gap: 10px; position: relative; }
            @media (min-width: 768px) { .video-grid { flex-direction: row; padding: 15px; } }

            /* Video Boxes with SS1 Neon Style */
            .video-box { flex: 1; position: relative; border-radius: 12px; overflow: hidden; background: #000; transition: transform 0.3s ease-out; }
            #remoteVideoBox { border: 3px solid #ff0055; box-shadow: 0 0 15px rgba(255, 0, 85, 0.3); z-index: 2; }
            #localVideoBox { border: 3px solid #00f2ff; box-shadow: 0 0 15px rgba(0, 242, 255, 0.3); }
            video { width: 100%; height: 100%; object-fit: cover; }
            #localVideo { transform: scaleX(-1); }

            /* Country & Gender Bar (Exact SS2 Style) */
            .selectors { display: flex; justify-content: center; gap: 5px; padding: 10px; background: #0a0a1a; }
            .select-item { background: #fff; color: #000; padding: 4px 10px; border-radius: 5px; font-size: 10px; text-align: center; font-weight: bold; flex: 1; max-width: 100px; line-height: 1.2; }

            /* Bottom Buttons */
            .controls { padding: 10px; display: flex; justify-content: center; gap: 8px; background: #000; padding-bottom: env(safe-area-inset-bottom); }
            .btn { flex: 1; max-width: 120px; height: 45px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 12px; }
            .next-btn { background: #2ecc71; color: #000; }
            .stop-btn { background: #ff3e3e; color: #fff; }
            .start-btn { background: #00f2ff; color: #000; box-shadow: 0 0 15px #00f2ff; }

            .label { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.6); padding: 3px 8px; border-radius: 4px; font-size: 9px; z-index: 10; }
            .slide-animation { transform: translateX(-150%) rotate(-15deg) !important; opacity: 0; }
        </style>
    </head>
    <body>
        <div id="status">CYBER SEARCH ACTIVE</div>
        <div class="video-grid" id="touchArea">
            <div id="remoteVideoBox" class="video-box">
                <video id="remoteVideo" autoplay playsinline></video>
                <div class="label">STRANGER</div>
            </div>
            <div id="localVideoBox" class="video-box">
                <video id="localVideo" autoplay muted playsinline></video>
                <div class="label">YOU</div>
            </div>
        </div>
        <div class="selectors">
            <div class="select-item">Country<br><b>INDIA 🇮🇳</b></div>
            <div class="select-item">I AM<br><b>MALE 👦</b></div>
        </div>
        <div class="controls">
            <button class="btn next-btn" onclick="nextMatch()">NEXT</button>
            <button class="btn stop-btn" onclick="location.reload()">STOP</button>
            <button id="startBtn" class="btn start-btn" onclick="joinMatrix()">START</button>
        </div>

        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            let localStream, pc, currentRoomId;
            let startX = 0;
            const remoteBox = document.getElementById('remoteVideoBox');

            // Slide Gesture for Mobile
            remoteBox.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
            remoteBox.addEventListener('touchmove', e => {
                let moveX = e.touches[0].clientX - startX;
                if(moveX < 0) remoteBox.style.transform = "translateX("+moveX+"px) rotate("+(moveX/25)+"deg)";
            });
            remoteBox.addEventListener('touchend', e => {
                if (startX - e.changedTouches[0].clientX > 100) nextMatch();
                else remoteBox.style.transform = "translateX(0) rotate(0)";
            });

            async function joinMatrix() {
                try {
                    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    document.getElementById('localVideo').srcObject = localStream;
                    socket.emit('start-match');
                    document.getElementById('startBtn').innerText = "LIVE";
                } catch(e) { alert("Camera Access Required!"); }
            }

            function nextMatch() {
                remoteBox.classList.add('slide-animation');
                setTimeout(() => {
                    if(pc) pc.close();
                    document.getElementById('remoteVideo').srcObject = null;
                    socket.emit('start-match');
                    remoteBox.classList.remove('slide-animation');
                    remoteBox.style.transform = "translateX(0) rotate(0)";
                }, 300);
            }

            socket.on('matched', async (roomId) => {
                currentRoomId = roomId;
                pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
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
