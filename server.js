var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static("."));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/room', function (req, res) {
	res.sendFile(__dirname + '/room.html');
});

app.get('/app', function (req, res) {
	res.sendFile(__dirname + '/app.html');
});

let rooms = new Array();

function getRoomSocket(roomid) {
	for (let i = 0; i < rooms.length; i++) {
		if (rooms[i].roomid == roomid) {
			return rooms[i].socketid;
		}
	}
}

function deleteRoom(roomid) {
	rooms = rooms.filter(e => e.roomid != roomid);
}

io.on('connection', function (socket) {

	let isRoom = false;
	let roomId;

	setInterval(function () {
		socket.emit("heartBeat");
	}, 100);

	socket.on("room_new", function () {
		roomId = generateRoomId();
		socket.join(roomId);
		socket.emit("room", roomId);
		isRoom = true;
		console.log(socket.id);
		rooms.push({roomid: roomId, socketid: socket.id});
		console.log(rooms.length + " room(s) online");
	});

	socket.on("client_new", function (data) {
		if (roomNotEmpty(data.roomid)) {
			roomId = data.roomid;
			socket.join(roomId);
			let color = generateHLSColor();
			io.to(socket.id).emit("server_login_confirm", {confirm: true, color: color, username: data.username});
			let playerInfo = {id: socket.id, username: data.username, color: color};
			io.to(getRoomSocket(roomId)).emit("server_client_connected", playerInfo);
		} else {
			io.to(socket.id).emit("server_login_confirm", {confirm: false, color: "#ffffff"});
			console.log("error connection");
		}
	});

	socket.on("client_move", function (data) {
		data.id = socket.id;
		io.to(getRoomSocket(roomId)).emit("server_move", data);
	});

	socket.on("client_rocket", function () {
		io.to(getRoomSocket(roomId)).emit("server_rocket", socket.id);
	});

	socket.on("room_hit", function (data) {
		io.to(data.id).emit("server_lives", data.health);
	});

	socket.on("room_ranks", function (data) {
		data.forEach(e => {
			io.to(e.id).emit("server_rank", e.rank);
		});
	});

	socket.on("room_restart", function () {
		console.log("restart");
		io.to(roomId).emit("server_restart");
	});

	socket.on('disconnect', function () {
		if (isRoom) {
			deleteRoom(roomId);
			console.log(rooms.length + " room(s) online");
		} else {
			io.to(roomId).emit("server_client_disconnected", socket.id);
		}
	});
});

http.listen(3000, function () {
	console.log('listening on *:3000');
});

function generateRoomId() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	for (var i = 0; i < 3; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

function roomNotEmpty(roomid) {
	var room = io.sockets.adapter.rooms[roomid];
	return room != undefined && room.length > 0;
}

function generateHLSColor() {
	return hslToHex(Math.random() * 360, 100, 50);
}

function hslToHex(h, s, l) {
	h /= 360;
	s /= 100;
	l /= 100;
	let r, g, b;
	if (s === 0) {
		r = g = b = l; // achromatic
	} else {
		const hue2rgb = (p, q, t) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}
	const toHex = x => {
		const hex = Math.round(x * 255).toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	};
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}