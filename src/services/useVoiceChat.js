import { useEffect, useRef, useState, useCallback } from "react";
import roomService from "./roomService";

// ─── ICE / STUN configuration ──────────────────────────────────────────────
const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

/**
 * useVoiceChat
 *
 * Manages WebRTC peer-to-peer audio for all players in the current PartyKit room.
 *
 * Signaling flow:
 *   New player joins → existing players each send them a `voice-offer`
 *   New player receives offers → replies with `voice-answer`
 *   Both sides exchange `voice-ice` candidates
 *   RTCPeerConnection handles the audio stream directly (no media via server)
 *
 * @param {object} options
 * @param {boolean} options.enabled  - true only in online multiplayer mode
 * @param {string}  options.myId     - my PartyKit connection ID (roomService.playerId)
 */
export function useVoiceChat({ enabled, myId }) {
  // ── Public state ───────────────────────────────────────────────────────────
  const [status, setStatus] = useState("idle");     // idle | requesting | connecting | connected | error
  const [isMuted, setIsMuted] = useState(false);
  const [micError, setMicError] = useState(null);
  const [activePeers, setActivePeers] = useState({}); // peerId → { name, speaking }

  // ── Internal refs (do not cause re-render) ─────────────────────────────────
  const localStreamRef   = useRef(null);   // MediaStream from getUserMedia
  const peerConnsRef     = useRef({});     // peerId → RTCPeerConnection
  const iceCandidatesBuf = useRef({});     // peerId → ICE[] buffered before remoteDesc
  const audioElemsRef    = useRef({});     // peerId → HTMLAudioElement

  // Keep a stable ref to myId so closures always see the current value
  const myIdRef = useRef(myId);
  useEffect(() => { myIdRef.current = myId; }, [myId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Send a targeted signaling message to one specific peer via PartyKit */
  const sendSignal = useCallback((toPeerId, payload) => {
    roomService.send({ ...payload, to: toPeerId, from: myIdRef.current });
  }, []);

  /** Attach a remote audio track to an <audio> element and play it */
  const playRemoteStream = useCallback((peerId, stream) => {
    let audio = audioElemsRef.current[peerId];
    if (!audio) {
      audio = new Audio();
      audio.autoplay = true;
      audioElemsRef.current[peerId] = audio;
    }
    audio.srcObject = stream;
    audio.play().catch(() => {/* autoplay policy — user interaction needed */});
  }, []);

  /** Add local audio tracks to an RTCPeerConnection */
  const addLocalTracks = useCallback((pc) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  }, []);

  /** Drain any buffered ICE candidates that arrived before remote description */
  const drainIceCandidates = useCallback(async (pc, peerId) => {
    const buf = iceCandidatesBuf.current[peerId] || [];
    for (const candidate of buf) {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* ignore */ }
    }
    iceCandidatesBuf.current[peerId] = [];
  }, []);

  /** Create a new RTCPeerConnection wired up for signaling and audio */
  const createPeerConnection = useCallback((peerId) => {
    if (peerConnsRef.current[peerId]) return peerConnsRef.current[peerId];

    const pc = new RTCPeerConnection(ICE_CONFIG);
    peerConnsRef.current[peerId] = pc;
    iceCandidatesBuf.current[peerId] = [];

    // Relay our ICE candidates to the peer
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        sendSignal(peerId, { type: "voice-ice", candidate: candidate.toJSON() });
      }
    };

    // When connection state changes, update UI
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`🎤 Voice peer ${peerId} state:`, state);
      if (state === "connected") {
        setStatus("connected");
        setActivePeers((prev) => ({ ...prev, [peerId]: { ...(prev[peerId] || {}), connected: true } }));
      } else if (state === "disconnected" || state === "failed" || state === "closed") {
        setActivePeers((prev) => {
          const next = { ...prev };
          delete next[peerId];
          if (Object.keys(next).length === 0) setStatus("idle");
          return next;
        });
      }
    };

    // Play incoming audio from this peer
    pc.ontrack = ({ streams }) => {
      if (streams && streams[0]) playRemoteStream(peerId, streams[0]);
    };

    // Add our local audio tracks immediately
    addLocalTracks(pc);

    return pc;
  }, [sendSignal, playRemoteStream, addLocalTracks]);

  /** Tear down a single peer connection cleanly */
  const closePeer = useCallback((peerId) => {
    const pc = peerConnsRef.current[peerId];
    if (pc) { pc.close(); delete peerConnsRef.current[peerId]; }

    const audio = audioElemsRef.current[peerId];
    if (audio) { audio.srcObject = null; delete audioElemsRef.current[peerId]; }

    delete iceCandidatesBuf.current[peerId];
    setActivePeers((prev) => { const next = { ...prev }; delete next[peerId]; return next; });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Initiator side: create offer and send to newPeer
  // ─────────────────────────────────────────────────────────────────────────
  const initiateCallTo = useCallback(async (peerId, peerName) => {
    if (!localStreamRef.current) return;
    if (peerId === myIdRef.current) return;
    if (peerConnsRef.current[peerId]) return; // already connected

    console.log(`🎤 Initiating call to ${peerName} (${peerId})`);
    setStatus("connecting");
    setActivePeers((prev) => ({ ...prev, [peerId]: { name: peerName, connected: false } }));

    const pc = createPeerConnection(peerId);
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      sendSignal(peerId, {
        type: "voice-offer",
        offer: pc.localDescription.toJSON(),
        fromName: roomService.playerName,
      });
    } catch (err) {
      console.error("Failed to create offer:", err);
      closePeer(peerId);
    }
  }, [createPeerConnection, sendSignal, closePeer]);

  // ─────────────────────────────────────────────────────────────────────────
  // Signaling message handler (called from roomService.onMessage)
  // ─────────────────────────────────────────────────────────────────────────
  const handleSignal = useCallback(async (data) => {
    const { type, from, fromName } = data;
    if (!from || from === myIdRef.current) return;

    if (type === "voice-offer") {
      console.log(`🎤 Received offer from ${fromName} (${from})`);
      setStatus("connecting");
      setActivePeers((prev) => ({ ...prev, [from]: { name: fromName, connected: false } }));

      const pc = createPeerConnection(from);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        await drainIceCandidates(pc, from);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(from, {
          type: "voice-answer",
          answer: pc.localDescription.toJSON(),
          fromName: roomService.playerName,
        });
      } catch (err) {
        console.error("Failed to handle offer:", err);
        closePeer(from);
      }
      return;
    }

    if (type === "voice-answer") {
      console.log(`🎤 Received answer from ${fromName} (${from})`);
      const pc = peerConnsRef.current[from];
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        await drainIceCandidates(pc, from);
      } catch (err) {
        console.error("Failed to handle answer:", err);
      }
      return;
    }

    if (type === "voice-ice") {
      const pc = peerConnsRef.current[from];
      if (!pc) return;
      if (pc.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch { /* ignore */ }
      } else {
        // Buffer: remote desc not set yet
        iceCandidatesBuf.current[from] = [...(iceCandidatesBuf.current[from] || []), data.candidate];
      }
    }
  }, [createPeerConnection, sendSignal, closePeer, drainIceCandidates]);

  // ─────────────────────────────────────────────────────────────────────────
  // Bootstrap: get microphone, register roomService hooks
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function start() {
      setStatus("requesting");
      setMicError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = stream;
        setStatus("connecting");

        // Restore mute state if already muted
        stream.getAudioTracks().forEach((t) => { t.enabled = !isMuted; });

        // Call all players who are already in the room (they are the "existing" side,
        // but we also offer from our side to be safe — duplicate connection prevention
        // is handled in createPeerConnection() which returns early if peer exists)
        const others = roomService.getConnectedPlayers().filter(
          (p) => p.playerId && p.playerId !== myIdRef.current
        );
        others.forEach(({ playerId, playerName }) => initiateCallTo(playerId, playerName));

      } catch (err) {
        if (cancelled) return;
        console.error("Mic error:", err);
        const msg =
          err.name === "NotAllowedError"
            ? "Microphone permission denied. Voice chat unavailable."
            : err.name === "NotFoundError"
            ? "No microphone detected."
            : "Could not access microphone.";
        setMicError(msg);
        setStatus("error");
      }
    }

    start();

    // ── roomService callbacks ─────────────────────────────────────────────
    // Voice signaling arrives via the 'onMessage' default fallback
    const prevOnMessage = roomService.callbacks.onMessage;
    roomService.on("onMessage", (data) => {
      if (data.type && data.type.startsWith("voice-")) {
        handleSignal(data);
      } else if (prevOnMessage) {
        prevOnMessage(data);
      }
    });

    // When a new player joins — we initiate a call to them
    const prevOnPlayerJoined = roomService.callbacks.onPlayerJoined;
    roomService.on("onPlayerJoined", (data) => {
      if (localStreamRef.current && data.playerId && data.playerId !== myIdRef.current) {
        initiateCallTo(data.playerId, data.playerName || "Player");
      }
      if (prevOnPlayerJoined) prevOnPlayerJoined(data);
    });

    // When a player leaves — close their peer connection
    const prevOnPlayerLeft = roomService.callbacks.onPlayerLeft;
    roomService.on("onPlayerLeft", (data) => {
      if (data.playerId) closePeer(data.playerId);
      if (prevOnPlayerLeft) prevOnPlayerLeft(data);
    });

    return () => {
      cancelled = true;
      // Restore previous callbacks
      if (prevOnMessage !== undefined) roomService.callbacks.onMessage = prevOnMessage;
      else delete roomService.callbacks.onMessage;

      if (prevOnPlayerJoined !== undefined) roomService.callbacks.onPlayerJoined = prevOnPlayerJoined;
      else delete roomService.callbacks.onPlayerJoined;

      if (prevOnPlayerLeft !== undefined) roomService.callbacks.onPlayerLeft = prevOnPlayerLeft;
      else delete roomService.callbacks.onPlayerLeft;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ─────────────────────────────────────────────────────────────────────────
  // Tear down everything on unmount or when disabled
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Stop local mic
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      // Close all peer connections
      Object.keys(peerConnsRef.current).forEach(closePeer);
      setStatus("idle");
      setActivePeers({});
    };
  }, [closePeer]);

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle mute
  // ─────────────────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !nextMuted; });
      }
      return nextMuted;
    });
  }, []);

  return {
    status,       // 'idle' | 'requesting' | 'connecting' | 'connected' | 'error'
    isMuted,
    micError,
    activePeers,  // { [peerId]: { name, connected } }
    toggleMute,
  };
}
