import { useEffect, useRef, useState } from "react";

const WEBSOCKET_URL = "wss://paymentstest.gobbl.ai/ws";

export const useWebSocket = (orderId: string, onUpdate: (updatedOrder: any) => void) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; 
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (!orderId) {
      console.warn("No orderId provided, skipping WebSocket connection.");
      return;
    }

    const socket = new WebSocket(WEBSOCKET_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
      reconnectAttempts.current = 0;

      pingIntervalRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket Message Received:", data);

        if (data.type === "orderUpdated" && data.order?._id === orderId) {
          console.log("Updating Order:", data.order);
          onUpdate((prevOrder: any) => {
            if (JSON.stringify(prevOrder) !== JSON.stringify(data.order)) {
              return { ...data.order };
            }
            return prevOrder;
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
      socket.close();
    };

    socket.onclose = () => {
      console.warn("⚠️ WebSocket Disconnected. Attempting to reconnect...");
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      if (reconnectAttempts.current < maxReconnectAttempts) {
        setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, reconnectDelay);
      } else {
        console.error("Max reconnection attempts reached.");
      }
    };
  };

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [orderId]);

  return wsRef.current;
};
