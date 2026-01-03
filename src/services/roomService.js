import Peer from 'peerjs';

class RoomService {
  constructor() {
    this.peer = null;
    this.connections = new Map();
    this.roomId = null;
    this.isHost = false;
    this.playerName = '';
    this.callbacks = {};
    this.roomCodeMap = new Map(); // Map short codes to full peer IDs
  }

  // Initialize peer connection
  async initialize(playerName) {
    this.playerName = playerName;
    
    // Create a new peer with a random ID and improved configuration
    // Using the official PeerJS cloud server with aggressive connection settings
    this.peer = new Peer(undefined, {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
      config: {
        iceServers: [
          // Google STUN servers
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          // Free TURN servers for connection relay (helps with NAT traversal)
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ]
      },
      debug: 3 // Maximum logging for debugging
    });

    return new Promise((resolve, reject) => {
      let timeoutId;

      // Set a timeout for peer initialization
      timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout. Please check your internet connection and try again.'));
      }, 15000); // 15 second timeout

      this.peer.on('open', (id) => {
        clearTimeout(timeoutId);
        console.log('✅ Peer initialized with ID:', id);
        console.log('🔗 You can now create or join rooms');
        
        // Re-register connection listener after peer is fully open
        console.log('📡 Registering connection listener...');
        this.peer.on('connection', (conn) => {
          console.log('📞 Incoming connection from:', conn.peer);
          this.setupConnection(conn);
        });
        
        resolve(id);
      });

      this.peer.on('error', (error) => {
        clearTimeout(timeoutId);
        console.error('❌ Peer error:', error);
        
        // Provide more helpful error messages
        let errorMessage = 'Connection failed. ';
        if (error.type === 'peer-unavailable') {
          errorMessage += 'The room code is invalid or the host has left.';
        } else if (error.type === 'network') {
          errorMessage += 'Network error. Please check your internet connection.';
        } else if (error.type === 'server-error') {
          errorMessage += 'Server error. Please try again in a moment.';
        } else if (error.type === 'socket-error') {
          errorMessage += 'Connection to server failed. Please try again.';
        } else if (error.type === 'socket-closed') {
          errorMessage += 'Connection closed. Please try reconnecting.';
        } else {
          errorMessage += error.message || 'An unknown error occurred.';
        }
        
        // Call error callback if set
        if (this.callbacks.onError) {
          this.callbacks.onError(errorMessage);
        }
        
        reject(new Error(errorMessage));
      });

      this.peer.on('disconnected', () => {
        console.log('⚠️ Peer disconnected, attempting to reconnect...');
        // Attempt to reconnect
        if (this.peer && !this.peer.destroyed) {
          this.peer.reconnect();
        }
      });

      // Initial connection listener (will be re-registered after 'open')
      this.peer.on('connection', (conn) => {
        console.log('📞 Incoming connection from:', conn.peer);
        this.setupConnection(conn);
      });
    });
  }

  // Create a new room (host)
  async createRoom() {
    if (!this.peer) {
      throw new Error('Peer not initialized');
    }
    
    if (!this.peer.open) {
      console.warn('⚠️ Peer is not fully open yet, waiting...');
      // Wait a bit for the peer to fully open
      await new Promise(resolve => {
        if (this.peer.open) {
          resolve();
        } else {
          const checkOpen = setInterval(() => {
            if (this.peer.open) {
              clearInterval(checkOpen);
              resolve();
            }
          }, 100);
          
          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkOpen);
            resolve();
          }, 5000);
        }
      });
    }
    
    this.isHost = true;
    this.roomId = this.peer.id;
    
    console.log('🏠 Room created with ID:', this.roomId);
    console.log('👂 Host is now listening for connections...');
    
    // Use the full peer ID as the room code (it's the only way to connect in P2P)
    // Format it nicely for display
    const roomCode = this.roomId.toUpperCase();
    
    return {
      roomId: this.roomId,
      roomCode: roomCode
    };
  }

  // Join an existing room (guest)
  async joinRoom(hostPeerId) {
    if (!this.peer) {
      throw new Error('Peer not initialized');
    }

    console.log('🔍 Attempting to join room with peer ID:', hostPeerId);
    console.log('🔍 My peer ID:', this.peer.id);
    console.log('🔍 Peer connection state:', this.peer.disconnected ? 'disconnected' : 'connected');
    
    this.isHost = false;
    this.roomId = hostPeerId;

    return new Promise((resolve, reject) => {
      let timeoutId;
      let connectionAttempted = false;

      // Set a timeout for connection  
      timeoutId = setTimeout(() => {
        console.error('❌ Connection timeout after 15 seconds');
        console.log('Debug info:', {
          hostPeerId,
          myPeerId: this.peer?.id,
          peerOpen: this.peer?.open,
          connectionAttempted
        });
        reject(new Error('Connection timeout. The host may not be available or has closed the room.'));
      }, 15000);

      console.log('📡 Creating connection to host:', hostPeerId);
      const conn = this.peer.connect(hostPeerId, {
        reliable: true,
        metadata: { playerName: this.playerName },
        serialization: 'json'
      });

      connectionAttempted = true;

      if (!conn) {
        clearTimeout(timeoutId);
        console.error('❌ Failed to create connection object');
        reject(new Error('Failed to create connection object'));
        return;
      }

      console.log('📋 Connection object created, waiting for "open" event...');

      conn.on('open', () => {
        clearTimeout(timeoutId);
        console.log('✅ Connection OPENED! Sending join message...');
        this.setupConnection(conn);
        // Send join message
        this.sendToConnection(conn, {
          type: 'player-joined',
          playerName: this.playerName,
          peerId: this.peer.id
        });
        console.log('✅ Join message sent successfully');
        resolve(conn);
      });

      conn.on('error', (error) => {
        clearTimeout(timeoutId);
        console.error('❌ Connection error:', error);
        let errorMessage = 'Failed to join room. ';
        
        if (error.type === 'peer-unavailable') {
          errorMessage += 'The host is not online or the room code is incorrect.';
        } else if (error.type === 'network') {
          errorMessage += 'Network error. Check your internet connection.';
        } else if (error.type === 'disconnected') {
          errorMessage += 'Connection was disconnected.';
        } else {
          errorMessage += 'Please verify the room code and make sure the host is in the waiting room.';
        }
        
        if (this.callbacks.onError) {
          this.callbacks.onError(errorMessage);
        }
        reject(new Error(errorMessage));
      });

      conn.on('close', () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          console.error('❌ Connection closed before opening');
          reject(new Error('Connection closed by host or network issue.'));
        }
      });

      // Log connection state changes
      conn.peerConnection?.addEventListener('iceconnectionstatechange', () => {
        console.log('🧊 ICE connection state:', conn.peerConnection?.iceConnectionState);
      });

      conn.peerConnection?.addEventListener('connectionstatechange', () => {
        console.log('🔗 Connection state:', conn.peerConnection?.connectionState);
      });
    });
  }

  // Setup connection event handlers
  setupConnection(conn) {
    console.log('🔧 Setting up connection with:', conn.peer);
    this.connections.set(conn.peer, conn);

    // Ensure connection is ready before setting up listeners
    if (conn.open) {
      console.log('✅ Connection already open');
      // Connection is already open, notify immediately
      if (this.isHost && this.callbacks.onPlayerJoined) {
        this.callbacks.onPlayerJoined({
          playerName: conn.metadata?.playerName,
          peerId: conn.peer
        });
      }
    }

    // Listen for when connection opens
    conn.on('open', () => {
      console.log('🎉 Data channel opened with:', conn.peer);
      // Notify that player joined when connection opens
      if (this.isHost && this.callbacks.onPlayerJoined) {
        this.callbacks.onPlayerJoined({
          playerName: conn.metadata?.playerName,
          peerId: conn.peer
        });
      }
    });

    conn.on('data', (data) => {
      this.handleMessage(data, conn);
    });

    conn.on('close', () => {
      console.log('Connection closed with:', conn.peer);
      this.connections.delete(conn.peer);
      if (this.callbacks.onPlayerLeft) {
        this.callbacks.onPlayerLeft({ peerId: conn.peer });
      }
    });

    conn.on('error', (error) => {
      console.error('Connection error with', conn.peer, ':', error);
      // Don't remove connection immediately, it might recover
      if (this.callbacks.onError) {
        this.callbacks.onError('Connection issue with opponent. They may have connection problems.');
      }
    });
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

  // Generate a short room code from peer ID (not used anymore)
  generateRoomCode(peerId) {
    // Just return the peer ID formatted nicely
    return peerId.toUpperCase();
  }

  // Convert room code to peer ID
  getRoomIdFromCode(code) {
    // Simply convert back to lowercase (PeerJS IDs are lowercase)
    return code.toLowerCase().trim();
  }

  // Check if connected
  isConnected() {
    return this.peer && !this.peer.destroyed && !this.peer.disconnected;
  }

  // Get connection status
  getConnectionStatus() {
    if (!this.peer) return 'not-initialized';
    if (this.peer.destroyed) return 'destroyed';
    if (this.peer.disconnected) return 'disconnected';
    return 'connected';
  }
}

export default new RoomService();
