const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Global OmeTV Clone</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; }
        body { background: #f0f2f5; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
        
        /* Video Grid */
        .video-grid { flex: 1; display: flex; background: #000; gap: 2px; }
        .video-box { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; background: #1a1a1a; }
        video { width: 100%; height: 100%; object-fit: cover; }
        #v1 { transform: scaleX(-1); } /* Mirror local video */

        .watermark { position: absolute; top: 15px; left: 15px; background: rgba(0,0,0,0.5); color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 13px; z-index: 10; font-weight: bold; }
        
        /* Bottom Control Bar */
        .bottom-bar { background: #fff; padding: 12px; display: flex; align-items: center; gap: 8px; border-top: 1px solid #ddd; }
        
        .main-btns { display: flex; gap: 8px; }
        .btn { border: none; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        
        .start-btn { width: 80px; height: 80px; background: #2ecc71; color: white; font-size: 16px; box-shadow: 0 4px 0 #27ae60; }
        .stop-btn { width: 80px; height: 80px; background: #ff7675; color: white; font-size: 16px; box-shadow: 0 4px 0 #d63031; }

        /* Filter Selects */
        .filter-select { width: 85px; height: 80px; background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 15px; padding: 5px; position: relative; cursor: pointer; }
        .filter-select span { font-size: 9px; color: #888; text-transform: uppercase; }
        .filter-select select { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
        .display-val { font-size: 14px; font-weight: bold; color: #333; margin-top: 5px; }

        /* Chat */
        .chat-input-wrapper { flex: 1; margin-left: 5px; }
        .chat-input { width: 100%; padding: 12px; border: none; background: #f0f2f5; border-radius: 10px; outline: none; font-size: 15px; }
        
        @media (max-width: 600px) {
            .video-grid { flex-direction: column; }
            .start-btn, .stop-btn, .filter-select { width: 65px; height: 65px; font-size: 12px; }
            .display-val { font-size: 12px; }
        }
    </style>
</head>
<body>
    <div class="video-grid">
        <div class="video-box" id="remoteBox">
            <div class="watermark">Stranger</div>
            <div id="status" style="color:#444; font-size: 12px;">Searching...</div>
        </div>
        <div class="video-box" id="localBox">
            <div class="watermark">You</div>
        </div>
    </div>

    <div class="bottom-bar">
        <div class="main-btns">
            <button class="btn start-btn" id="startBtn">Start</button>
            <button class="btn stop-btn" onclick="location.reload()">Stop</button>
        </div>
        
        <div class="btn filter-select">
            <span>Country</span>
            <div class="display-val" id="countryDisplay">Detecting...</div>
            <select id="countryList">
                <option value="ALL">All World</option>
                <option value="IN">India 🇮🇳</option>
                <option value="US">USA 🇺🇸</option>
                <option value="RU">Russia 🇷🇺</option>
                <option value="BR">Brazil 🇧🇷</option>
                <option value="ID">Indonesia 🇮🇩</option>
                </select>
        </div>

        <div class="btn filter-select">
            <span>I am</span>
            <div class="display-val" id="genderDisplay">Boy 👨</div>
            <select id="genderSelect">
                <option value="male">Boy 👨</option>
                <option value="female">Girl 👩</option>
                <option value="couple">Couple 👫</option>
            </select>
        </div>

        <div class="chat-input-wrapper">
            <input type="text" class="chat-input" placeholder="Say hi...">
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let localStream;

        const countryList = document.getElementById('countryList');
        const countryDisplay = document.getElementById('countryDisplay');
        const genderSelect = document.getElementById('genderSelect');
        const genderDisplay = document.getElementById('genderDisplay');

        // 1. Auto-Detect Country using IP
        async function detectLocation() {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if(data.country_code) {
                    countryList.value = data.country_code;
                    countryDisplay.innerText = data.country_code + " " + (data.country_emoji || "📍");
                }
            } catch(e) { 
                countryDisplay.innerText = "IN 🇮🇳"; 
            }
        }

        // 2. Change Listeners
        countryList.onchange = () => { countryDisplay.innerText = countryList.value; };
        genderSelect.onchange = () => { 
            genderDisplay.innerText = genderSelect.options[genderSelect.selectedIndex].text; 
        };

        // 3. Camera Setup
        async function initCamera() {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
                document.getElementById('localBox').innerHTML += '<video id="v1" autoplay muted playsinline></video>';
                document.getElementById('v1').srcObject = localStream;
            } catch(e) { alert("Camera access required!"); }
        }

        window.onload = () => {
            detectLocation();
            initCamera();
        };

        document.getElementById('startBtn').onclick = () => {
            document.getElementById('startBtn').innerText = "Next";
            socket.emit('find-partner', { 
                country: countryList.value, 
                gender: genderSelect.value 
            });
        };
    </script>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Smart Server Running'));
