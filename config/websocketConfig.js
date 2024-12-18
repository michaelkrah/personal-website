const WebSocket = require('ws');
const { getLastListened } = require('./spotifyConfig'); 
function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server }); 

    wss.on('connection', (ws) => {
        console.log('WebSocket client connected');

        const intervalId = setInterval(() => {
            const currentSong = getLastListened();
            const message = JSON.stringify({
                success: true,
                currentSong: currentSong?.data?.item || null,
            });
            ws.send(message);
        }, 10000); 

        ws.on('close', () => {
            console.log('WebSocket client disconnected');
            clearInterval(intervalId);
        });
    });

    return wss;
}

module.exports = { setupWebSocket };
