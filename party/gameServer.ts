import type * as Party from "partykit/server";

// Store active room metadata
const activeRooms = new Map<string, { createdAt: number; playerCount: number }>();

export default class GameServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Update room metadata
    const roomId = this.room.id;
    const currentRoom = activeRooms.get(roomId) || { 
      createdAt: Date.now(), 
      playerCount: 0 
    };
    currentRoom.playerCount++;
    activeRooms.set(roomId, currentRoom);

    console.log(`Player ${conn.id} connected to room ${roomId} (${currentRoom.playerCount} players)`);

    // Send connection confirmation with room info
    conn.send(JSON.stringify({
      type: 'connected',
      id: conn.id,
      roomId: this.room.id,
      playerCount: currentRoom.playerCount
    }));

    // Notify others that a player joined
    this.room.broadcast(
      JSON.stringify({
        type: 'player-joined',
        playerId: conn.id,
        playerName: ctx.request.url.split('?name=')[1] || 'Guest',
        playerCount: currentRoom.playerCount
      }),
      [conn.id] // exclude sender
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    // Broadcast all game messages to other players in the room
    const data = JSON.parse(message);
    console.log(`Message from ${sender.id}:`, data.type);

    // Broadcast to all players except sender
    this.room.broadcast(message, [sender.id]);
  }

  onClose(conn: Party.Connection) {
    const roomId = this.room.id;
    const currentRoom = activeRooms.get(roomId);
    
    if (currentRoom) {
      currentRoom.playerCount--;
      
      // If room is empty, schedule cleanup
      if (currentRoom.playerCount <= 0) {
        console.log(`Room ${roomId} is now empty, scheduling cleanup`);
        // Remove room from active list after 5 minutes of inactivity
        setTimeout(() => {
          const room = activeRooms.get(roomId);
          if (room && room.playerCount <= 0) {
            activeRooms.delete(roomId);
            console.log(`Room ${roomId} cleaned up`);
          }
        }, 5 * 60 * 1000); // 5 minutes
      } else {
        activeRooms.set(roomId, currentRoom);
      }
    }

    // Notify others that a player left
    this.room.broadcast(
      JSON.stringify({
        type: 'player-left',
        playerId: conn.id,
        playerCount: currentRoom?.playerCount || 0
      }),
      [conn.id]
    );

    console.log(`Player ${conn.id} disconnected from room ${roomId} (${currentRoom?.playerCount || 0} players remaining)`);
  }

  // Static method to check if room exists and has space
  static async isRoomAvailable(roomId: string): Promise<boolean> {
    const room = activeRooms.get(roomId);
    // Room is available if it doesn't exist or has less than 2 players
    return !room || room.playerCount < 2;
  }
}

GameServer satisfies Party.Worker;
