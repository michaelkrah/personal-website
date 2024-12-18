const http = require('http');
const app = require('./app'); 
const { setupWebSocket } = require('./config/websocketConfig');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app); 
setupWebSocket(server); 

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
