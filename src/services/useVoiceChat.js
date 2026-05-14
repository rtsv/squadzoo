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
  /** Default muted on game start; player must click to unmute and send audio */
  const [isMuted, setIsMuted] = useState(true);
  const [micError, setMicError] = useState(null);
  const [activePeers, setActivePeers] = useState({}); // peerId → { name, speaking }

  // ── Internal refs (do not cause re-render) ─────────────────────────────────
  const localStreamRef   = useRef(null);   // MediaStream from getUserMedia
  const peerConnsRef     = useRef({});     // peerId → RTCPeerConnection
  const iceCandidatesBuf = useRef({});     // peerId → ICE[] buffered before remoteDesc
  const audioElemsRef    = useRef({});     // peerId → HTMLAudioElement
  const pendingSignalsRef = useRef([]);    // signals that arrived before mic ready

  // Keep a stable ref to myId so closures always see the current value
  const myIdRef = useRef(myId);
  useEffect(() => {
    myIdRef.current = roomService.playerId || myId;
  }, [myId]);

  // Keep a stable ref to isMuted so the mic-setup closure never goes stale
  const isMutedRef = useRef(true);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Send a targeted signaling message to one specific peer via PartyKit */
  const sendSignal = useCallback((toPeerId, payload) => {
    // roomService.playerId is the most reliable source because it's updated from
    // PartyKit connection events, while prop-driven myId may lag across rerenders.
    const fromPeerId = roomService.playerId || myIdRef.current;
    if (!fromPeerId) {
      console.warn("🎤 Skipping voice signal: missing sender id", payload?.type);
      return;
    }
    roomService.send({ ...payload, to: toPeerId, from: fromPeerId });
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
    const existingTrackIds = new Set(
      pc.getSenders().map((sender) => sender.track?.id).filter(Boolean)
    );
    stream.getTracks().forEach((track) => {
      if (!existingTrackIds.has(track.id)) pc.addTrack(track, stream);
    });
  }, []);

  /** Ensure all existing peers get local tracks once mic becomes ready */
  const attachLocalTracksToAllPeers = useCallback(() => {
    Object.values(peerConnsRef.current).forEach((pc) => addLocalTracks(pc));
  }, [addLocalTracks]);

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

  /** Flush deferred voice signals that arrived before mic permission resolved */
  const flushPendingSignals = useCallback(() => {
    if (!localStreamRef.current || pendingSignalsRef.current.length === 0) return;
    const queued = [...pendingSignalsRef.current];
    pendingSignalsRef.current = [];
    queued.forEach((msg) => {
      handleSignal(msg);
    });
  }, []);

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

    // If mic is not ready yet, queue offer/answer to avoid creating no-audio peers.
    // ICE is buffered separately and can be accepted later.
    if (!localStreamRef.current && (type === "voice-offer" || type === "voice-answer")) {
      pendingSignalsRef.current.push(data);
      return;
    }

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
      if (!pc) {
        // Keep ICE so it can be replayed when the peer connection is created.
        iceCandidatesBuf.current[from] = [...(iceCandidatesBuf.current[from] || []), data.candidate];
        return;
      }
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
      // Each online voice session starts muted until the player unmutes
      setIsMuted(true);
      isMutedRef.current = true;

      async function waitForLocalPlayerId(timeoutMs = 8000) {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
          const id = roomService.playerId || myIdRef.current;
          if (id) {
            myIdRef.current = id;
            return id;
          }
          await new Promise((r) => setTimeout(r, 40));
        }
        return roomService.playerId || myIdRef.current;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = stream;
        attachLocalTracksToAllPeers();
        setStatus("connecting");

        // Restore mute state if already muted (read from ref — closure is stable)
        stream.getAudioTracks().forEach((t) => { t.enabled = !isMutedRef.current; });

        await waitForLocalPlayerId();

        // Bootstrap calls to existing peers with deterministic initiator selection.
        // This prevents offer glare (both sides creating offers simultaneously).
        // Rule: lexicographically smaller peer id initiates.
        const others = roomService.getConnectedPlayers().filter(
          (p) => p.playerId && p.playerId !== myIdRef.current
        );
        const selfId = roomService.playerId || myIdRef.current;
        others.forEach(({ playerId, playerName }) => {
          if (!selfId || !playerId) return;
          if (selfId < playerId) {
            initiateCallTo(playerId, playerName);
          }
        });
        flushPendingSignals();

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
    // Voice signaling is now routed via onVoiceSignal — a dedicated path in
    // roomService that is NOT shared with game action callbacks. No chaining
    // or last-writer-wins collision possible.
    roomService.setVoiceChatHandlers({
      onSignal: handleSignal,
      onPlayerJoined: (data) => {
        if (localStreamRef.current && data.playerId && data.playerId !== myIdRef.current) {
          initiateCallTo(data.playerId, data.playerName || "Player");
        }
      },
      onPlayerLeft: (data) => {
        if (data.playerId) closePeer(data.playerId);
      },
    });

    return () => {
      cancelled = true;
      roomService.clearVoiceChatHandlers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, attachLocalTracksToAllPeers, initiateCallTo, flushPendingSignals, handleSignal, closePeer]);

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
      isMutedRef.current = nextMuted; // keep ref in sync for closures
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
