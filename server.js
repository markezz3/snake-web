const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use(express.static("public"));

const players = {};

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
}

io.on("connection", (socket) => {

    console.log("Usuario conectado:", socket.id);

    socket.emit("initial-state", {
        players,
        leaderboard: getLeaderboard()
    });

    socket.on("new-player", username => {
        const safeUsername = String(username || "Anonymous")
            .trim()
            .slice(0, 12) || "Anonymous";

        console.log("Nuevo jugador:", safeUsername, socket.id);

        players[socket.id] = {
            id: socket.id,
            username: safeUsername,
            score: players[socket.id]?.score || 0
        };

        broadcastState();
    });

    socket.on("score-update", score => {
        const safeScore = Number(score) || 0;

        if (!players[socket.id]) {
            players[socket.id] = {
                id: socket.id,
                username: "Anonymous",
                score: 0
            };
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