"use strict";

let canvas, ctx;

const players = {};
const color = '#000';
let name;

let socket;

const lerp = (a, b, t) => a * (1 - t) + b * t;
const lerpV = (a, b, t) => { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) } };

const draw = () => {
    ctx.clearRect(0, 0, 800, 600);
    Object.keys(players).forEach(name => {
        const player = players[name];
        player.position = lerpV(player.position, player.target, 0.2);
        ctx.fillStyle = player.color;
        ctx.fillRect(player.position.x, 600 - player.position.y, player.dims.x, player.dims.y);
    })
};

const init = () => {
    canvas = document.querySelector('canvas');
    ctx = canvas.getContext('2d');

    socket = io.connect();

    window.addEventListener('keydown', (e) => {
        if      (e.keyCode == 68) socket.emit('move', { name, dx:  10 }); // d
        else if (e.keyCode == 65) socket.emit('move', { name, dx: -10 }); // a
    });
    window.addEventListener('keyup', (e) => {
        if (e.keyCode == 32) socket.emit('jump', name); // space
    });

    socket.on('join', data => {
        name = data.name;
        data.data.color = color
        players[name] = data.data;
    });

    socket.on('update', data => {
        let player = players[data.name];
        if(!player) {
            data.player.color = '#f00';
            player = players[data.name] = data.player;
        }
        player.target = data.player.position;
    })

    socket.on('leave', data => delete players[data]);

    window.setInterval(draw, 1000 / 60);
};

window.onload = init;