"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getIceServers } from "@/utils/meteredConfig";

export const NetworkStatus = () => {
  const [networkInfo, setNetworkInfo] = useState({
    hasWebRTC: false,
    hasSTUN: false,
    hasTURN: false,
    connectionType: "unknown",
    iceServers: 0,
    turnStatus: "checking",
  });

  const [iceCandidates, setIceCandidates] = useState<any[]>([]);

  useEffect(() => {
    // Check WebRTC support
    setNetworkInfo((prev) => ({
      ...prev,
      hasWebRTC: !!(window.RTCPeerConnection || window.RTCPeerConnection),
      iceServers: getIceServers().length,
    }));

    // Test STUN/TURN connectivity
    const testConnectivity = async () => {
      try {
        const pc = new RTCPeerConnection({
          iceServers: getIceServers(),
        });

        const candidates: any[] = [];

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            const candidateInfo = {
              type: e.candidate.type,
              protocol: e.candidate.protocol,
              address: e.candidate.address,
              port: e.candidate.port,
              timestamp: new Date().toLocaleTimeString(),
            };

            candidates.push(candidateInfo);
            setIceCandidates([...candidates]);

            if (e.candidate.type === "srflx") {
              setNetworkInfo((prev) => ({ ...prev, hasSTUN: true }));
            }
            if (e.candidate.type === "relay") {
              setNetworkInfo((prev) => ({
                ...prev,
                hasTURN: true,
                turnStatus: "connected",
              }));
            }
          }
        };

        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === "complete") {
            console.log("ICE gathering complete", candidates);
            pc.close();
          }
        };

        await pc.createOffer();
        await pc.setLocalDescription(await pc.createOffer());

        // Timeout after 10 seconds
        setTimeout(() => {
          if (pc.iceGatheringState !== "complete") {
            console.log("ICE gathering timeout");
            pc.close();
          }
        }, 10000);
      } catch (error) {
        console.error("Connectivity test failed:", error);
        setNetworkInfo((prev) => ({ ...prev, turnStatus: "failed" }));
      }
    };

    testConnectivity();

    // Check connection type
    const connection = (navigator as any).connection;
    if (connection) {
      setNetworkInfo((prev) => ({
        ...prev,
        connectionType: connection.effectiveType || "unknown",
      }));

      connection.addEventListener("change", () => {
        setNetworkInfo((prev) => ({
          ...prev,
          connectionType: connection.effectiveType || "unknown",
        }));
      });
    }
  }, []);

  const getStatusColor = (status: boolean) => {
    return status ? "text-green-600" : "text-red-600";
  };

  const getStatusIcon = (status: boolean) => {
    return status ? "✅" : "❌";
  };

  return (
    <Card className="w-full mb-6 border-2 border-blue-200">
      <CardContent className="p-4">
        <h3 className="font-bold mb-3 text-lg text-blue-800">
          Metered.ca Network Status
        </h3>

        {/* Basic Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div
            className={`p-3 rounded-lg ${
              networkInfo.hasWebRTC
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="font-semibold">WebRTC</div>
            <div className={getStatusColor(networkInfo.hasWebRTC)}>
              {getStatusIcon(networkInfo.hasWebRTC)}{" "}
              {networkInfo.hasWebRTC ? "Supported" : "Not Supported"}
            </div>
          </div>

          <div
            className={`p-3 rounded-lg ${
              networkInfo.hasSTUN
                ? "bg-green-50 border border-green-200"
                : "bg-yellow-50 border border-yellow-200"
            }`}
          >
            <div className="font-semibold">STUN</div>
            <div
              className={
                networkInfo.hasSTUN ? "text-green-600" : "text-yellow-600"
              }
            >
              {networkInfo.hasSTUN ? "✅ Working" : "🟡 Testing"}
            </div>
          </div>

          <div
            className={`p-3 rounded-lg ${
              networkInfo.hasTURN
                ? "bg-green-50 border border-green-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            <div className="font-semibold">TURN</div>
            <div
              className={
                networkInfo.hasTURN ? "text-green-600" : "text-blue-600"
              }
            >
              {networkInfo.hasTURN ? "✅ Connected" : "🔵 Available"}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="font-semibold">Connection</div>
            <div className="text-gray-700">{networkInfo.connectionType}</div>
          </div>
        </div>

        {/* ICE Servers Info */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="font-semibold text-blue-800">
            Metered.ca Configuration
          </div>
          <div className="text-sm text-blue-600">
            ✅ Servers: {networkInfo.iceServers} configured • Status:{" "}
            <span className="font-semibold">{networkInfo.turnStatus}</span>
          </div>
        </div>

        {/* ICE Candidates */}
        {iceCandidates.length > 0 && (
          <div className="mt-4">
            <div className="font-semibold mb-2">ICE Candidates Found:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {iceCandidates.map((candidate, index) => (
                <div
                  key={index}
                  className="text-xs p-2 bg-gray-50 rounded border"
                >
                  <span
                    className={`font-semibold ${
                      candidate.type === "relay"
                        ? "text-green-600"
                        : candidate.type === "srflx"
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}
                  >
                    {candidate.type.toUpperCase()}
                  </span>
                  {candidate.type === "relay" && " 🔄"}
                  {candidate.type === "srflx" && " 🌐"}
                  {candidate.type === "host" && " 💻"}: {candidate.protocol} •{" "}
                  {candidate.address}:{candidate.port}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        {!networkInfo.hasTURN && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p className="text-yellow-700">
              💡 <strong>TIP:</strong> TURN servers help with cross-network
              connections. If users can't connect across different WiFi/mobile
              data, TURN should establish the connection.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
