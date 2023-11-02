const express = require('express')
const { Client, LocalAuth } = require('whatsapp-web.js')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')
const bodyParser = require('body-parser')

const app = express()
const server = http.createServer(app)
const port = 3000

const CLIENT_URL = 'http://127.0.0.1:5173'

const corsOptions = {
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}
app.use(cors(corsOptions))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.send({
    message: 'Hello World!',
  })
})

app.post('/send', (req, res) => {
  res.send({
    message: 'Sent!',
  })
})

app.post('/send-message', (req, res) => {
  const { number, message } = req.body

  // add @c.us to number
  const newNumber = number + '@c.us'

  client
    .sendMessage(newNumber, message)
    .then((response) => {
      res.send({
        message: 'Sent!',
      })
    })
    .catch((err) => {
      res.send({
        message: 'Error!',
      })
    })
})

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})

const client = new Client({
  authStrategy: new LocalAuth(),
})

const whatsappSesion = (socket) => {
  console.log('whatsappSesion', socket.id)

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr.split(',1')[0])
    socket.emit('qr', qr)
  })

  client.on('ready', () => {
    console.log('Client is ready!')
    socket.emit('ready', 'Client is ready!')
  })

  client.on('authenticated', (session) => {
    console.log('Authenticated')
    // You can store the session data to avoid reauthentication in the future.
  })

  client.on('message', async (msg) => {
    if (msg.body == '!ping') {
      msg.reply('pong')
    } else if (msg.body == 'halo') {
      const contact = await msg.getContact()
      const chat = await msg.getChat()
      chat.sendMessage(`Halo ${contact.pushname}`)
    }
  })

  client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason)
  })

  client.initialize()
}

const io = new Server(server, {
  cors: CLIENT_URL,
})

io.on('connection', (socket) => {
  console.log('a user connected', socket.id)

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })

  socket.on('connected', () => {
    socket.emit('connected', 'hello from server')
  })

  socket.on('whatsappSession', () => {
    whatsappSesion(socket)
  })
})
