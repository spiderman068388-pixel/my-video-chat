const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>OmeTV Slide Pro</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; }
        body { background: #000; height: 100vh; display: flex; flex-direction: column; overflow: hidden; position: fixed; width: 100%; }

        /* Full Screen Video Stack */
        .video-container { flex: 1; display: flex; flex-direction: column; background: #000; position: relative; }
        .v-box { flex: 1; position: relative; background: #111; border-bottom: 1px solid #222; overflow: hidden; }
        video { width: 100%; height: 100%; object-fit: cover; }
        #localVideo { transform: scaleX(-1); }

        /* Floating Info Tags */
        .tag { position: absolute; top: 15px; left: 15px; background: rgba(0,0,0,0.4); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 11px; z-index: 20; pointer-events: none; }

        /* Gesture Overlay - Detects Swipes */
        #gesture-zone { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 50; }

        /* Bottom Minimal Controls */
        .bottom-ui { position: absolute; bottom: 0; width: 100%; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 20px; display: flex; align-items: center; gap: 10px; z-index: 60; }
        
        .opt-bubble { background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); color: white; padding: 10px 15px; border-radius: 20px; font-size: 13px; position: relative; border: 1px solid rgba(255,255,255,0.3); }
        .opt-bubble select { position: absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer; }

        .chat-pill { flex: 1; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); border-radius: 25px; padding: 12px 20px; color: white; outline: none; font-size: 16px; }
        .chat-pill::placeholder { color: rgba(255,255,255,0.6); }

        /* Hint for user */
        .swipe-hint { position: absolute; top: 50%; width: 100%; text-align: center; color: rgba(255,255,255,0.3); font-size: 12px; pointer-events: none; z-index: 5; }
    </style>
</head>
<body>

    <div class="video-container" id="gesture-zone">
        <div class="swipe-hint">Slide left/right to find someone</div>
        <div class="v-box" id="remoteBox">
            <div class="tag">STRANGER</div>
            <div id="status" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#444;">Ready</div>
        </div>
        <div class="v-box" id="localBox">
            <div class="tag">YOU</div>
        </div>
    </div>

    <div class="bottom-ui">
        <div class="opt-bubble">
            <span id="cLab">India 🇮🇳</span>
            <select id="cInp">
                <option value="IN">India 🇮🇳</option>
                <option value="ALL">World 🌐</option>
            </select>
        </div>
        
        <div class="opt-bubble">
            <span id="gLab">Boy 👨</span>
            <select id="gInp">
                <option value="male">Boy 👨</option>
                <option value="female">Girl 👩</option>
            </select>
        </div>

        <input type="text" class="chat-pill" placeholder="Type a message...">
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let startX = 0;

        // 1. Gesture Detection (Swipe)
        const zone = document.getElementById('gesture-zone');
        zone.addEventListener('touchstart', e => startX = e.touches[0].clientX);
        zone.addEventListener('touchend', e => {
            let endX = e.changedTouches[0].clientX;
            if (Math.abs(startX - endX) > 50) { // Agar 50px se zada slide kiya
                changePartner();
            }
        });

        function changePartner() {
            document.getElementById('status').innerText = "Finding...";
            socket.emit('next');
            // Flash effect like OmeTV
            zone.style.opacity = '0.5';
            setTimeout(() => zone.style.opacity = '1', 150);
        }

        // 2. Dropdown Sync
        const cInp = document.getElementById('cInp'), cLab = document.getElementById('cLab');
        const gInp = document.getElementById('gInp'), gLab = document.getElementById('gLab');
        cInp.onchange = () => cLab.innerText = cInp.options[cInp.selectedIndex].text;
        gInp.onchange = () => gLab.innerText = gInp.options[gInp.selectedIndex].text;

        // 3. Camera
        async function start() {
            try {
                const s = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
                const v = document.createElement('video');
                v.id="localVideo"; v.srcObject=s; v.autoplay=true; v.muted=true; v.playsInline=true;
                document.getElementById('localBox').appendChild(v);
            } catch(e) { alert("Enable Camera"); }
        }
        window.onload = start;
    </script>
</body>
</html>
    `);
});

io.on('connection', (socket) => {
    socket.on('next', () => socket.broadcast.emit('searching'));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Swipe Mode Active'));
