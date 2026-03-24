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
    <title>Cyber OmeTV Global</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, sans-serif; }
        body { background: #f0f2f5; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

        .video-container { flex: 1; display: flex; background: #000; gap: 2px; position: relative; }
        .v-box { flex: 1; position: relative; background: #1a1a1a; display: flex; align-items: center; justify-content: center; }
        video { width: 100%; height: 100%; object-fit: cover; }
        #localVideo { transform: scaleX(-1); }
        .tag { position: absolute; top: 15px; left: 15px; background: rgba(0,0,0,0.6); color: #fff; padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; z-index: 5; }

        #chat-display { position: absolute; bottom: 15px; left: 15px; right: 15px; max-height: 150px; overflow-y: auto; z-index: 10; display: flex; flex-direction: column; gap: 6px; pointer-events: none; }
        .msg { background: rgba(255,255,255,0.95); color: #222; padding: 8px 14px; border-radius: 18px; font-size: 14px; align-self: flex-start; pointer-events: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 80%; }

        .bottom-nav { background: #fff; height: 120px; display: flex; align-items: center; padding: 0 20px; gap: 12px; border-top: 1px solid #eee; }
        
        .btn-main { width: 85px; height: 85px; border-radius: 25px; border: none; cursor: pointer; font-weight: 800; transition: 0.2s; font-size: 16px; color: white; display: flex; align-items: center; justify-content: center; }
        .start { background: #58d68d; box-shadow: 0 6px 0 #2d9658; }
        .start:active { transform: translateY(3px); box-shadow: 0 3px 0 #2d9658; }
        .stop { background: #f1948a; box-shadow: 0 6px 0 #c0392b; }

        .option-box { width: 90px; height: 90px; background: #fdfdfd; border: 1.5px solid #f0f0f0; border-radius: 25px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; position: relative; }
        .option-box span { font-size: 10px; color: #bbb; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; }
        .option-box b { font-size: 13px; color: #444; text-align: center; white-space: nowrap; overflow: hidden; max-width: 80px; }
        .option-box select { position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 2; }

        .chat-area { flex: 1; margin-left: 10px; }
        .msg-input { width: 100%; padding: 18px; border-radius: 20px; border: none; background: #f3f5f7; outline: none; font-size: 16px; }

        @media (max-width: 600px) {
            .video-container { flex-direction: column; }
            .btn-main, .option-box { width: 65px; height: 65px; border-radius: 18px; font-size: 13px; }
            .bottom-nav { height: 100px; padding: 10px; gap: 8px; }
            .option-box b { font-size: 11px; }
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
            <b id="cDisplay">Loading...</b>
            <select id="cSelect">
                <option value="ALL">World 🌐</option>
                <option value="AF">Afghanistan 🇦🇫</option><option value="AL">Albania 🇦🇱</option><option value="DZ">Algeria 🇩🇿</option>
                <option value="AR">Argentina 🇦🇷</option><option value="AU">Australia 🇦🇺</option><option value="AT">Austria 🇦🇹</option>
                <option value="BD">Bangladesh 🇧🇩</option><option value="BE">Belgium 🇧🇪</option><option value="BR">Brazil 🇧🇷</option>
                <option value="CA">Canada 🇨🇦</option><option value="CN">China 🇨🇳</option><option value="CO">Colombia 🇨🇴</option>
                <option value="DK">Denmark 🇩🇰</option><option value="EG">Egypt 🇪🇬</option><option value="FR">France 🇫🇷</option>
                <option value="DE">Germany 🇩🇪</option><option value="GR">Greece 🇬🇷</option><option value="HK">Hong Kong 🇭🇰</option>
                <option value="IN" selected>India 🇮🇳</option><option value="ID">Indonesia 🇮🇩</option><option value="IR">Iran 🇮🇷</option>
                <option value="IQ">Iraq 🇮🇶</option><option value="IE">Ireland 🇮🇪</option><option value="IL">Israel 🇮🇱</option>
                <option value="IT">Italy 🇮🇹</option><option value="JP">Japan 🇯🇵</option><option value="MY">Malaysia 🇲🇾</option>
                <option value="MX">Mexico 🇲🇽</option><option value="NP">Nepal 🇳🇵</option><option value="NL">Netherlands 🇳🇱</option>
                <option value="NZ">New Zealand 🇳🇿</option><option value="NO">Norway 🇳🇴</option><option value="PK">Pakistan 🇵🇰</option>
                <option value="PH">Philippines 🇵🇭</option><option value="PL">Poland 🇵🇱</option><option value="PT">Portugal 🇵🇹</option>
                <option value="RU">Russia 🇷🇺</option><option value="SA">Saudi Arabia 🇸🇦</option><option value="SG">Singapore 🇸🇬</option>
                <option value="ZA">South Africa 🇿🇦</option><option value="KR">South Korea 🇰🇷</option><option value="ES">Spain 🇪🇸</option>
                <option value="LK">Sri Lanka 🇱🇰</option><option value="SE">Sweden 🇸🇪</option><option value="CH">Switzerland 🇨🇭</option>
                <option value="TH">Thailand 🇹🇭</option><option value="TR">Turkey 🇹🇷</option><option value="UA">Ukraine 🇺🇦</option>
                <option value="AE">UAE 🇦🇪</option><option value="GB">UK 🇬🇧</option><option value="US">USA 🇺🇸</option>
                <option value="VN">Vietnam 🇻🇳</option>
                </select>
        </div>

        <div class="option-box">
            <span>I am</span>
            <b id="gDisplay">Boy 👨</b>
            <select id="gSelect">
                <option value="male">Boy 👨</option>
                <option value="female">Girl 👩</option>
                <option value="couple">Couple 👫</option>
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

        async function autoDetect() {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if(data.country_code) {
                    cSelect.value = data.country_code;
                }
            } catch(e) { console.log("Auto-detect failed"); }
            updateLabels();
        }

        function updateLabels() {
            cDisplay.innerText = cSelect.options[cSelect.selectedIndex].text;
            gDisplay.innerText = gSelect.options[gSelect.selectedIndex].text;
        }

        cSelect.onchange = updateLabels;
        gSelect.onchange = updateLabels;

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && chatInput.value.trim() !== "") {
                const txt = chatInput.value;
                socket.emit('message', txt);
                addMessage("You: " + txt);
                chatInput.value = "";
            }
        });

        socket.on('message', (m) => addMessage("Stranger: " + m));

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
            } catch(e) { alert("Cam Error!"); }
        }
        window.onload = () => { autoDetect(); init(); };

        document.getElementById('startBtn').onclick = () => {
            document.getElementById('startBtn').innerText = "Next";
            socket.emit('searching', { country: cSelect.value, gender: gSelect.value });
        };
    </script>
</body>
</html>
    `);
});

io.on('connection', (socket) => {
    socket.on('message', (msg) => socket.broadcast.emit('message', msg));
    socket.on('searching', (data) => console.log('User searching:', data));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Global Server Live'));
