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
    <title>OmeTV Premium Clone</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, sans-serif; }
        body { background: #f0f2f5; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

        /* Video Section */
        .video-container { flex: 1; display: flex; background: #000; gap: 2px; position: relative; }
        .v-box { flex: 1; position: relative; background: #1a1a1a; display: flex; align-items: center; justify-content: center; }
        video { width: 100%; height: 100%; object-fit: cover; }
        #localVideo { transform: scaleX(-1); }
        .tag { position: absolute; top: 15px; left: 15px; background: rgba(0,0,0,0.6); color: #fff; padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; z-index: 5; }

        /* Chat Overlay */
        #chat-display { position: absolute; bottom: 15px; left: 15px; right: 15px; max-height: 150px; overflow-y: auto; z-index: 10; display: flex; flex-direction: column; gap: 6px; pointer-events: none; }
        .msg { background: rgba(255,255,255,0.95); color: #222; padding: 8px 14px; border-radius: 18px; font-size: 14px; align-self: flex-start; pointer-events: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 80%; }

        /* Navigation Bar (Premium Look) */
        .bottom-nav { background: #fff; height: 120px; display: flex; align-items: center; padding: 0 20px; gap: 12px; border-top: 1px solid #eee; }
        
        .btn-main { width: 90px; height: 90px; border-radius: 25px; border: none; cursor: pointer; font-weight: 800; transition: 0.2s; font-size: 16px; color: white; display: flex; align-items: center; justify-content: center; }
        .start { background: #58d68d; box-shadow: 0 6px 0 #2d9658; }
        .start:active { transform: translateY(3px); box-shadow: 0 3px 0 #2d9658; }
        .stop { background: #f1948a; box-shadow: 0 6px 0 #c0392b; }

        /* Fixed Option Boxes */
        .option-box { width: 90px; height: 90px; background: #fdfdfd; border: 1.5px solid #f0f0f0; border-radius: 25px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; position: relative; transition: 0.2s; }
        .option-box:hover { background: #f8f9fa; }
        .option-box span { font-size: 10px; color: #bbb; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; }
        .option-box b { font-size: 14px; color: #444; text-align: center; }
        .option-box select { position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 2; }

        /* Message Input */
        .chat-area { flex: 1; margin-left: 10px; }
        .msg-input { width: 100%; padding: 18px; border-radius: 20px; border: none; background: #f3f5f7; outline: none; font-size: 16px; transition: 0.2s; }
        .msg-input:focus { background: #ebedef; }

        @media (max-width: 600px) {
            .video-container { flex-direction: column; }
            .btn-main, .option-box { width: 70px; height: 70px; border-radius: 18px; font-size: 14px; }
            .bottom-nav { height: 100px; padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="video-container">
        <div class="v-box" id="remoteBox">
            <div class="tag">Stranger</div>
            <div id="status" style="color: #666; font-size: 14px;">Searching...</div>
            <div id="chat-display"></div>
        </div>
        <div class="v-box" id="localBox"><div class="tag">You</div></div>
    </div>

    <div class="bottom-nav">
        <button class="btn-main start" id="startBtn">Start</button>
        <button class="btn-main stop" onclick="location.reload()">Stop</button>

        <div class="option-box">
            <span>Country</span>
            <b id="cDisplay">India 🇮🇳</b>
            <select id="cSelect">
                <option value="IN">India 🇮🇳</option>
                <option value="US">USA 🇺🇸</option>
                <option value="RU">Russia 🇷🇺</option>
                <option value="BR">Brazil 🇧🇷</option>
                <option value="ALL">World 🌐</option>
            </select>
        </div>

        <div class="option-box">
            <span>I am</span>
            <b id="gDisplay">Boy 👦</b>
            <select id="gSelect">
                <option value="male">Boy 👦</option>
                <option value="female">Girl 👧</option>
            </select>
        </div>

        <div class="chat-area">
            <input type="text" id="chatInput" class="msg-input" placeholder="Type a message...">
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const cSelect = document.getElementById('cSelect'), cDisplay = document.getElementById('cDisplay');
        const gSelect = document.getElementById('gSelect'), gDisplay = document.getElementById('gDisplay');
        const chatInput = document.getElementById('chatInput'), chatDisplay = document.getElementById('chat-display');

        // Sync dropdown labels
        cSelect.onchange = () => cDisplay.innerText = cSelect.options[cSelect.selectedIndex].text;
        gSelect.onchange = () => gDisplay.innerText = gSelect.options[gSelect.selectedIndex].text;

        // Chat logic
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && chatInput.value.trim() !== "") {
                const txt = chatInput.value;
                socket.emit('send-message', txt);
                addMessage("You: " + txt);
                chatInput.value = "";
            }
        });

        socket.on('recv-message', (m) => addMessage("Stranger: " + m));

        function addMessage(t) {
            const d = document.createElement('div');
            d.className = 'msg'; d.innerText = t;
            chatDisplay.appendChild(d);
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
            setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 500); }, 7000);
        }

        async function init() {
            try {
                const s = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
                const v = document.createElement('video');
                v.id="localVideo"; v.srcObject=s; v.autoplay=true; v.muted=true; v.playsInline=true;
                document.getElementById('localBox').appendChild(v);
            } catch(e) { console.error("Cam error"); }
        }
        window.onload = init;

        document.getElementById('startBtn').onclick = () => {
            document.getElementById('startBtn').innerText = "Next";
            socket.emit('find');
        };
    </script>
</body>
</html>
    `);
});

io.on('connection', (socket) => {
    socket.on('send-message', (msg) => socket.broadcast.emit('recv-message', msg));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Final Master Server Ready'));
