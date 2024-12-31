const ws = new WebSocket(`ws://${window.location.host}`); // Connect to WebSocket server

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.success && data.currentSong && data.currentSong.album.images[0]?.url) {
        document.getElementById('current-song').innerHTML = `
        
        <a id="songs-display" href="https://open.spotify.com/track/${currentSong.id}"
    target="_blank">
        <img id="song-image" src="${data.currentSong.album.images[0]?.url}"
        alt="Song Image"> 
        <div>
        <a id="songs-display" href="https://open.spotify.com/track/${currentSong.id}"
    target="_blank">
        ${currentSong.name}
        </a>
        </div>
        <div>
        <a id="artists-display" href="https://open.spotify.com/artist/${currentSong.artists[0].id}"
    target="_blank">
        ${data.currentSong.artists[0].name}
        </a>
        </div>
        
        `;
    } else {
        document.getElementById('current-song').innerHTML = `
        <h4>Currently playing:</h4>
        <img id="song-image" src="../public/images/spotify-nothing-playing.png" alt="Song Image">
        <a id="songs-display" href="https://open.spotify.com/" target="_blank">Not
            listening to music :(</a>

        `;
    }
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('WebSocket connection closed');
};
