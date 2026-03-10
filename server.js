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
                background: #000; color: #fff; font-family: 'Segoe UI', sans-serif; 
                height: 100vh; display: flex; flex-direction: column; overflow: hidden;
            }
            #status { height: 35px; display: flex; align-items: center; justify-content: center; font-size: 11px; background: #0a0a1a; color: #00f2ff; font-weight: bold; border-bottom: 1px solid #1a1a3a; }

            .video-grid { flex: 1; display: flex; flex-direction: column; padding: 10px; gap: 10px; position: relative; }
            @media (min-width: 768px) { .video-grid { flex-direction: row; } }

            .video-box { flex: 1; position: relative; border-radius: 15px; overflow: hidden; background: #111; transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
            
            /* SS Style Neon Borders */
            #remoteVideoBox { border: 3px solid #ff0055; box-shadow: 0 0 20px rgba(255, 0, 85, 0.4); z-index: 2; }
            #localVideoBox { border: 3px solid #00f2ff; box-shadow: 0 0 20px rgba(0, 242, 255, 0.4); }
            
            video { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
            #localVideo { transform: scaleX(-1); }

            /* Bottom Panel - As per SS 000853 */
            .bottom-bar { background: #fff; padding: 10px; display: flex; flex-direction: column; gap: 8px; border-top-left-radius: 15px; border-top-right-radius: 15px; }
            
            .selectors { display: flex; justify-content: center; gap: 5px; }
            .select-item { 
                background: #f1f1f1; color: #333; padding: 5px; border-radius: 6px; 
                flex: 1; text-align: center; font-size: 10px; border: 1px solid #ddd; font-weight: bold;
            }

            .controls { display: flex; gap: 5px; justify-content: center; width: 100%; }
            .btn { flex: 1; height: 48px; border: none; border-radius: 10px; font-weight: bold; font-size: 11px; cursor: pointer; text-transform: uppercase; }
            
            .next-btn { background: #34c759; color: #fff; }
            .stop-btn { background: #ff3b30; color: #fff; }
            .start-btn { background: #007aff; color: #fff; box-shadow: 0 4px 10px rgba(0,122,255,0.4); }

            .label { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6); padding: 3px 8px; border-radius: 5px; font-size: 10px; z-index: 10; }
            .slide-away { transform: translateX(-150%) rotate(-15deg); opacity: 0; }
        </style>
    </head>
    <body>
        <div id="status">CYBER SEARCH ACTIVE</div>
        
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

        <div class="bottom-bar">
            <div class="selectors">
                <div class="select-item">COUNTRY<br><span style="color:#007aff">INDIA 🇮🇳</span></div>
                <div class="select-item">I AM<br><span style="color:#007aff">MALE 👦</span></div>
            </div>
            <div class="controls">
                <button class="btn next-btn" onclick="nextMatch()">NEXT</button>
                <button class="btn stop-btn" onclick="location.reload()">STOP</button>
                <button id="startBtn" class="btn start-btn" onclick="joinMatrix()">START</button>
            </div>
        </div>

        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            let localStream, pc, currentRoomId;
            let startX = 0;
            const remoteBox = document.getElementById('remoteVideoBox');

            // Slide Logic (Touch)
            remoteBox.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
            remoteBox.addEventListener('touchmove', e => {
                let x = e.touches[0].clientX - startX;
                if(x < 0) remoteBox.style.transform = "translateX("+x+"px) rotate("+(x/35)+"deg)";
            });
            remoteBox.addEventListener('touchend', e => {
                if (startX - e.changedTouches[0].clientX > 100) nextMatch();
                else remoteBox.style.transform = "none";
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
