const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const express = require('express');
const common = require('./common.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const app = express();
const httpServer = http.createServer(app).listen(port);

const root = `${__dirname}/../`;

app.use(express.static(path.join(root, 'hosted')));

console.log(`Listening on 127.0.0.1: ${port}`);

const io = socketio(httpServer);

class Player {
  constructor() {
    this.dims = { x: 50, y: 50 };
    this.position = {
      x: (Math.random() * (800 - (this.dims.x * 0.5))) + this.dims.x,
      y: 600 - this.dims.y,
    };
    this.jumpTime = 0;
  }
}

const players = {};
const update = () => {
  Object.keys(players).forEach((name) => {
    const player = players[name];
    if (new Date().getTime() - player.jumpTime < 500) {
      player.position.y = Math.min(player.position.y + 5, 600);
    } else player.position.y = Math.max(player.position.y - 5, player.dims.y);
    io.sockets.in('room1').emit('update', { name, player });
  });
};

setInterval(update, 1000 / 60);

const onInput = (sock) => {
  const socket = sock;
  socket.on('jump', (data) => {
    if (players[data]) { players[data].jumpTime = new Date().getTime(); }
  });
  socket.on('move', (data) => {
    const player = players[data.name];
    if (player) {
      const min = 0;
      const max = 800 - player.dims.x;
      player.position.x = common.clamp(player.position.x + data.dx, min, max);
    }
  });
};

const onJoined = (sock) => {
  const socket = sock;

  let name;
  do { name = Math.random() * 100; } while (players[name]);
  players[name] = new Player();

  socket.on('disconnect', () => {
    delete players[name];
    io.sockets.in('room1').emit('leave', name);
  });

  socket.emit('join', { name, data: players[name] });
};

io.sockets.on('connection', (socket) => {
  console.log('started');
  socket.join('room1');
  onJoined(socket);
  onInput(socket);
});

console.log('Websocket server started');
