const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth < 700
    ? 300
    : 600;

canvas.height = canvas.width;

const gridSize = canvas.width / 30;

let snake;
let food;
let score;

let dx;
let dy;

let gameRunning = false;
let gameOver = false;

function startGame() {

    snake = [
        { x: gridSize * 5, y: gridSize * 5 }
    ];

    food = {
        x: gridSize * 15,
        y: gridSize * 15
    };

    score = 0;

    dx = gridSize;
    dy = 0;

    gameRunning = true;
    gameOver = false;
}

function drawGame() {

    // Fondo
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();

    // Pantalla inicial
    if (!gameRunning && !gameOver) {

        drawCenteredText("PRESS SPACE", canvas.height / 2);

        return;
    }

    // Pantalla game over
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

    // Movimiento
    const head = {
        x: snake[0].x + dx,
        y: snake[0].y + dy
    };

    // Colisión paredes
    if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= canvas.width ||
        head.y >= canvas.height
    ) {
        endGame();
        return;
    }

    // Colisión consigo mismo
    for (let i = 0; i < snake.length; i++) {

        if (
            snake[i].x === head.x &&
            snake[i].y === head.y
        ) {
            endGame();
            return;
        }
    }

    snake.unshift(head);

    const ateFood =
        head.x === food.x &&
        head.y === food.y;

    if (!ateFood) {

        snake.pop();

    } else {

        score++;

        food.x =
            Math.floor(Math.random() * 30) * gridSize;

        food.y =
            Math.floor(Math.random() * 30) * gridSize;
    }

    // Score
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Score: " + score, 20, 30);

    // Comida
    ctx.fillStyle = "#ff004c";

    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff004c";

    ctx.fillRect(
        food.x,
        food.y,
        gridSize,
        gridSize
    );

    // Snake
    ctx.fillStyle = "#00ff88";

    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ff88";

    snake.forEach(segment => {

        ctx.fillRect(
            segment.x,
            segment.y,
            gridSize,
            gridSize
        );
    });

    ctx.shadowBlur = 0;
}

function drawGrid() {

    ctx.strokeStyle = "#1a1a1a";

    for (
        let i = 0;
        i < canvas.width;
        i += gridSize
    ) {

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

    const textWidth =
        ctx.measureText(text).width;

    ctx.fillText(
        text,
        (canvas.width - textWidth) / 2,
        y
    );
}

function endGame() {

    gameRunning = false;
    gameOver = true;
}

document.addEventListener("keydown", event => {

    const key = event.key;

    // START / RESTART
    if (key === " ") {

        if (!gameRunning) {
            startGame();
        }

        return;
    }

    if (!gameRunning) return;

    // Movimiento
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

// MOBILE CONTROLS

document.getElementById("up")
    .addEventListener("click", () => {

    if (dy === 0 && gameRunning) {

        dx = 0;
        dy = -gridSize;
    }
});

document.getElementById("down")
    .addEventListener("click", () => {

    if (dy === 0 && gameRunning) {

        dx = 0;
        dy = gridSize;
    }
});

document.getElementById("left")
    .addEventListener("click", () => {

    if (dx === 0 && gameRunning) {

        dx = -gridSize;
        dy = 0;
    }
});

document.getElementById("right")
    .addEventListener("click", () => {

    if (dx === 0 && gameRunning) {

        dx = gridSize;
        dy = 0;
    }
});

setInterval(drawGame, 100);