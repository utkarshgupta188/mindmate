// realtime-server.js (ESM)
import { WebSocketServer, WebSocket as WS } from 'ws'

const PORT = Number(process.env.WS_PORT || 4000)
const HOST = process.env.WS_HOST || '0.0.0.0'

const wss = new WebSocketServer({ port: PORT, host: HOST })
console.log(`Realtime WS listening on ws://${HOST}:${PORT}`)

wss.on('connection', (ws) => {
  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw.toString())
      if (msg.type === 'subscribe') {
        // tag connection
        ws.userId = msg.userId
        return
      }
      // broadcast stressPoint/finalReport to all clients with matching userId
      if ((msg.type === 'stressPoint' || msg.type === 'finalReport') && msg.userId) {
        wss.clients.forEach(c => {
          if (c.readyState === WS.OPEN && c.userId === msg.userId) {
            c.send(JSON.stringify(msg))
          }
        })
      }
    } catch (e) {
      console.error('ws parse', e)
    }
  })
})
