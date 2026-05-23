const express = require("express");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const players = {};
const recordsPath = path.join(__dirname, "data", "records.json");
let records = loadRecords();

function loadRecords() {
    try {
        const rawRecords = fs.readFileSync(recordsPath, "utf8");
        const parsedRecords = JSON.parse(rawRecords);

        return {
            bestRecord: normalizeRecord(parsedRecords.bestRecord),
            leaderboard: normalizeLeaderboard(parsedRecords.leaderboard)
        };
    } catch (error) {
        return {
            bestRecord: normalizeRecord(),
            leaderboard: []
        };
    }
}

function saveRecords() {
    fs.mkdirSync(path.dirname(recordsPath), { recursive: true });
    fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2));
}

function normalizeRecord(record = {}) {
    return {
        username: String(record.username || record.name || "Anonymous").trim().slice(0, 12) || "Anonymous",
        score: Number(record.score) || 0
    };
}

function normalizeLeaderboard(leaderboard = []) {
    return leaderboard
        .map(normalizeRecord)
        .filter(record => record.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
}

function registerScore(username, score) {
    const safeRecord = normalizeRecord({ username, score });

    if (safeRecord.score <= 0) {
        return false;
    }

    const existingIndex = records.leaderboard.findIndex(record => record.username === safeRecord.username);

    if (existingIndex >= 0 && records.leaderboard[existingIndex].score >= safeRecord.score) {
        return false;
    }

    if (existingIndex >= 0) {
        records.leaderboard[existingIndex] = safeRecord;
    } else {
        records.leaderboard.push(safeRecord);
    }

    records.leaderboard = normalizeLeaderboard(records.leaderboard);
    records.bestRecord = records.leaderboard[0] || normalizeRecord();
    saveRecords();
    return true;
}

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
    return records.leaderboard
        .map((record, index) => ({
            rank: index + 1,
            username: record.username,
            score: record.score
        }));
}

function getBestRecord() {
    return records.bestRecord;
}

function broadcastState() {
    io.emit("players-update", players);
    io.emit("leaderboard-update", getLeaderboard());
    io.emit("best-update", getBestRecord());
    io.emit("snakes-update", getSnakes());
}

io.on("connection", (socket) => {
    console.log("Usuario conectado:", socket.id);

    players[socket.id] = createPlayer(socket.id);

    socket.emit("initial-state", {
        players,
        leaderboard: getLeaderboard(),
        bestRecord: getBestRecord(),
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
            registerScore(players[socket.id].username, players[socket.id].score);
        }

        broadcastState();
    });

    socket.on("score-update", score => {
        const safeScore = Number(score) || 0;

        if (!players[socket.id]) {
            players[socket.id] = createPlayer(socket.id);
        }

        players[socket.id].score = safeScore;
        registerScore(players[socket.id].username, safeScore);
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
