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
        console.log('👤 Room status - Players:', data.playerCount, 'IsHost:', data.isHost);
        
        // Update host status from server
        if (data.isHost !== undefined) {
          this.isHost = data.isHost;
        }
        
        // Add self to connected players
        this.connectedPlayers.push({
          playerId: this.playerId,
          playerName: this.playerName,
          isHost: this.isHost
        });
        break;

      case 'error':
        console.error('❌ Server error:', data.message);
        if (this.callbacks.onError) {
          this.callbacks.onError(data.message);
        }
        break;

      case 'host-left':
        console.log('👑 Host has left the room');
        if (this.callbacks.onError) {
          this.callbacks.onError('Host has left the room. Game ended.');
        }
        if (this.callbacks.onPlayerLeft) {
          this.callbacks.onPlayerLeft({ isHost: true });
        }
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
    const maxRetries = 5;
    let attempts = 0;
    
    while (attempts < maxRetries) {
      const roomCode = this.generateRoomCode();
      const normalizedCode = roomCode.toLowerCase();
      
      try {
        // Try to connect to the room
        await this.initialize(this.playerName, normalizedCode);
        this.isHost = true;
        
        console.log('🏠 Room created with code:', roomCode, `(attempt ${attempts + 1})`);
        
        return {
          roomId: normalizedCode,
          roomCode: roomCode.toUpperCase()
        };
      } catch (error) {
        attempts++;
        console.warn(`Room code collision detected, retrying... (${attempts}/${maxRetries})`);
        
        if (attempts >= maxRetries) {
          throw new Error('Failed to create room after multiple attempts. Please try again.');
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // Join an existing room (guest)
  async joinRoom(roomCode) {
    const normalizedCode = roomCode.toLowerCase().trim();
    
    // Validate room code format
    if (normalizedCode.length < 6) {
      throw new Error('Invalid room code. Please check and try again.');
    }
    
    await this.initialize(this.playerName, normalizedCode);
    this.isHost = false;
    
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

  // Generate a short 8-character room code (increased from 6 for better distribution)
  // With 8 characters: 36^8 = ~2.8 trillion possible codes
  // Collision probability with 1M active rooms: ~0.00004% (negligible)
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
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
