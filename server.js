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
        <title>Cyber OmeTV Pro</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; touch-action: none; }
            body { 
                background: #000; color: #fff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                height: 100vh; display: flex; flex-direction: column; overflow: hidden;
            }
            
            /* Top Search Bar */
            #status { height: 35px; display: flex; align-items: center; justify-content: center; font-size: 11px; background: #000; color: #00f2ff; font-weight: bold; border-bottom: 1px solid #1a1a3a; text-transform: uppercase; }

            /* Video Display Area */
            .video-grid { flex: 1; display: flex; flex-direction: column; padding: 10px; gap: 8px; position: relative; }
            @media (min-width: 768px) { .video-grid { flex-direction: row; } }

            .video-box { flex: 1; position: relative; border-radius: 12px; overflow: hidden; background: #111; transition: transform 0.3s ease; }
            
            /* SS1 Style Neon Borders */
            #remoteVideoBox { border: 3.5px solid #ff0055; box-shadow: 0 0 15px rgba(255, 0, 85, 0.4); z-index: 2; }
            #localVideoBox { border: 3.5px solid #00f2ff; box-shadow: 0 0 15px rgba(0, 242, 255, 0.4); }
            
            video { width: 100%; height: 100%; object-fit: cover; }
            #localVideo { transform: scaleX(-1); }

            /* THE BUTTONS YOU WANTED (Exact SS 001457 Style) */
            .bottom-panel { background: #f2f2f2; padding: 12px; display: flex; flex-direction: column; gap: 10px; border-top: 1px solid #ccc; }
            
            .selectors { display: flex; justify-content: center; gap: 8px; }
            .select-item { 
                background: #fff; color: #333; padding: 8px; border-radius: 6px; 
                flex: 1; text-align: center; font-size: 11px; border: 1px solid #ddd; font-weight: bold;
                line-height: 1.2;
            }
            .select-item b { color: #007aff; display: block; font-size: 12px; }

            .controls { display: flex; gap: 8px; justify-content: center; width: 100%; }
            .btn { flex: 1; height: 50px; border: none; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; text-transform: uppercase; }
            
            .stop-btn { background: #eb4d4b; color: #fff; }
            .next-btn { background: #6ab04c; color: #fff; }
            .start-btn { background: #0984e3; color: #fff; flex: 1.5; box-shadow: 0 4px 0 #0652dd; }
            .start-btn:active { transform: translateY(2px); box-shadow: none; }

            .label { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.6); padding: 3px 8px; border-radius: 4px; font-size: 9px; z-index: 10; color: #fff; }
            
            /* Slide Animation */
            .slide-away { transform: translateX(-150%) rotate(-10deg); opacity: 0; }
        </style>
    </head>
    <body>
        <div id="status">Searching for strangers...</div>
        
        <div class="video-grid">
            <div id="remoteVideoBox" class="video-box">
                <video id="remoteVideo" autoplay playsinline></video>
                <div class="label">STRANGER</div>
            </div>
            <div id="localVideoBox" class="video-box">
                <video id="localVideo" autoplay muted playsinline></video>
                <div class="label">YOU</div>
            </div>
        </div>

        <div class="bottom-panel">
            <div class="selectors">
                <div class="select-item">COUNTRY <b>INDIA 🇮🇳</b></div>
                <div class="select-item">I AM <b>MALE 👦</b></div>
            </div>
            <div class="controls">
                <button class="btn stop-btn" onclick="location.reload()">STOP</button>
                <button class="btn next-btn" onclick="nextMatch()">NEXT</button>
                <button id="startBtn" class="btn start-btn" onclick="joinMatrix()">START</button>
            </div>
        </div>

        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            let localStream, pc, currentRoomId;
            let startX = 0;
            const remoteBox = document.getElementById('remoteVideoBox');

            // Slide Logic (Touch Move)
            remoteBox.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
            remoteBox.addEventListener('touchmove', e => {
                let x = e.touches[0].clientX - startX;
                if(x < 0) remoteBox.style.transform = "translateX("+x+"px) rotate("+(x/40)+"deg)";
            });
            remoteBox.addEventListener('touchend', e => {
                if (startX - e.changedTouches[0].clientX > 120) nextMatch();
                else remoteBox.style.transform = "none";
            });

            async function joinMatrix() {
                try {
                    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    document.getElementById('localVideo').srcObject = localStream;
                    socket.emit('start-match');
                    document.getElementById('status').innerText = "Connecting...";
                    document.getElementById('startBtn').innerText = "LIVE";
                } catch(e) { alert("Please allow camera access!"); }
            }

            function nextMatch() {
                remoteBox.classList.add('slide-away');
                setTimeout(() => {
                    if(pc) pc.close();
                    document.getElementById('remoteVideo').srcObject = null;
                    socket.emit('start-match');
                    remoteBox.classList.remove('slide-away');
                    remoteBox.style.transform = "none";
                }, 300);
            }

            socket.on('matched', async (roomId) => {
                currentRoomId = roomId;
                document.getElementById('status').innerText = "Stranger found!";
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
