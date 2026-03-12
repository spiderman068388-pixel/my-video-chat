const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoContainer = document.getElementById('video-container');
const spinner = document.getElementById('spinner');

let localStream;

// Jab Start button dabaya jaye
startBtn.onclick = async () => {
    try {
        // Camera aur Mic ki permission mangna
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // Spinner (loading) ko hatana
        spinner.style.display = 'none';
        
        // Screen par video dikhana
        videoContainer.innerHTML = '<video id="myVideo" autoplay muted playsinline style="width:100%; height:100%; object-fit:cover; border-radius:15px;"></video>';
        
        const videoElement = document.getElementById('myVideo');
        videoElement.srcObject = localStream;
        
        startBtn.innerText = "Next"; // Button badal kar Next ho jayega
        console.log("Camera started successfully!");
    } catch (err) {
        alert("Bhai, camera allow karna padega setting se!");
        console.error(err);
    }
};

// Jab Stop button dabaya jaye
stopBtn.onclick = () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        videoContainer.innerHTML = '';
        spinner.style.display = 'block'; // Wapas loading dikhana
        startBtn.innerText = "Start";
    }
};
