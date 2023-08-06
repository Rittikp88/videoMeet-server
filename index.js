const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5173",
    methods: ["GET", "POST"],
    transports: ['websocket', 'polling'],
    credentials: true
},
allowEIO3: true
});

io.set('transports', [ 'websocket', 'flashsocket', 'polling' ] );

const port = 8080;

const emailToSocketIdMap = new Map();

const socketIdToEmailMap = new Map();

/// Serve static files from the "dist" directory
// app.use(express.static(path.join(__dirname, "../webView-Video-call/dist")));

// Serve index.html for the root route
// app.get("/", (req, res, next) => {
//   res.send("<h4>kedhbjhwegdhwvedhw</h4>");
// });

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);
    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log(ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
