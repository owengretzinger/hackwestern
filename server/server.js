const express = require('express');
const http = require('http');
const { send } = require('process');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const WS_URL = 'ws://localhost:8080'
const server_ws = new WebSocket(WS_URL)


// Serve static files (if needed)
app.use(express.static('public'));
app.use(express.json());

server_ws.onopen = () => {
    console.log('Server side connect')
}

app.post('/createSong', async (req, res) => {
    const data = req.body

    // const promise = await 
    
    res.json(await new Promise(async (resolve) => {

        let loop = setTimeout(() => {
            resolve({status:false})
        }, 10000)

        server_ws.onmessage = async (message) => {
            const data = JSON.parse(message.data)

            if(data.action == 'returnSong'){
                clearTimeout(loop)
                resolve({
                    status: true,
                    songURL: data.songURL
                })
            }
        }

        server_ws.send(JSON.stringify({
            action: 'createSong',
            prompt: data.prompt
        }))

    }))
})

// Broadcast to all connected clients, except the sender
function broadcast(ws, message) {
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

const sendID = (ws, message, id) => {
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN && id == client.id) {
            client.send(message);
        }
    });
}

// send message only to remote controlled clients
const broadcastController = (ws, message) => {
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN && client.isControlled) {
            console.log(message)
            client.send(message);
        }
    });
}

// WebSocket connection handling
wss.on('connection', (ws) => {
    // generate unique id for each client
    ws.id = Math.random().toString(36).substr(2, 9);

    ws.isControlled = false
    
    console.log(`Client id: ${ws.id} connected`);

    // Send a welcome message
    ws.send('Welcome to the WebSocket server! Your id is ' + ws.id);

    
    ws.on('message', (message) => {
        // console.log(`Received message: ${message} from client: ${ws.id}`);
        // Broadcast the message to all clients
        
        message = JSON.parse(message)
        // console.log(message)
        const action = message.action
        console.log(action)

        switch(action){
            case 'role':
                const role = message.role

                if(role == 'controller'){
                    ws.isControlled = true
                    // console.log(ws.isControlled)
                }
                break
            
            case 'createSong':
                console.log('creating song...')
                message.returnID = ws.id
                broadcastController(ws, JSON.stringify(message))
                break

            case 'returnSong':
                console.log(message)
                sendID(ws, JSON.stringify(message), message.returnID )
                break;
        }

        // broadcast(ws, message);
    });


    ws.on('close', () => {
        console.log(`Client: ${ws.id} disconnected`);
    });

});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
