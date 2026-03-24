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
    <title>OmeTV Clone</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; }
        body { background: #f0f2f5; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
        .video-container { flex: 1; display: flex; background: #000; gap: 2px; }
        .v-box { flex: 1; position: relative; background: #1a1a1a; display: flex; align-items: center; justify-content: center; }
        video { width: 100%; height: 100%; object-fit: cover; }
        #localVideo { transform: scaleX(-1); }
        .tag { position: absolute; top: 15px; left: 15px; background: rgba(0,0,0,0.5); color: #fff; padding: 5px 12px; border-radius: 6px; font-size: 12px; z-index: 5; }
        
        #chat-display { position: absolute; bottom: 10px; left: 10px; right: 10px; max-height: 120px; overflow-y: auto; z-index: 10; display: flex; flex-direction: column; gap: 4px; pointer-events: none; }
        .msg { background: rgba(255,255,255,0.9); color: #333; padding: 6px 12px; border-radius: 12px; font-size: 14px; align-self: flex-start; pointer-events: auto; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }

        .bottom-nav { background: #fff; height: 110px; display: flex; align-items: center; padding: 0 15px; gap: 10px; border-top: 1px solid #ddd; }
        .btn-main { width: 80px; height: 80px; border-radius: 20px; border: none; cursor: pointer; font-weight: bold; transition: 0.2s; color: white; font-size: 15px; }
        .start { background: #58d68d; box-shadow: 0 4px 0 #2d9658; }
        .start:active { transform: translateY(2px); box-shadow: 0 2px 0 #2d9658; }
        .stop { background: #f1948a; box-shadow: 0 4px 0 #c0392b; }

        .option-box { width: 80px; height: 80px; background: #f8f9fa; border: 1px solid #eee; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
        .option-box span { font-size: 9px; color: #aaa; text-transform: uppercase; margin-bottom: 2px; }
        .option-box b { font-size: 13px; color: #333; }
        .option-box select { position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

        .chat-area { flex: 1; margin-left: 5px; }
        .msg-input { width: 100%; padding: 15px; border-radius: 15px; border: none; background: #f1f3f4; outline: none; font-size: 16px; }
    </style>
</head>
<body>
    <div class="video-container">
        <div class="v-box"><div class="tag">Stranger</div><div id="status" style="color:#555">Connecting...</div><div id="chat-display"></div></div>
        <div class="v-box" id="localBox"><div class="tag">You</div></div>
    </div>

    <div class="bottom-nav">
        <button class="btn-main start" id="startBtn">Start</button>
        <button class="btn-main stop" onclick="location.reload()">Stop</button>

        <div class="option-box">
            <span>Country</span><b id="cDisp">IN 🇮🇳</b>
            <select id="cSel">
                <option value="IN">India 🇮🇳</option><option value="US">USA 🇺🇸</option><option value="ALL">World 🌐</option>
            </select>
        </div>

        <div class="option-box">
            <span>Gender</span><b id="gDisp">Boy 👦</b>
            <select id="gSel">
                <option value="male">Boy 👦</option><option value="female">Girl 👧</option>
            </select>
        </div>

        <div class="chat-area">
            <input type="text" id="chatInp" class="msg-input" placeholder="Type message...">
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const cSel = document.getElementById('cSel'), cDisp = document.getElementById('cDisp');
        const gSel = document.getElementById('gSel'), gDisp = document.getElementById('gDisp');
        const chatInp = document.getElementById('chatInp'), chatDisp = document.getElementById('chat-display');

        cSel.onchange = () => cDisp.innerText = cSel.options[cSel.selectedIndex].text;
        gSel.onchange = () => gDisp.innerText = gSel.options[gSel.selectedIndex].text;

        chatInp.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && chatInp.value.trim() !== "") {
                const text = chatInp.value;
                socket.emit('chat-msg', text);
                showMsg("You: " + text);
                chatInp.value = "";
            }
        });

        socket.on('chat-msg', (msg) => showMsg("Stranger: " + msg));

        function showMsg(t) {
            const d = document.createElement('div');
            d.className = 'msg'; d.innerText = t;
            chatDisp.appendChild(d);
            chatDisp.scrollTop = chatDisp.scrollHeight;
            setTimeout(() => d.remove(), 8000);
        }

        async function startCam() {
            try {
                const s = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
                const v = document.createElement('video');
                v.id = "localVideo"; v.srcObject = s; v.autoplay = true; v.muted = true; v.playsInline = true;
                document.getElementById('localBox').appendChild(v);
            } catch(e) { console.log("Cam Error"); }
        }
        window.onload = startCam;

        document.getElementById('startBtn').onclick = () => {
            document.getElementById('startBtn').innerText = "Next";
            socket.emit('next-user');
        };
    </script>
</body>
</html>
    `);
});

io.on('connection', (socket) => {
    socket.on('chat-msg', (msg) => socket.broadcast.emit('chat-msg', msg));
    socket.on('next-user', () => console.log('Searching...'));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Server Ready'));
