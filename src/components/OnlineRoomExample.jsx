import { useState, useEffect } from "react";
import roomService from "../services/roomService";
import styles from "../styles/Button.module.css";

function OnlineRoomExample() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Setup event listeners
    roomService.on('onPlayerJoined', (data) => {
      console.log('Player joined:', data);
      setPlayers(roomService.getConnectedPlayers());
      setMessages(prev => [...prev, `${data.playerName} joined the room`]);
    });

    roomService.on('onPlayerLeft', (data) => {
      console.log('Player left:', data);
      setPlayers(roomService.getConnectedPlayers());
      setMessages(prev => [...prev, `Player left the room`]);
    });

    roomService.on('onGameAction', (data) => {
      console.log('Game action:', data);
      // Handle game-specific actions here
    });

    roomService.on('onChatMessage', (data) => {
      setMessages(prev => [...prev, `${data.playerName}: ${data.message}`]);
    });

    return () => {
      if (roomService.isConnected()) {
        roomService.leaveRoom();
      }
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }

    try {
      await roomService.initialize(playerName);
      const { roomCode: code } = await roomService.createRoom();
      setRoomCode(code);
      setIsHost(true);
      setIsInRoom(true);
      setPlayers(roomService.getConnectedPlayers());
      setMessages([`Room created! Share code: ${code}`]);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      alert("Please enter your name and room code");
      return;
    }

    try {
      await roomService.initialize(playerName);
      const hostPeerId = roomService.getRoomIdFromCode(roomCode);
      await roomService.joinRoom(hostPeerId);
      setIsInRoom(true);
      setPlayers(roomService.getConnectedPlayers());
      setMessages([`Joined room: ${roomCode}`]);
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room. Check the room code.');
    }
  };

  const handleLeaveRoom = () => {
    roomService.leaveRoom();
    setIsInRoom(false);
    setIsHost(false);
    setRoomCode("");
    setPlayers([]);
    setMessages([]);
  };

  const sendTestMessage = () => {
    roomService.sendChatMessage("Hello from " + playerName);
  };

  if (!isInRoom) {
    return (
      <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
        <h2>Online Multiplayer Room</h2>
        
        <div style={{ marginBottom: "20px" }}>
          <label>Your Name:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <button onClick={handleCreateRoom} className={styles.btn}>
            Create Room
          </button>
        </div>

        <div style={{ borderTop: "1px solid #ccc", paddingTop: "20px" }}>
          <label>Room Code:</label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Enter room code"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
          <button 
            onClick={handleJoinRoom} 
            className={styles.btn}
            style={{ marginTop: "10px" }}
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h2>Room: {roomCode} {isHost && "(Host)"}</h2>
        <button onClick={handleLeaveRoom} className={styles.btn}>
          Leave Room
        </button>
        <button onClick={sendTestMessage} className={styles.btn}>
          Send Test Message
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <h3>Players ({players.length})</h3>
          <ul>
            {players.map((player, idx) => (
              <li key={idx}>
                {player.playerName} {player.isHost && "👑"}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Messages</h3>
          <div style={{ 
            border: "1px solid #ccc", 
            padding: "10px", 
            height: "200px", 
            overflowY: "auto" 
          }}>
            {messages.map((msg, idx) => (
              <div key={idx}>{msg}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnlineRoomExample;
