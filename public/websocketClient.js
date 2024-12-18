const ws = new WebSocket(`ws://${window.location.host}`); // Connect to WebSocket server

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
        if (data.success && data.currentSong) {
        document.getElementById('current-song').innerText = 
            `Now Playing: ${data.currentSong.name} by ${data.currentSong.artists[0].name}`;
    } else {
        document.getElementById('current-song').innerText = 'No song is currently playing';
    }
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('WebSocket connection closed');
};
