// Simple signaling implementation using localStorage as a mock
// In production, replace with WebSocket server

export const signaling = {
  // Store offers, answers, and ICE candidates
  store: {
    offers: new Map<string, any>(),
    answers: new Map<string, any>(),
    iceCandidates: new Map<string, any[]>(),
  },

  // Send an offer
  sendOffer(offer: any, roomId: string) {
    this.store.offers.set(roomId, offer);
    // Simulate network delay
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("offerReceived", {
            detail: { offer, roomId },
          })
        );
      }
    }, 100);
  },

  // Send an answer
  sendAnswer(answer: any, roomId: string) {
    this.store.answers.set(roomId, answer);
    // Simulate network delay
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("answerReceived", {
            detail: { answer, roomId },
          })
        );
      }
    }, 100);
  },

  // Send ICE candidate
  sendICECandidate(candidate: any, roomId: string) {
    if (!this.store.iceCandidates.has(roomId)) {
      this.store.iceCandidates.set(roomId, []);
    }
    this.store.iceCandidates.get(roomId)!.push(candidate);
    // Simulate network delay
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("iceCandidateReceived", {
            detail: { candidate, roomId },
          })
        );
      }
    }, 100);
  },

  // Get offer
  getOffer(roomId: string) {
    return this.store.offers.get(roomId);
  },

  // Get answer
  getAnswer(roomId: string) {
    return this.store.answers.get(roomId);
  },

  // Get ICE candidates
  getICECandidates(roomId: string) {
    return this.store.iceCandidates.get(roomId) || [];
  },

  // Clear all data for a room
  clearRoom(roomId: string) {
    this.store.offers.delete(roomId);
    this.store.answers.delete(roomId);
    this.store.iceCandidates.delete(roomId);
  },
};
