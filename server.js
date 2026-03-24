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
    <title>Premium Video Chat</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { background: #f0f2f5; height: 100vh; display: flex; flex-direction: column; }

        /* Video Area */
        .video-container { flex: 1; display: flex; background: #000; gap: 2px; position: relative; }
        .v-box { flex: 1; position: relative; background: #1a1a1a; display: flex; align-items: center; justify-content: center; }
        video { width: 100%; height: 100%; object-fit: cover; }
        #localVideo { transform: scaleX(-1); } /* Mirror */
        .tag { position: absolute; top: 15px; left: 15px; background: rgba(0,0,0,0.5); color: #fff; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; z-index: 5; }

        /* Bottom Controls */
        .bottom-nav { background: #fff; height: 120px; display: flex; align-items: center; padding: 0 15px; gap: 10px; border-top: 1px solid #ddd; }
        
        .btn-main { width: 85px; height: 85px; border-radius: 22px; border: none; cursor: pointer; font-weight: bold; transition: 0.2s; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .start { background: #58d68d; color: white; box-shadow: 0 5px 0 #2d9658; }
        .start:active { transform: translateY(3px); box-shadow: 0 2px 0 #2d9658; }
        .stop { background: #f1948a; color: white; box-shadow: 0 5px 0 #c0392b; }

        .option-box { width: 85px; height: 85px; background: #f8f9fa; border: 1px solid #eee; border-radius: 22px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; position: relative; }
        .option-box span { font-size: 9px; color: #aaa; text-transform: uppercase; margin-bottom: 4px; }
        .option-box b { font-size: 14px; color: #333; text-align: center; display: block; }
        .option-box select { position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

        .chat-input-area { flex: 1; margin-left: 10px; }
        .msg-input { width: 100%; padding: 15px; border-radius: 15px; border: none; background: #f1f3f4; outline: none; font-size: 16px; }

        @media (max-width: 600px) {
            .video-container { flex-direction: column; }
            .btn-main, .option-box { width: 65px; height: 65px; border-radius: 15px; font-size: 13px; }
            .bottom-nav { height: 100px; padding: 5px; }
        }
    </style>
</head>
<body>
    <div class="video-container">
        <div class="v-box" id="remoteBox"><div class="tag">Stranger</div><div id="status" style="color:#555">Searching...</div></div>
        <div class="v-box" id="localBox"><div class="tag">You</div></div>
    </div>

    <div class="bottom-nav">
        <button class="btn-main start" id="startBtn">Start</button>
        <button class="btn-main stop" onclick="location.reload()">Stop</button>

        <div class="option-box">
            <span>Country</span>
            <b id="cDisplay">Detect...</b>
            <select id="cSelect">
                <option value="ALL">World 🌐</option>
                <option value="IN">India 🇮🇳</option>
                <option value="US">USA 🇺🇸</option>
                <option value="RU">Russia 🇷🇺</option>
                <option value="BR">Brazil 🇧🇷</option>
                <option value="DE">Germany 🇩🇪</option>
                <option value="FR">France 🇫🇷</option>
            </select>
        </div>

        <div class="option-box">
            <span>Gender</span>
            <b id="gDisplay">Boy 👨</b>
            <select id="gSelect">
                <option value="male">Boy 👨</option>
                <option value="female">Girl 👩</option>
                <option value="couple">Couple 👫</option>
            </select>
        </div>

        <div class="chat-input-area">
            <input type="text" class="msg-input" placeholder="Type message...">
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let stream;

        // Smart Selectors
        const cSelect = document.getElementById('cSelect');
        const cDisplay = document.getElementById('cDisplay');
        const gSelect = document.getElementById('gSelect');
        const gDisplay = document.getElementById('gDisplay');

        // 1. Auto Country Detection
        async function autoDetect() {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if(data.country_code) {
                    cSelect.value = data.country_code;
                    cDisplay.innerText = data.country_code + " " + (data.country_emoji || "📍");
                }
            } catch(e) { cDisplay.innerText = "IN 🇮🇳"; }
        }

        cSelect.onchange = () => cDisplay.innerText = cSelect.options[cSelect.selectedIndex].text;
        gSelect.onchange = () => gDisplay.innerText = gSelect.options[gSelect.selectedIndex].text;

        // 2. Camera
        async function init() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
                document.getElementById('localBox').innerHTML += '<video id="localVideo" autoplay muted playsinline></video>';
                document.getElementById('localVideo').srcObject = stream;
            } catch(e) { alert("Enable Camera!"); }
        }

        window.onload = () => { autoDetect(); init(); };

        document.getElementById('startBtn').onclick = () => {
            const btn = document.getElementById('startBtn');
            btn.innerText = "Next";
            socket.emit('find-partner', { country: cSelect.value, gender: gSelect.value });
        };
    </script>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Final Pro Server Running'));
