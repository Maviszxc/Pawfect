export const checkNetworkConnectivity = async (): Promise<{
  hasWebRTC: boolean;
  hasSTUN: boolean;
  hasTURN: boolean;
  networkType: string;
}> => {
  const results = {
    hasWebRTC: !!(typeof window !== "undefined" && window.RTCPeerConnection),
    hasSTUN: false,
    hasTURN: false,
    networkType: "unknown",
  };

  // Check STUN connectivity
  try {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        results.hasSTUN = true;
      }
    };

    await pc.createOffer();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    pc.close();
  } catch (error) {
    console.error("STUN check failed:", error);
  }

  return results;
};
