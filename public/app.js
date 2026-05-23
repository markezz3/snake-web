const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const usernameInput = document.getElementById("username");
const currentPlayerName = document.getElementById("current-player-name");
const currentBest = document.getElementById("current-best");
const onlinePlayersList = document.getElementById("online-players");
const leaderboardList = document.getElementById("leaderboard");

let onlinePlayers = {};
let leaderboard = [];
let snake;
let food;
let score;
let dx;
let dy;
let gridSize = canvas.width / 30;

let gameRunning = false;
let gameOver = false;
let usernameSent = false;

const savedUsername = localStorage.getItem("lastUsername") || "";
const savedBest = JSON.parse(localStorage.getItem("bestRecord") || "null") || {
    score: 0,
    name: "Anonymous"
};

let currentUsername = savedUsername || "Anonymous";
let bestRecord = savedBest;

if (savedUsername) {
    usernameInput.value = savedUsername;
}

currentPlayerName.textContent = currentUsername;
renderBest();
renderPlayers();
renderLeaderboard();

socket.on("connect", () => {
    console.log("Conectado al servidor:", socket.id);
});

socket.on("initial-state", ({ players, leaderboard: initialLeaderboard }) => {
    onlinePlayers = players || {};
    leaderboard = initialLeaderboard || [];
    renderPlayers();
    renderLeaderboard();
});

socket.on("players-update", players => {
    onlinePlayers = players || {};
    renderPlayers();
});

socket.on("leaderboard-update", updatedLeaderboard => {
    leaderboard = updatedLeaderboard || [];
    renderLeaderboard();
});

function getCanvasSize() {
    const availableWidth = Math.max(280, Math.min(window.innerWidth - 32, 600));
    return availableWidth;
}

function setupCanvas() {
    const size = getCanvasSize();
    canvas.width = size;
    canvas.height = size;
    gridSize = canvas.width / 30;
}

function formatBestLabel() {
    return `Best: ${bestRecord.score} • ${bestRecord.name}`;
}

function renderBest() {
    currentBest.textContent = formatBestLabel();
}

function renderPlayers() {
    const entries = Object.values(onlinePlayers)
        .sort((a, b) => b.score - a.score)
        .map(player => `
            <li class="player-item">
                <span>${player.username}</span>
                <span class="player-score">${player.score}</span>
            </li>
        `)
        .join("");

    onlinePlayersList.innerHTML = entries || "<li>Sin jugadores conectados</li>";
}

function renderLeaderboard() {
    const entries = leaderboard
        .map(player => `
            <li class="leaderboard-item">
                <span>#${player.rank} ${player.username}</span>
                <span class="leaderboard-score">${player.score}</span>
            </li>
        `)
        .join("");

    leaderboardList.innerHTML = entries || "<li>Sin puntajes aún</li>";
}

function saveUsername() {
    currentUsername = usernameInput.value.trim().slice(0, 12) || "Anonymous";
    localStorage.setItem("lastUsername", currentUsername);
    currentPlayerName.textContent = currentUsername;

    if (!usernameSent) {
        socket.emit("new-player", currentUsername);
        usernameSent = true;
    }
}

function startGame() {
    saveUsername();

    snake = [{ x: gridSize * 5, y: gridSize * 5 }];
    food = { x: gridSize * 15, y: gridSize * 15 };
    score = 0;
    dx = gridSize;
    dy = 0;
    gameRunning = true;
    gameOver = false;
}

function drawGame() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();

    if (!gameRunning && !gameOver) {
        drawCenteredText("PRESS SPACE", canvas.height / 2);
        return;
    }

    if (gameOver) {
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
        head.x >= canvas.width ||
        head.y >= canvas.height
    ) {
        endGame();
        return;
    }

    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            endGame();
            return;
        }
    }

    snake.unshift(head);

    const ateFood = head.x === food.x && head.y === food.y;

    if (!ateFood) {
        snake.pop();
    } else {
        score++;

        if (score > bestRecord.score) {
            bestRecord = {
                score,
                name: currentUsername
            };
            localStorage.setItem("bestRecord", JSON.stringify(bestRecord));
            renderBest();
        }

        socket.emit("score-update", score);

        food.x = Math.floor(Math.random() * 30) * gridSize;
        food.y = Math.floor(Math.random() * 30) * gridSize;
    }

    ctx.fillStyle = "white";
    ctx.font = canvas.width < 400 ? "16px Arial" : "24px Arial";
    ctx.fillText("Score: " + score, 10, 25);
    ctx.fillText(formatBestLabel(), 10, 45);

    ctx.fillStyle = "#ff004c";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff004c";
    ctx.fillRect(food.x, food.y, gridSize, gridSize);

    ctx.fillStyle = "#00ff88";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ff88";
    snake.forEach(segment => {
        ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
    });

    ctx.shadowBlur = 0;
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
    const key = event.key;

    if (key === " ") {
        if (!gameRunning) {
            startGame();
        }
        return;
    }

    if (!gameRunning) return;

    if (key === "ArrowUp" && dy === 0) {
        dx = 0;
        dy = -gridSize;
    }

    if (key === "ArrowDown" && dy === 0) {
        dx = 0;
        dy = gridSize;
    }

    if (key === "ArrowLeft" && dx === 0) {
        dx = -gridSize;
        dy = 0;
    }

    if (key === "ArrowRight" && dx === 0) {
        dx = gridSize;
        dy = 0;
    }
});

document.getElementById("up").addEventListener("click", () => {
    if (dy === 0 && gameRunning) {
        dx = 0;
        dy = -gridSize;
    }
});

document.getElementById("down").addEventListener("click", () => {
    if (dy === 0 && gameRunning) {
        dx = 0;
        dy = gridSize;
    }
});

document.getElementById("left").addEventListener("click", () => {
    if (dx === 0 && gameRunning) {
        dx = -gridSize;
        dy = 0;
    }
});

document.getElementById("right").addEventListener("click", () => {
    if (dx === 0 && gameRunning) {
        dx = gridSize;
        dy = 0;
    }
});

document.getElementById("start-button").addEventListener("click", () => {
    if (!gameRunning) {
        startGame();
    }
});

setupCanvas();
setInterval(drawGame, 100);