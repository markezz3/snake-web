const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const players = {};

function createPlayer(socketId, username = "Anonymous") {
    return {
        id: socketId,
        username,
        score: 0,
        snake: []
    };
}

function sanitizeSnake(snake) {
    if (!Array.isArray(snake)) {
        return [];
    }

    return snake
        .map(segment => ({
            x: Number(segment?.x) || 0,
            y: Number(segment?.y) || 0
        }))
        .slice(0, 500);
}

function getSnakes() {
    return Object.values(players)
        .map(player => ({
            id: player.id,
            username: player.username,
            score: player.score,
            snake: sanitizeSnake(player.snake)
        }));
}

function getLeaderboard() {
    return Object.values(players)
        .filter(player => Number(player.score) > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((player, index) => ({
            rank: index + 1,
            id: player.id,
            username: player.username,
            score: player.score
        }));
}

function broadcastState() {
    io.emit("players-update", players);
    io.emit("leaderboard-update", getLeaderboard());
    io.emit("snakes-update", getSnakes());
}

io.on("connection", (socket) => {
    console.log("Usuario conectado:", socket.id);

    players[socket.id] = createPlayer(socket.id);

    socket.emit("initial-state", {
        players,
        leaderboard: getLeaderboard(),
        snakes: getSnakes()
    });

    broadcastState();

    socket.on("new-player", username => {
        const safeUsername = String(username || "Anonymous").trim().slice(0, 12) || "Anonymous";

        console.log("Nuevo jugador:", safeUsername, socket.id);

        players[socket.id] = {
            id: socket.id,
            username: safeUsername,
            score: players[socket.id]?.score || 0,
            snake: sanitizeSnake(players[socket.id]?.snake)
        };

        broadcastState();
    });

    socket.on("snake-state", ({ snake, score }) => {
        if (!players[socket.id]) {
            players[socket.id] = createPlayer(socket.id);
        }

        players[socket.id].snake = sanitizeSnake(snake);

        if (score !== undefined && score !== null) {
            players[socket.id].score = Number(score) || 0;
        }

        broadcastState();
    });

    socket.on("score-update", score => {
        const safeScore = Number(score) || 0;

        if (!players[socket.id]) {
            players[socket.id] = createPlayer(socket.id);
        }

        players[socket.id].score = safeScore;
        broadcastState();
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        broadcastState();
        console.log("Usuario desconectado:", socket.id);
    });
});

server.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000");
});
