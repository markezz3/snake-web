const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {

    console.log("Usuario conectado:", socket.id);

    socket.emit(
        "welcome",
        "Bienvenido al servidor"
    );

    socket.on("disconnect", () => {

        console.log(
            "Usuario desconectado:",
            socket.id
        );
    });
});

server.listen(3000, () => {

    console.log(
        "Servidor corriendo en puerto 3000"
    );
});