import Peer from 'peerjs';

class RoomService {
  constructor() {
    this.peer = null;
    this.connections = new Map();
    this.roomId = null;
    this.isHost = false;
    this.playerName = '';
    this.callbacks = {};
    this.connectionHandlerRegistered = false;
  }

  // Initialize peer connection
  async initialize(playerName) {
    this.playerName = playerName;
    
    // Destroy existing peer if any
    if (this.peer) {
      this.peer.destroy();
    }
    
    // Create a new peer with improved configuration
    this.peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ]
      },
      debug: 2
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Peer initialization timeout. Please refresh and try again.'));
      }, 15000);

      this.peer.on('open', (id) => {
        clearTimeout(timeout);
        console.log('✅ Peer ID:', id);
        
        // Register connection handler immediately
        if (!this.connectionHandlerRegistered) {
          this.peer.on('connection', (conn) => {
            console.log('📞 INCOMING CONNECTION from:', conn.peer);
            console.log('Connection metadata:', conn.metadata);
            
            // Wait for connection to open before setting up
            conn.on('open', () => {
              console.log('✅ Incoming connection OPENED');
              this.setupConnection(conn);
            });
          });
          this.connectionHandlerRegistered = true;
        }
        
        resolve(id);
      });

      this.peer.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Peer error:', error);
        
        let errorMessage = 'Connection failed: ';
        if (error.type === 'peer-unavailable') {
          errorMessage += 'Room code is invalid or host left.';
        } else if (error.type === 'network') {
          errorMessage += 'Network error. Check your connection.';
        } else {
          errorMessage += error.message || 'Unknown error';
        }
        
        if (this.callbacks.onError) {
          this.callbacks.onError(errorMessage);
        }
        
        reject(new Error(errorMessage));
      });

      this.peer.on('disconnected', () => {
        console.warn('⚠️ Peer disconnected');
      });
    });
  }

  // Create a new room (host)
  async createRoom() {
    if (!this.peer || !this.peer.open) {
      throw new Error('Peer not ready. Please try again.');
    }
    
    this.isHost = true;
    this.roomId = this.peer.id;
    
    console.log('🏠 Room ID:', this.roomId);
    console.log('👂 Listening for connections...');
    
    return {
      roomId: this.roomId,
      roomCode: this.roomId.toUpperCase()
    };
  }

  // Join an existing room (guest)
  async joinRoom(hostPeerId) {
    if (!this.peer || !this.peer.open) {
      throw new Error('Peer not ready. Please try again.');
    }

    console.log('🔍 Joining room:', hostPeerId);
    
    this.isHost = false;
    this.roomId = hostPeerId;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('❌ Join timeout');
        reject(new Error('Connection timeout. Make sure the host is waiting in the room.'));
      }, 20000); // Increased to 20 seconds

      console.log('📡 Connecting to host...');
      
      const conn = this.peer.connect(hostPeerId, {
        reliable: true,
        metadata: { playerName: this.playerName }
      });

      if (!conn) {
        clearTimeout(timeout);
        reject(new Error('Failed to create connection'));
        return;
      }

      // Track connection state
      let opened = false;
      
      conn.on('open', () => {
        if (opened) return;
        opened = true;
        
        clearTimeout(timeout);
        console.log('✅ Connected to host!');
        
        this.setupConnection(conn);
        
        // Send join message
        conn.send({
          type: 'player-joined',
          playerName: this.playerName,
          peerId: this.peer.id
        });
        
        resolve(conn);
      });

      conn.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Connection error:', error);
        reject(new Error('Failed to connect. Please check the room code.'));
      });

      // Monitor ICE connection state
      if (conn.peerConnection) {
        conn.peerConnection.oniceconnectionstatechange = () => {
          const state = conn.peerConnection.iceConnectionState;
          console.log('🧊 ICE state:', state);
          
          if (state === 'failed' || state === 'disconnected') {
            if (!opened) {
              clearTimeout(timeout);
              reject(new Error('Connection failed. Network issue or invalid room code.'));
            }
          }
        };
      }
    });
  }

  // Setup connection event handlers
  setupConnection(conn) {
    console.log('🔧 Setup connection:', conn.peer);
    this.connections.set(conn.peer, conn);

    conn.on('data', (data) => {
      console.log('📨 Received:', data);
      this.handleMessage(data, conn);
    });

    conn.on('close', () => {
      console.log('🔌 Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      if (this.callbacks.onPlayerLeft) {
        this.callbacks.onPlayerLeft({ peerId: conn.peer });
      }
    });

    conn.on('error', (error) => {
      console.error('❌ Connection error:', error);
    });

    // Notify host that player joined
    if (this.isHost && this.callbacks.onPlayerJoined) {
      this.callbacks.onPlayerJoined({
        playerName: conn.metadata?.playerName || 'Guest',
        peerId: conn.peer
      });
    }
  }

  // Handle incoming messages
  handleMessage(data, conn) {
    // ...existing code...
    switch (data.type) {
      case 'player-joined':
        if (this.callbacks.onPlayerJoined) {
          this.callbacks.onPlayerJoined(data);
        }
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

  // Send message to all players
  sendToRoom(data) {
    if (this.isHost) {
      this.broadcast(data);
    } else {
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

  // Send game state
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
    this.connectionHandlerRegistered = false;
  }

  // Convert room code to peer ID
  getRoomIdFromCode(code) {
    return code.toLowerCase().trim();
  }

  // Check if connected
  isConnected() {
    return this.peer && !this.peer.destroyed && this.peer.open;
  }
}

export default new RoomService();
