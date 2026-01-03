import type * as Party from "partykit/server";

export default class GameServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Send connection confirmation
    conn.send(JSON.stringify({
      type: 'connected',
      id: conn.id,
      roomId: this.room.id
    }));

    // Notify others that a player joined
    this.room.broadcast(
      JSON.stringify({
        type: 'player-joined',
        playerId: conn.id,
        playerName: ctx.request.url.split('?name=')[1] || 'Guest'
      }),
      [conn.id] // exclude sender
    );

    console.log(`Player ${conn.id} connected to room ${this.room.id}`);
  }

  onMessage(message: string, sender: Party.Connection) {
    // Broadcast all game messages to other players in the room
    const data = JSON.parse(message);
    console.log(`Message from ${sender.id}:`, data.type);

    // Broadcast to all players except sender
    this.room.broadcast(message, [sender.id]);
  }

  onClose(conn: Party.Connection) {
    // Notify others that a player left
    this.room.broadcast(
      JSON.stringify({
        type: 'player-left',
        playerId: conn.id
      }),
      [conn.id]
    );

    console.log(`Player ${conn.id} disconnected from room ${this.room.id}`);
  }
}

GameServer satisfies Party.Worker;
