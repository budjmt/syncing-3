"use strict";

var canvas = void 0,
    ctx = void 0;

var players = {};
var color = '#000';
var name = void 0;

var socket = void 0;

var lerp = function lerp(a, b, t) {
    return a * (1 - t) + b * t;
};
var lerpV = function lerpV(a, b, t) {
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
};

var draw = function draw() {
    ctx.clearRect(0, 0, 800, 600);
    Object.keys(players).forEach(function (name) {
        var player = players[name];
        player.position = lerpV(player.position, player.target, 0.2);
        ctx.fillStyle = player.color;
        ctx.fillRect(player.position.x, 600 - player.position.y, player.dims.x, player.dims.y);
    });
};

var init = function init() {
    canvas = document.querySelector('canvas');
    ctx = canvas.getContext('2d');

    socket = io.connect();

    window.addEventListener('keydown', function (e) {
        if (e.keyCode == 68) socket.emit('move', { name: name, dx: 10 }); // d
        else if (e.keyCode == 65) socket.emit('move', { name: name, dx: -10 }); // a
    });
    window.addEventListener('keyup', function (e) {
        if (e.keyCode == 32) socket.emit('jump', name); // space
    });

    socket.on('join', function (data) {
        name = data.name;
        data.data.color = color;
        players[name] = data.data;
    });

    socket.on('update', function (data) {
        var player = players[data.name];
        if (!player) {
            data.player.color = '#f00';
            player = players[data.name] = data.player;
        }
        player.target = data.player.position;
    });

    socket.on('leave', function (data) {
        return delete players[data];
    });

    window.setInterval(draw, 1000 / 60);
};

window.onload = init;
