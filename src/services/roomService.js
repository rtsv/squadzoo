import PartySocket from "partysocket";

class RoomService {
  constructor() {
    this.socket = null;
    this.roomId = null;
    this.playerId = null;
    this.isHost = false;
    this.playerName = '';
    this.callbacks = {};
    this.connectedPlayers = [];
  }

  // Initialize and join/create a room
  async initialize(playerName, roomId = null) {
    this.playerName = playerName;
    
    // Clean up existing connection first
    if (this.socket) {
      console.log('🧹 Cleaning up existing connection...');
      this.socket.close();
      this.socket = null;
    }
    
    // Generate or use provided room ID
    this.roomId = roomId || this.generateRoomId();
    this.isHost = !roomId; // If no roomId provided, this player is the host
    
    console.log(`🎮 ${this.isHost ? 'Creating' : 'Joining'} room:`, this.roomId);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout. Please try again.'));
      }, 10000);

      // Connect to PartyKit server
      // For development: use localhost:1999
      // For production: use your deployed PartyKit URL
      const host = window.location.hostname === 'localhost' 
        ? 'localhost:1999' 
        : 'squad-zoo-multiplayer.rtsv.partykit.dev';

      console.log('🔗 Connecting to PartyKit at:', host, 'room:', this.roomId);

      this.socket = new PartySocket({
        host,
        room: this.roomId,
        query: { name: encodeURIComponent(playerName) }
      });

      this.socket.addEventListener('open', () => {
        clearTimeout(timeout);
        console.log('✅ Connected to room!');
        resolve(this.roomId);
      });

      this.socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      });

      this.socket.addEventListener('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Socket error:', error);
        reject(new Error('Failed to connect. Please try again.'));
      });

      this.socket.addEventListener('close', () => {
        console.log('🔌 Disconnected from room');
        if (this.callbacks.onDisconnected) {
          this.callbacks.onDisconnected();
        }
      });
    });
  }

  // Handle incoming messages
  handleMessage(data) {
    console.log('📨 Received:', data.type);

    switch (data.type) {
      case 'connected':
        this.playerId = data.id;
        console.log('🆔 My player ID:', this.playerId);
        // Add self to connected players
        this.connectedPlayers.push({
          playerId: this.playerId,
          playerName: this.playerName,
          isHost: this.isHost
        });
        break;

      case 'player-joined':
        console.log('👋 Player joined:', data.playerName);
        // Add player to list
        this.connectedPlayers.push({
          playerId: data.playerId,
          playerName: decodeURIComponent(data.playerName),
          isHost: false
        });
        
        if (this.callbacks.onPlayerJoined) {
          this.callbacks.onPlayerJoined({
            playerId: data.playerId,
            playerName: decodeURIComponent(data.playerName)
          });
        }
        break;

      case 'player-left':
        console.log('👋 Player left:', data.playerId);
        // Remove player from list
        this.connectedPlayers = this.connectedPlayers.filter(
          p => p.playerId !== data.playerId
        );
        
        if (this.callbacks.onPlayerLeft) {
          this.callbacks.onPlayerLeft({ playerId: data.playerId });
        }
        break;

      case 'game-action':
        if (this.callbacks.onGameAction) {
          this.callbacks.onGameAction(data);
        }
        break;

      case 'game-start':
        if (this.callbacks.onGameStart) {
          this.callbacks.onGameStart(data);
        }
        break;

      default:
        if (this.callbacks.onMessage) {
          this.callbacks.onMessage(data);
        }
    }
  }

  // Create a new room (host)
  async createRoom() {
    const roomCode = this.generateRoomCode();
    await this.initialize(this.playerName, roomCode.toLowerCase()); // Store as lowercase
    this.isHost = true;
    
    console.log('🏠 Room created with code:', roomCode);
    
    return {
      roomId: roomCode.toLowerCase(),
      roomCode: roomCode.toUpperCase() // Display as uppercase
    };
  }

  // Join an existing room (guest)
  async joinRoom(roomCode) {
    const normalizedCode = roomCode.toLowerCase().trim();
    await this.initialize(this.playerName, normalizedCode);
    this.isHost = false; // Set isHost to false for guests
    
    console.log('✅ Joined room:', normalizedCode);
    
    return normalizedCode;
  }

  // Send a message to the room
  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('❌ Socket not connected');
    }
  }

  // Send game action
  sendGameAction(action, payload) {
    this.send({
      type: 'game-action',
      action,
      payload,
      playerName: this.playerName,
      playerId: this.playerId,
      timestamp: Date.now()
    });
  }

  // Send game start notification
  sendGameStart(players) {
    this.send({
      type: 'game-start',
      players,
      timestamp: Date.now()
    });
  }

  // Register callbacks
  on(event, callback) {
    this.callbacks[event] = callback;
  }

  // Get all connected players
  getConnectedPlayers() {
    return this.connectedPlayers;
  }

  // Leave room and cleanup
  leaveRoom() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.roomId = null;
    this.playerId = null;
    this.isHost = false;
    this.connectedPlayers = [];
    this.callbacks = {};
  }

  // Generate a random room ID
  generateRoomId() {
    return Math.random().toString(36).substring(2, 10);
  }

  // Generate a short 6-character room code
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Check if connected
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

export default new RoomService();
