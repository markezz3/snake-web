const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const usernameInput = document.getElementById("username");
const currentPlayerName = document.getElementById("current-player-name");
const currentBest = document.getElementById("current-best");
const onlinePlayersList = document.getElementById("online-players");
const leaderboardList = document.getElementById("leaderboard");
const navigationKeys = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

let onlinePlayers = {};
let leaderboard = [];
let remoteSnakes = {};
let snake = [];
let food = { x: 15, y: 15 };
let score = 0;
let dx = 1;
let dy = 0;
let gridSize = canvas.width / 30;

let gameRunning = false;
let gameOver = false;
let usernameSent = false;

const savedUsername = localStorage.getItem("lastUsername") || "";
let bestRecord = {
    score: 0,
    username: "Anonymous"
};

let currentUsername = savedUsername || "Anonymous";

if (savedUsername) {
    usernameInput.value = savedUsername;
}

currentPlayerName.textContent = currentUsername;
renderBest();
renderPlayers();
renderLeaderboard();

socket.on("connect", () => {
    console.log("Conectado al servidor:", socket.id);
    sendPlayerName();
});

function syncRemoteSnakes(playersData) {
    remoteSnakes = {};

    Object.entries(playersData || {}).forEach(([playerId, player]) => {
        if (playerId === socket.id) {
            return;
        }

        if (!player) {
            return;
        }

        remoteSnakes[playerId] = {
            id: player.id || playerId,
            username: player.username,
            score: player.score || 0,
            snake: Array.isArray(player.snake) ? player.snake : []
        };
    });
}

socket.on("initial-state", ({ players, leaderboard: initialLeaderboard, bestRecord: initialBestRecord }) => {
    onlinePlayers = players || {};
    leaderboard = initialLeaderboard || [];
    updateBestRecord(initialBestRecord);
    syncRemoteSnakes(onlinePlayers);

    renderPlayers();
    renderLeaderboard();
});

socket.on("players-update", players => {
    onlinePlayers = players || {};
    syncRemoteSnakes(onlinePlayers);
    renderPlayers();
});

socket.on("leaderboard-update", updatedLeaderboard => {
    leaderboard = updatedLeaderboard || [];
    renderLeaderboard();
});

socket.on("best-update", updatedBestRecord => {
    updateBestRecord(updatedBestRecord);
});

socket.on("snakes-update", snakes => {
    remoteSnakes = {};

    (snakes || []).forEach(player => {
        if (player.id !== socket.id) {
            remoteSnakes[player.id] = player;
        }
    });
});

function getCanvasSize() {
    const isDesktop = window.matchMedia("(min-width: 900px)").matches;
    const widthLimit = isDesktop ? window.innerWidth - 420 : window.innerWidth - 32;
    const heightReserve = isDesktop ? 56 : 260;
    const heightLimit = window.innerHeight - heightReserve;
    const maxSize = isDesktop ? 560 : 600;

    return Math.max(240, Math.min(widthLimit, heightLimit, maxSize));
}

function setupCanvas() {
    const size = getCanvasSize();
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    gridSize = canvas.width / 30;
}

function formatBestLabel() {
    return `Best: ${bestRecord.score} • ${bestRecord.name}`;
}

function getBestLabel() {
    return `Best: ${bestRecord.score} - ${bestRecord.name}`;
}

function getBestLabel() {
    return `Best: ${bestRecord.score} - ${bestRecord.username}`;
}

function updateBestRecord(record) {
    bestRecord = {
        score: Number(record?.score) || 0,
        username: String(record?.username || record?.name || "Anonymous").trim().slice(0, 12) || "Anonymous"
    };

    renderBest();
}

function renderBest() {
    currentBest.textContent = getBestLabel();
}

function renderPlayers() {
    const entries = Object.values(onlinePlayers)
        .sort((a, b) => b.score - a.score)
        .map(player => `
            <li class="player-item">
                <span>${escapeHtml(player.username || "Anonymous")}</span>
                <span class="player-score">${Number(player.score) || 0}</span>
            </li>
        `)
        .join("");

    onlinePlayersList.innerHTML = entries || "<li>Sin jugadores conectados</li>";
}

function renderLeaderboard() {
    const entries = leaderboard
        .map(player => `
            <li class="leaderboard-item">
                <span>#${player.rank} ${escapeHtml(player.username || "Anonymous")}</span>
                <span class="leaderboard-score">${Number(player.score) || 0}</span>
            </li>
        `)
        .join("");

    leaderboardList.innerHTML = entries || "<li>Sin puntajes aún</li>";
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function readUsername() {
    currentUsername = usernameInput.value.trim().slice(0, 12) || "Anonymous";
    localStorage.setItem("lastUsername", currentUsername);
    currentPlayerName.textContent = currentUsername;
    return currentUsername;
}

function sendPlayerName() {
    const name = readUsername();
    socket.emit("new-player", name);
    usernameSent = true;
}

function saveUsername() {
    sendPlayerName();
}

function isCellOnSnake(cell, body) {
    return body.some(segment => segment.x === cell.x && segment.y === cell.y);
}

function getNewFood() {
    let nextFood = {
        x: Math.floor(Math.random() * 30),
        y: Math.floor(Math.random() * 30)
    };

    while (isCellOnSnake(nextFood, snake)) {
        nextFood = {
            x: Math.floor(Math.random() * 30),
            y: Math.floor(Math.random() * 30)
        };
    }

    return nextFood;
}

function drawSnake(body, color, label) {
    ctx.fillStyle = color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;

    body.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });

    ctx.shadowBlur = 0;

    if (label) {
        ctx.fillStyle = "white";
        ctx.font = canvas.width < 400 ? "12px Arial" : "14px Arial";
        ctx.fillText(label, body[0].x * gridSize + 4, body[0].y * gridSize - 4);
    }
}

function sendSnakeState() {
    if (!socket.connected) {
        return;
    }

    socket.emit("snake-state", {
        snake: snake.map(segment => ({ x: segment.x, y: segment.y })),
        score
    });
}

function startGame() {
    saveUsername();

    snake = [{ x: 5, y: 5 }];
    food = getNewFood();
    score = 0;
    dx = 1;
    dy = 0;
    gameRunning = true;
    gameOver = false;

    sendSnakeState();
}

function drawGame() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();

    if (!gameRunning && !gameOver) {
        drawRemoteSnakes();
        drawCenteredText("PRESS SPACE", canvas.height / 2);
        return;
    }

    if (gameOver) {
        drawRemoteSnakes();
        drawCenteredText("GAME OVER", canvas.height / 2 - 20);

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(
            "Press SPACE to restart",
            canvas.width / 2 - 110,
            canvas.height / 2 + 20
        );
        return;
    }

    const head = {
        x: snake[0].x + dx,
        y: snake[0].y + dy
    };

    if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= 30 ||
        head.y >= 30
    ) {
        endGame();
        return;
    }

    if (isCellOnSnake(head, snake)) {
        endGame();
        return;
    }

    snake.unshift(head);

    const ateFood = head.x === food.x && head.y === food.y;

    if (!ateFood) {
        snake.pop();
    } else {
        score++;

        food = getNewFood();
    }

    if (socket.connected) {
        socket.emit("score-update", score);
    }
    sendSnakeState();

    ctx.fillStyle = "white";
    ctx.font = canvas.width < 400 ? "16px Arial" : "24px Arial";
    ctx.fillText("Score: " + score, 10, 25);
    ctx.fillText(getBestLabel(), 10, 45);

    ctx.fillStyle = "#ff004c";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff004c";
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

    drawSnake(snake, "#00ff88", currentUsername);
    drawRemoteSnakes();

    ctx.shadowBlur = 0;
}

function drawRemoteSnakes() {
    Object.values(remoteSnakes).forEach(player => {
        if (!player || player.id === socket.id) {
            return;
        }

        if (Array.isArray(player.snake) && player.snake.length > 0) {
            drawSnake(player.snake, "#4cc9f0", player.username);
        }
    });
}

function drawGrid() {
    ctx.strokeStyle = "#1a1a1a";

    for (let i = 0; i < canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

function drawCenteredText(text, y) {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";

    const textWidth = ctx.measureText(text).width;
    ctx.fillText(text, (canvas.width - textWidth) / 2, y);
}

function endGame() {
    gameRunning = false;
    gameOver = true;
}

document.addEventListener("keydown", event => {
    if (event.target === usernameInput) {
        return;
    }

    const key = event.key;

    if (navigationKeys.has(key)) {
        event.preventDefault();
    }

    if (key === " ") {
        if (!gameRunning) {
            startGame();
        }
        return;
    }

    if (!gameRunning) return;

    if (key === "ArrowUp" && dy === 0) {
        dx = 0;
        dy = -1;
    }

    if (key === "ArrowDown" && dy === 0) {
        dx = 0;
        dy = 1;
    }

    if (key === "ArrowLeft" && dx === 0) {
        dx = -1;
        dy = 0;
    }

    if (key === "ArrowRight" && dx === 0) {
        dx = 1;
        dy = 0;
    }
});

document.getElementById("up").addEventListener("click", () => {
    if (dy === 0 && gameRunning) {
        dx = 0;
        dy = -1;
    }
});

document.getElementById("down").addEventListener("click", () => {
    if (dy === 0 && gameRunning) {
        dx = 0;
        dy = 1;
    }
});

document.getElementById("left").addEventListener("click", () => {
    if (dx === 0 && gameRunning) {
        dx = -1;
        dy = 0;
    }
});

document.getElementById("right").addEventListener("click", () => {
    if (dx === 0 && gameRunning) {
        dx = 1;
        dy = 0;
    }
});

document.getElementById("start-button").addEventListener("click", () => {
    if (!gameRunning) {
        startGame();
    }
});

window.addEventListener("resize", setupCanvas);
setupCanvas();
setInterval(drawGame, 100);
