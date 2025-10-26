// utils/meteredConfig.ts

// Your Metered.ca credentials
const METERED_CONFIG = {
  domain: "global.relay.metered.ca",
  username: "ff91cd3466b0a54f7b5dea9a",
  password: "ojnd8jLjCy5pBpSo",
  apiKey: "07192b107470bb659cf6964159adb70dd1f9",
};

export const getIceServers = () => {
  return [
    // STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },

    // Metered.ca STUN
     {
        urls: "stun:stun.relay.metered.ca:80",
      },
      {
        urls: "turn:global.relay.metered.ca:80",
        username: "ff91cd3466b0a54f7b5dea9a",
        credential: "ojnd8jLjCy5pBpSo",
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: "ff91cd3466b0a54f7b5dea9a",
        credential: "ojnd8jLjCy5pBpSo",
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username: "ff91cd3466b0a54f7b5dea9a",
        credential: "ojnd8jLjCy5pBpSo",
      },
      {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: "ff91cd3466b0a54f7b5dea9a",
        credential: "ojnd8jLjCy5pBpSo",
      },
  ];
};

// Advanced configuration for better connectivity
export const pcConfig = {
  iceServers: getIceServers(),
  iceCandidatePoolSize: 10,
  iceTransportPolicy: "all", // Use both relay and host candidates
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};

// Dynamic TURN server fetching (optional - for production)
export const fetchTurnServers = async (): Promise<RTCIceServer[]> => {
  try {
    const response = await fetch(
      `https://biyaya.metered.live/api/v1/turn/credentials?apiKey=${METERED_CONFIG.apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch TURN servers: ${response.status}`);
    }

    const iceServers = await response.json();
    console.log("Fetched TURN servers dynamically:", iceServers);
    return iceServers;
  } catch (error) {
    console.error("Error fetching TURN servers, using fallback:", error);
    // Fallback to static configuration
    return getIceServers();
  }
};
