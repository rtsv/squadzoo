import Peer from 'peerjs';

class RoomService {
  constructor() {
    this.peer = null;
    this.connections = new Map();
    this.roomId = null;
    this.isHost = false;
    this.playerName = '';
    this.callbacks = {};
  }

  // Initialize peer connection
  async initialize(playerName) {
    this.playerName = playerName;
    
    // Create a new peer with a random ID
    this.peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    return new Promise((resolve, reject) => {
      this.peer.on('open', (id) => {
        console.log('Peer initialized with ID:', id);
        resolve(id);
      });

      this.peer.on('error', (error) => {
        console.error('Peer error:', error);
        reject(error);
      });

      // Handle incoming connections
      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });
    });
  }

  // Create a new room (host)
  async createRoom() {
    if (!this.peer) {
      throw new Error('Peer not initialized');
    }
    
    this.isHost = true;
    this.roomId = this.peer.id;
    
    return {
      roomId: this.roomId,
      roomCode: this.generateRoomCode(this.roomId)
    };
  }

  // Join an existing room (guest)
  async joinRoom(hostPeerId) {
    if (!this.peer) {
      throw new Error('Peer not initialized');
    }

    this.isHost = false;
    this.roomId = hostPeerId;

    return new Promise((resolve, reject) => {
      const conn = this.peer.connect(hostPeerId, {
        reliable: true,
        metadata: { playerName: this.playerName }
      });

      conn.on('open', () => {
        this.setupConnection(conn);
        // Send join message
        this.sendToConnection(conn, {
          type: 'player-joined',
          playerName: this.playerName,
          peerId: this.peer.id
        });
        resolve(conn);
      });

      conn.on('error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });
    });
  }

  // Setup connection event handlers
  setupConnection(conn) {
    this.connections.set(conn.peer, conn);

    conn.on('data', (data) => {
      this.handleMessage(data, conn);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      if (this.callbacks.onPlayerLeft) {
        this.callbacks.onPlayerLeft({ peerId: conn.peer });
      }
    });

    conn.on('error', (error) => {
      console.error('Connection error:', error);
    });

    // Notify that player joined
    if (this.isHost && this.callbacks.onPlayerJoined) {
      this.callbacks.onPlayerJoined({
        playerName: conn.metadata?.playerName,
        peerId: conn.peer
      });
    }
  }

  // Handle incoming messages
  handleMessage(data, conn) {
    console.log('Received message:', data);

    switch (data.type) {
      case 'player-joined':
        if (this.callbacks.onPlayerJoined) {
          this.callbacks.onPlayerJoined(data);
        }
        // If host, broadcast to all other players
        if (this.isHost) {
          this.broadcast(data, conn.peer);
        }
        break;

      case 'game-state':
        if (this.callbacks.onGameState) {
          this.callbacks.onGameState(data.state);
        }
        break;

      case 'game-action':
        if (this.callbacks.onGameAction) {
          this.callbacks.onGameAction(data);
        }
        // If host, broadcast to all players
        if (this.isHost) {
          this.broadcast(data, conn.peer);
        }
        break;

      case 'chat-message':
        if (this.callbacks.onChatMessage) {
          this.callbacks.onChatMessage(data);
        }
        break;

      default:
        if (this.callbacks.onMessage) {
          this.callbacks.onMessage(data);
        }
    }
  }

  // Send message to specific connection
  sendToConnection(conn, data) {
    if (conn && conn.open) {
      conn.send(data);
    }
  }

  // Broadcast message to all connections except sender
  broadcast(data, excludePeerId = null) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(data);
      }
    });
  }

  // Send message to all players (including broadcast if host)
  sendToRoom(data) {
    if (this.isHost) {
      // Host broadcasts to all guests
      this.broadcast(data);
    } else {
      // Guest sends to host
      const hostConn = this.connections.get(this.roomId);
      if (hostConn) {
        this.sendToConnection(hostConn, data);
      }
    }
  }

  // Send game action
  sendGameAction(action, payload) {
    this.sendToRoom({
      type: 'game-action',
      action,
      payload,
      playerName: this.playerName,
      peerId: this.peer?.id,
      timestamp: Date.now()
    });
  }

  // Send game state (usually only host does this)
  sendGameState(state) {
    this.sendToRoom({
      type: 'game-state',
      state,
      timestamp: Date.now()
    });
  }

  // Send chat message
  sendChatMessage(message) {
    this.sendToRoom({
      type: 'chat-message',
      message,
      playerName: this.playerName,
      timestamp: Date.now()
    });
  }

  // Register callbacks
  on(event, callback) {
    this.callbacks[event] = callback;
  }

  // Get all connected players
  getConnectedPlayers() {
    const players = Array.from(this.connections.entries()).map(([peerId, conn]) => ({
      peerId,
      playerName: conn.metadata?.playerName || 'Unknown'
    }));

    // Add self
    players.push({
      peerId: this.peer?.id,
      playerName: this.playerName,
      isHost: this.isHost
    });

    return players;
  }

  // Leave room and cleanup
  leaveRoom() {
    this.connections.forEach((conn) => {
      conn.close();
    });
    this.connections.clear();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.roomId = null;
    this.isHost = false;
    this.callbacks = {};
  }

  // Generate a short room code from peer ID
  generateRoomCode(peerId) {
    // Take first 6 characters and convert to uppercase
    return peerId.substring(0, 6).toUpperCase();
  }

  // Convert room code back to peer ID (you'll need to store full IDs somewhere)
  // This is a simplified version - in production, you'd want a proper mapping
  getRoomIdFromCode(code) {
    return code.toLowerCase();
  }

  // Check if connected
  isConnected() {
    return this.peer && !this.peer.destroyed;
  }
}

export default new RoomService();
