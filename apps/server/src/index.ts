import { DurableObject } from "cloudflare:workers";
import {
  comeBack,
  createRoom,
  gameFor,
  isGameId,
  isRoomCode,
  joinRoom,
  LOOKING_ELSEWHERE,
  makeRoomCode,
  parseClientMessage,
  pauseClock,
  PING,
  playMove,
  PONG,
  requestRematch,
  ROOM_NOT_FOUND,
  ROOM_VERSION,
  RoomError,
  seatOf,
  snapshotFor,
  timeOut,
  type GameId,
  type MatchMessage,
  type MoveRecord,
  type Reaction,
  type Room,
  type ServerMessage,
} from "@laro/rooms";

/** Rooms nobody has touched for a day are deleted. */
const ROOM_LIFETIME_MS = 24 * 60 * 60 * 1000;

/** Stored on each socket. The player id is filled in once the browser says hello. */
interface SocketInfo {
  playerId: string | null;
  /** When this socket last sent a reaction, so nobody can flood the room with them. */
  reactedAt?: number;
}

/** The shortest gap between two reactions from the same player. */
const REACTION_GAP_MS = 700;

function allowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  return env.ALLOWED_ORIGINS.split(",").includes(origin) ? origin : null;
}

function json(body: unknown, status: number, origin: string | null): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const origin = allowedOrigin(request, env);

    // Browsers on other sites can't create rooms or connect. Tools without an Origin header still can.
    if (request.headers.has("Origin") && !origin) return json({ error: "Origin not allowed" }, 403, null);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin ?? "",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (url.pathname === "/rooms" && request.method === "POST") {
      const body = (await request.json().catch(() => null)) as { game?: unknown; players?: unknown } | null;
      const gameId = body?.game;
      if (!isGameId(gameId)) return json({ error: "Unknown game" }, 400, origin);
      const game = gameFor(gameId);
      // How many seats the room has. Games for two don't need to say.
      const players = body?.players ?? game.minSeats;
      const { minSeats, maxSeats } = game;
      if (typeof players !== "number" || !Number.isInteger(players) || players < minSeats || players > maxSeats) {
        return json({ error: `${game.name} is played by ${minSeats} to ${maxSeats} players.` }, 400, origin);
      }

      const code = await makeRoom(env, gameId, players);
      if (code) return json({ code }, 201, origin);
      return json({ error: "Couldn't make a room. Try again." }, 503, origin);
    }

    // Everyone looking for a game with anyone waits in the one lobby.
    const match = url.pathname.match(/^\/match\/([^/]+)\/(\d)\/socket$/);
    if (match) {
      if (request.headers.get("Upgrade") !== "websocket") return json({ error: "Expected a WebSocket" }, 426, origin);
      const [, gameId, count] = match;
      const players = Number(count);
      if (!isGameId(gameId)) return json({ error: "Unknown game" }, 404, origin);
      const { minSeats, maxSeats } = gameFor(gameId);
      if (players < minSeats || players > maxSeats) return json({ error: "Wrong number of players" }, 400, origin);
      return env.LOBBY.get(env.LOBBY.idFromName("lobby")).fetch(request);
    }

    const socket = url.pathname.match(/^\/rooms\/([^/]+)\/socket$/);
    if (socket) {
      if (request.headers.get("Upgrade") !== "websocket") return json({ error: "Expected a WebSocket" }, 426, origin);
      const code = socket[1];
      if (!isRoomCode(code)) return json({ error: "Not a room code" }, 404, origin);
      return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
    }

    return json({ error: "Not found" }, 404, origin);
  },
} satisfies ExportedHandler<Env>;

/** Makes a room with a fresh code. Returns null if every code tried was taken. */
async function makeRoom(env: Env, gameId: GameId, players: number): Promise<string | null> {
  // Codes are random, so a clash is rare. Try a few times before giving up.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeRoomCode(Math.random);
    if (await env.ROOMS.get(env.ROOMS.idFromName(code)).create(code, gameId, players)) return code;
  }
  return null;
}

/**
 * One room. It keeps the game state, decides whose move counts, and sends every
 * connected browser what it's allowed to see. Sockets use the hibernation API,
 * so an idle room costs nothing while players think.
 */
export class RoomObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(PING, PONG));
  }

  /** Sets up a new room. Returns false if this code is already in use. */
  async create(code: string, gameId: Room["gameId"], players: number): Promise<boolean> {
    if (await this.ctx.storage.get<Room>("room")) return false;
    await this.save(createRoom(code, gameId, Date.now(), players));
    return true;
  }

  async fetch(request: Request): Promise<Response> {
    const [client, server] = Object.values(new WebSocketPair());
    if (!(await this.ctx.storage.get<Room>("room"))) {
      // Accept, explain, and close, so the browser can tell this apart from a dropped connection.
      server.accept();
      server.send(JSON.stringify({ type: "error", message: "This room doesn't exist or has expired." } satisfies ServerMessage));
      server.close(ROOM_NOT_FOUND, "Room not found");
      return new Response(null, { status: 101, webSocket: client });
    }

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ playerId: null } satisfies SocketInfo);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const { playerId } = ws.deserializeAttachment() as SocketInfo;
    const message = parseClientMessage(raw);
    const room = await this.ctx.storage.get<Room>("room");
    if (!message || !room) return;

    if (message.type === "hello") {
      ws.serializeAttachment({ playerId: message.playerId } satisfies SocketInfo);
      const joined = joinRoom(room, { id: message.playerId, name: message.name }, Date.now(), Math.random);
      if (joined.room !== room) await this.save(joined.room);
      this.broadcast(joined.room);
      return;
    }
    if (playerId === null) return;

    if (message.type === "react") {
      const seat = seatOf(room, playerId);
      const { reactedAt = 0 } = ws.deserializeAttachment() as SocketInfo;
      if (seat === null || Date.now() - reactedAt < REACTION_GAP_MS) return;
      ws.serializeAttachment({ playerId, reactedAt: Date.now() } satisfies SocketInfo);
      this.sendReaction(seat, message.reaction);
      return;
    }

    try {
      if (message.type === "move") {
        const { room: next, lastMove } = playMove(room, playerId, message.move, Date.now());
        await this.save(next);
        this.broadcast(next, lastMove);
      } else if (message.type === "back") {
        const next = comeBack(room, playerId, Date.now());
        if (next === room) return;
        await this.save(next);
        this.broadcast(next);
      } else {
        const next = requestRematch(room, playerId, Date.now());
        await this.save(next);
        this.broadcast(next);
      }
    } catch (error) {
      if (!(error instanceof RoomError)) throw error;
      ws.send(JSON.stringify({ type: "error", message: error.message } satisfies ServerMessage));
    }
  }

  async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    try {
      ws.close(code === 1005 ? 1000 : code, "Closing");
    } catch {
      // Already closed.
    }
    const room = await this.ctx.storage.get<Room>("room");
    if (room) this.broadcast(room, undefined, ws);
  }

  /** Goes off when time is up for a move, and a day after a room was last used. */
  async alarm(): Promise<void> {
    const room = await this.ctx.storage.get<Room>("room");
    if (!room) return;
    const now = Date.now();
    if (room.deadline != null && now >= room.deadline) {
      const timedOut = this.players().length > 0 ? timeOut(room, now, Math.random) : null;
      if (timedOut) {
        await this.save(timedOut.room);
        this.broadcast(timedOut.room, timedOut.lastMove);
      } else {
        // Nobody's here, so stop the clock instead of playing the game out on its own. Coming back starts it again.
        await this.save(pauseClock(room));
      }
      return;
    }
    if (now - room.updatedAt >= ROOM_LIFETIME_MS && this.ctx.getWebSockets().length === 0) {
      await this.ctx.storage.deleteAll();
    } else {
      await this.schedule(room);
    }
  }

  private async save(room: Room): Promise<void> {
    await this.ctx.storage.put("room", room);
    await this.schedule(room);
  }

  /** One alarm does both jobs: when time is up for a move if a clock is running, otherwise a day from now. */
  private async schedule(room: Room): Promise<void> {
    await this.ctx.storage.setAlarm(room.deadline ?? Date.now() + ROOM_LIFETIME_MS);
  }

  /** The sockets of everyone who has said hello. */
  private players(leaving?: WebSocket): { ws: WebSocket; playerId: string }[] {
    return this.ctx
      .getWebSockets()
      .filter((ws) => ws !== leaving)
      .map((ws) => ({ ws, playerId: (ws.deserializeAttachment() as SocketInfo).playerId }))
      .filter((socket): socket is { ws: WebSocket; playerId: string } => socket.playerId !== null);
  }

  /** Sends every player its own view of the room. `leaving` is a socket that is closing right now. */
  private broadcast(room: Room, lastMove?: MoveRecord, leaving?: WebSocket): void {
    const players = this.players(leaving);
    const online = new Set(players.map((socket) => socket.playerId));
    for (const { ws, playerId } of players) {
      const snapshot = snapshotFor(room, playerId, online);
      const message: ServerMessage = { type: "room", room: snapshot, lastMove, version: ROOM_VERSION };
      try {
        ws.send(JSON.stringify(message));
      } catch {
        // The socket closed while we were sending. Its close handler will tell the others.
      }
    }
  }

  /** Passes a reaction on to everyone in the room, the player who sent it included. */
  private sendReaction(seat: number, reaction: Reaction): void {
    const message = JSON.stringify({ type: "reaction", seat, reaction } satisfies ServerMessage);
    for (const ws of this.ctx.getWebSockets()) {
      if ((ws.deserializeAttachment() as SocketInfo).playerId === null) continue;
      try {
        ws.send(message);
      } catch {
        // Already closing.
      }
    }
  }
}

/** Stored on each socket in the lobby. */
interface SeekerInfo {
  /** Which game and how many players, like "dama/2". Only people looking for the same thing are matched. */
  wants: string;
  playerId: string | null;
  /** When they started looking, so whoever waited longest is matched first. */
  since: number;
  /** Set once they're put in a room, while the room is being made. */
  matched?: boolean;
}

/**
 * The lobby, where people looking for a game with anyone wait. Once enough
 * people want the same game, it makes a room, tells them its code, and they
 * join it like any other room. Nothing is stored: whoever is connected is who's
 * waiting.
 */
export class LobbyObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(PING, PONG));
  }

  async fetch(request: Request): Promise<Response> {
    const [, gameId, players] = new URL(request.url).pathname.split("/").slice(1);
    const [client, server] = Object.values(new WebSocketPair());
    const wants = `${gameId}/${players}`;
    this.ctx.acceptWebSocket(server, [wants]);
    server.serializeAttachment({ wants, playerId: null, since: Date.now() } satisfies SeekerInfo);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const message = parseClientMessage(raw);
    const info = ws.deserializeAttachment() as SeekerInfo;
    if (message?.type !== "hello" || info.playerId !== null) return;
    // The same player looking in two tabs would be matched with themselves, so the older tab stops looking.
    for (const other of this.seekers(info.wants)) {
      if (other.info.playerId === message.playerId) other.ws.close(LOOKING_ELSEWHERE, "Looking in another tab");
    }
    ws.serializeAttachment({ ...info, playerId: message.playerId } satisfies SeekerInfo);
    await this.match(info.wants);
  }

  async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    const { wants } = ws.deserializeAttachment() as SeekerInfo;
    try {
      ws.close(code === 1005 ? 1000 : code, "Closing");
    } catch {
      // Already closed.
    }
    this.tellWaiting(wants, ws);
  }

  /** Puts the people who have waited longest in rooms, as many rooms as there are people for. */
  private async match(wants: string): Promise<void> {
    const [gameId, count] = wants.split("/");
    const players = Number(count);
    let waiting = this.seekers(wants);
    while (waiting.length >= players) {
      const group = waiting.slice(0, players);
      waiting = waiting.slice(players);
      // Marked before the room is made, since someone else can arrive while we wait for it.
      for (const { ws, info } of group) ws.serializeAttachment({ ...info, matched: true } satisfies SeekerInfo);
      const code = await makeRoom(this.env, gameId as GameId, players);
      const message: MatchMessage = code ? { type: "matched", code } : { type: "error", message: "Couldn't make a room. Try again." };
      for (const { ws } of group) {
        try {
          ws.send(JSON.stringify(message));
          ws.close(1000, "Matched");
        } catch {
          // They left just now. The others go to the room and wait there.
        }
      }
    }
    this.tellWaiting(wants);
  }

  /** Tells everyone still looking for this game how many are looking. */
  private tellWaiting(wants: string, leaving?: WebSocket): void {
    const waiting = this.seekers(wants).filter(({ ws }) => ws !== leaving);
    const message = JSON.stringify({
      type: "waiting",
      here: waiting.length,
      players: Number(wants.split("/")[1]),
    } satisfies MatchMessage);
    for (const { ws } of waiting) {
      try {
        ws.send(message);
      } catch {
        // Already closing.
      }
    }
  }

  /** Everyone who has said hello and is still looking for this game, longest waiting first. */
  private seekers(wants: string): { ws: WebSocket; info: SeekerInfo }[] {
    return this.ctx
      .getWebSockets(wants)
      .filter((ws) => ws.readyState === WebSocket.OPEN)
      .map((ws) => ({ ws, info: ws.deserializeAttachment() as SeekerInfo }))
      .filter(({ info }) => info.playerId !== null && !info.matched)
      .sort((a, b) => a.info.since - b.info.since);
  }
}
