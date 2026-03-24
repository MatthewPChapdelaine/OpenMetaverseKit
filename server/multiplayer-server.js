import { createServer } from "node:http";

import { WebSocketServer } from "ws";

const port = Number.parseInt(process.env.OPEN_METAVERSE_PORT ?? "8787", 10);
const server = createServer();
const wss = new WebSocketServer({ server });

const rooms = new Map();

wss.on("connection", (socket) => {
  const playerId = randomId();
  let roomId = null;

  socket.send(JSON.stringify({
    type: "welcome",
    playerId
  }));

  socket.on("message", (raw) => {
    let payload;
    try {
      payload = JSON.parse(raw.toString());
    } catch {
      socket.send(JSON.stringify({ type: "error", message: "Invalid JSON message." }));
      return;
    }

    if (payload.type === "join") {
      roomId = joinRoom(socket, playerId, payload.roomId, payload.playerName);
      return;
    }

    if (!roomId) {
      socket.send(JSON.stringify({ type: "error", message: "Join a room before sending room events." }));
      return;
    }

    if (payload.type === "player-state") {
      updatePlayerState(roomId, playerId, payload.state);
      broadcastToRoom(roomId, {
        type: "player-state",
        player: getPlayer(roomId, playerId)
      });
      return;
    }

    if (payload.type === "chat-message") {
      const room = rooms.get(roomId);
      const player = room?.players.get(playerId);
      if (!room || !player) {
        return;
      }

      const text = String(payload.text ?? "").trim().slice(0, 400);
      if (!text) {
        return;
      }

      const message = {
        id: randomId(),
        playerId,
        playerName: player.playerName,
        text,
        timestamp: new Date().toISOString()
      };

      room.messages.push(message);
      room.messages = room.messages.slice(-40);
      broadcastToRoom(roomId, {
        type: "chat-message",
        message
      });
      return;
    }

    if (payload.type === "player-emote") {
      const player = getPlayer(roomId, playerId);
      if (!player) {
        return;
      }

      player.emote = String(payload.emote ?? "").trim().slice(0, 30);
      player.emoteUntil = Number.isFinite(payload.emoteUntil) ? payload.emoteUntil : Date.now() + 2500;

      broadcastToRoom(roomId, {
        type: "player-emote",
        playerId,
        playerName: player.playerName,
        emote: player.emote,
        emoteUntil: player.emoteUntil
      });
    }
  });

  socket.on("close", () => {
    if (roomId) {
      leaveRoom(roomId, playerId);
    }
  });
});

server.listen(port, () => {
  console.log(`[openmetaverse] multiplayer server listening on ws://localhost:${port}`);
});

function joinRoom(socket, playerId, rawRoomId, rawPlayerName) {
  const roomId = sanitizeRoomId(rawRoomId);
  const playerName = sanitizePlayerName(rawPlayerName);
  const room = getOrCreateRoom(roomId);

  room.clients.set(playerId, socket);
  room.players.set(playerId, {
    playerId,
    playerName,
    position: { x: 0, y: 1.6, z: 0 },
    rotationY: 0,
    emote: null,
    emoteUntil: null,
    seated: false,
    seatId: null,
    updatedAt: new Date().toISOString()
  });

  sendRoomSnapshot(roomId);
  broadcastToRoom(roomId, {
    type: "system-message",
    message: `${playerName} joined ${roomId}.`
  });

  return roomId;
}

function leaveRoom(roomId, playerId) {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  const player = room.players.get(playerId);
  room.clients.delete(playerId);
  room.players.delete(playerId);

  if (player) {
    broadcastToRoom(roomId, {
      type: "system-message",
      message: `${player.playerName} left ${roomId}.`
    });
  }

  broadcastToRoom(roomId, {
    type: "player-left",
    playerId
  });
  sendRoomSnapshot(roomId);

  if (room.clients.size === 0) {
    rooms.delete(roomId);
  }
}

function updatePlayerState(roomId, playerId, state) {
  const player = getPlayer(roomId, playerId);
  if (!player) {
    return;
  }

  player.position = {
    x: finiteNumber(state?.position?.x),
    y: finiteNumber(state?.position?.y, 1.6),
    z: finiteNumber(state?.position?.z)
  };
  player.rotationY = finiteNumber(state?.rotationY);
  player.emote = typeof state?.emote === "string" ? state.emote : player.emote;
  player.emoteUntil = Number.isFinite(state?.emoteUntil) ? state.emoteUntil : player.emoteUntil;
  player.seated = Boolean(state?.seated);
  player.seatId = typeof state?.seatId === "string" ? state.seatId : null;
  player.updatedAt = new Date().toISOString();
}

function getPlayer(roomId, playerId) {
  return rooms.get(roomId)?.players.get(playerId) ?? null;
}

function sendRoomSnapshot(roomId) {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  broadcastToRoom(roomId, {
    type: "room-state",
    roomId,
    players: Array.from(room.players.values()),
    messages: room.messages
  });
}

function broadcastToRoom(roomId, payload) {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  const message = JSON.stringify(payload);
  for (const socket of room.clients.values()) {
    if (socket.readyState === 1) {
      socket.send(message);
    }
  }
}

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      clients: new Map(),
      players: new Map(),
      messages: []
    });
  }

  return rooms.get(roomId);
}

function sanitizeRoomId(value) {
  const normalized = String(value ?? "commons").trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
  return normalized || "commons";
}

function sanitizePlayerName(value) {
  const normalized = String(value ?? "Guest").trim().slice(0, 40);
  return normalized || "Guest";
}

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}
