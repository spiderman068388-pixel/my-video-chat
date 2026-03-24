const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>OmeTV Premium</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; }
        body { background: #f0f2f5; height: 100vh; display: flex; flex-direction: column; }
        .video-container { flex: 1; display: flex; background: #000; gap: 1px; }
        .v-box { flex: 1; position: relative; background: #1a1a1a; display: flex; align-items: center; justify-content: center; }
        video { width: 100%; height: 100%; object-fit: cover; }
        #localVideo { transform: scaleX(-1); }
        .tag { position: absolute; top: 15px; left: 15px; background: rgba(0,0,0,0.5); color: #fff; padding: 5px 12px; border-radius: 6px; font-size: 12px; z-index: 5; }
        
        /* Chat Messages Overlay */
        #chat-display { position: absolute; bottom: 10px; left: 10px; right: 10px; max-height: 150px; overflow-y: auto; z-index: 10; display: flex; flex-direction: column; gap: 5px; pointer-events: none; }
        .msg { background: rgba(0,0,0,0.6); color: white; padding: 5px 10px; border-radius: 5px; font-size: 14px; align-self: flex-start; pointer-events: auto; }

        .bottom-nav { background: #fff; height: 120px; display: flex; align-items: center; padding: 0 15px; gap: 10px; border-top: 1px solid #ddd; }
        .btn-main { width: 85px; height: 85px; border-radius: 22px; border: none; cursor: pointer; font-weight: bold; transition: 0.2s; display: flex; align-items: center; justify-content: center; font-size: 16px; color: white; }
        .start { background: #58d68d; box-shadow: 0 5px 0 #2d9658; }
        .stop { background: #f1948a; box-shadow: 0 5px 0 #c0392b; }

        .option-box { width: 85px; height: 85px; background: #f8f9fa; border: 1px solid #eee; border-radius: 22px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; position: relative; }
        .option-box span { font-size: 9px; color: #aaa; text-transform: uppercase; margin-bottom: 4px; }
        .option-box b { font-size: 14px; color: #333; }
        .option-box select { position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

        .chat-input-area { flex: 1; margin-left: 10px; }
        .msg-input { width: 100%; padding: 15px; border-radius: 15px; border: none; background: #f1f3f4; outline: none; font-size: 16px; }
        @media (max-width: 600px) { .video-container { flex-direction: column; } .btn-main, .option-box { width: 65px; height: 65px; } }
    </style>
</head>
<body>
    <div class="video-container">
        <div class="v-box" id="remoteBox">
            <div class="tag">Stranger</div>
            <div id="chat-display"></div>
        </div>
        <div class="v-box" id="localBox"><div class="tag">You</div></div>
    </div>

    <div class="bottom-nav">
        <button class="btn-main start" id="startBtn">Start</button>
        <button class="btn-main stop" onclick="location.reload()">Stop</button>

        <div class="option-box">
            <span>Country</span><b id="cDisplay">IN 🇮🇳</b>
            <select id="cSelect">
                <option value="ALL">World 🌐</option><option value="IN">India 🇮🇳</option><option value="US">USA 🇺🇸</option>
                <option value="RU">Russia 🇷🇺</option><option value="BR">Brazil 🇧🇷</option><option value="DE">Germany 🇩🇪</option>
                <option value="FR">France 🇫🇷</option><option value="IT">Italy 🇮🇹</option><option value="ES">Spain 🇪🇸</option>
                <option value="CA">Canada 🇨🇦</option><option value="AU">Australia 🇦🇺</option><option value="JP">Japan 🇯🇵</option>
            </select>
        </div>

        <div class="option-box">
            <span>Gender</span><b id="gDisplay">Boy 👨</b>
            <select id="gSelect">
                <option value="male">Boy 👨</option><option value="female">Girl 👩</option><option value="couple">Couple 👫</option>
            </select>
        </div>

        <div class="chat-input-area">
            <input type="text" id="chatInput" class="msg-input" placeholder="Type message & Enter...">
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let stream;
        const cSelect = document.getElementById('cSelect'), cDisplay = document.getElementById('cDisplay');
        const gSelect = document.getElementById('gSelect'), gDisplay = document.getElementById('gDisplay');
        const chatInput = document.getElementById('chatInput'), chatDisplay = document.getElementById('chatDisplay');

        // Chat Logic
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && chatInput.value.trim() !== "") {
                const msg = chatInput.value;
                socket.emit('send-msg', msg);
                addMessage("You: " + msg);
                chatInput.value = "";
            }
        });

        socket.on('recv-msg', (msg) => { addMessage("Stranger: " + msg); });

        function addMessage(text) {
            const div = document.createElement('div');
            div.className = 'msg';
            div.innerText = text;
            chatDisplay.appendChild(div);
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
            setTimeout(() => div.remove(), 10000); // 10 sec baad gayab
        }

        cSelect.onchange = () => cDisplay.innerText = cSelect.options[cSelect.selectedIndex].text;
        gSelect.onchange = () => gDisplay.innerText = gSelect.options[gSelect.selectedIndex].text;

        async function init() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
                document.getElementById('localBox').innerHTML += '<video id="localVideo" autoplay muted playsinline></video>';
                document.getElementById('localVideo').srcObject = stream;
            } catch(e) { alert("Camera Error!"); }
        }

        window.onload = init;
        document.getElementById('startBtn').onclick = () => {
            document.getElementById('startBtn').innerText = "Next";
            socket.emit('find-partner', { country: cSelect.value, gender: gSelect.value });
        };
    </script>
</body>
</html>
    `);
});

// Matching & Message Logic
let users = [];
io.on('connection', (socket) => {
    socket.on('find-partner', (data) => {
        // Simple logic for now, matches anyone
        socket.broadcast.emit('partner-found'); 
    });
    socket.on('send-msg', (msg) => {
        socket.broadcast.emit('recv-msg', msg);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Final Phase 1 Live'));
