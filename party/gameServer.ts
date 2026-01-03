import type * as Party from "partykit/server";

// Store active room metadata
const activeRooms = new Map<string, { 
  createdAt: number; 
  playerCount: number;
  hostId: string | null;
}>();

export default class GameServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const roomId = this.room.id;
    const currentRoom = activeRooms.get(roomId);
    
    // Check if room exists (has a host) or if this is the first player (creating room)
    if (!currentRoom) {
      // First player - they are the host creating the room
      activeRooms.set(roomId, { 
        createdAt: Date.now(), 
        playerCount: 1,
        hostId: conn.id
      });
      
      console.log(`✅ Room ${roomId} created by host ${conn.id}`);
      
      // Send connection confirmation with host status
      conn.send(JSON.stringify({
        type: 'connected',
        id: conn.id,
        roomId: this.room.id,
        playerCount: 1,
        isHost: true
      }));
      
      return;
    }
    
    // Check if room is full (already has 2 players)
    if (currentRoom.playerCount >= 2) {
      console.log(`❌ Room ${roomId} is full, rejecting player ${conn.id}`);
      
      conn.send(JSON.stringify({
        type: 'error',
        message: 'Room is full. Maximum 2 players allowed.'
      }));
      
      conn.close(1000, 'Room is full');
      return;
    }
    
    // Second player joining existing room
    currentRoom.playerCount++;
    activeRooms.set(roomId, currentRoom);

    console.log(`✅ Player ${conn.id} joined room ${roomId} (${currentRoom.playerCount} players)`);

    // Send connection confirmation
    conn.send(JSON.stringify({
      type: 'connected',
      id: conn.id,
      roomId: this.room.id,
      playerCount: currentRoom.playerCount,
      isHost: false
    }));

    // Notify host that a player joined
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
      
      // Check if the host left
      const hostLeft = currentRoom.hostId === conn.id;
      
      // If room is empty or host left, schedule cleanup
      if (currentRoom.playerCount <= 0 || hostLeft) {
        console.log(`🧹 Room ${roomId} ${hostLeft ? 'host left' : 'is empty'}, scheduling cleanup`);
        
        // If host left but guest is still there, notify guest
        if (hostLeft && currentRoom.playerCount > 0) {
          this.room.broadcast(
            JSON.stringify({
              type: 'host-left',
              message: 'Host has left the room'
            })
          );
        }
        
        // Remove room from active list after 5 minutes of inactivity
        setTimeout(() => {
          const room = activeRooms.get(roomId);
          if (room && (room.playerCount <= 0 || room.hostId === conn.id)) {
            activeRooms.delete(roomId);
            console.log(`🗑️ Room ${roomId} cleaned up`);
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

  // Handle room existence check via HTTP request
  async onRequest(req: Party.Request) {
    const url = new URL(req.url);
    
    // Check if room exists endpoint
    if (url.pathname.endsWith('/exists')) {
      const roomId = this.room.id;
      const room = activeRooms.get(roomId);
      
      return new Response(JSON.stringify({
        exists: !!room && room.playerCount > 0,
        playerCount: room?.playerCount || 0,
        isFull: room ? room.playerCount >= 2 : false
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not found', { status: 404 });
  }
}

GameServer satisfies Party.Worker;
