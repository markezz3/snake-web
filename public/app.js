const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 600;

ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

console.log("Canvas listo");