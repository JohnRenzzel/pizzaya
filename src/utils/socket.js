import { io } from "socket.io-client";

let socket;

export const initSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000");

    // Add event listeners only after socket is initialized
    socket.on("startCountdown", (data) => {
      const { orderId, remainingTime, status } = data;

      // Broadcast the countdown to all clients in the order room
      socket.emit("countdownUpdate", {
        orderId,
        remainingTime,
        status,
        startTime: Date.now(),
      });
    });

    socket.on("joinOrderRoom", (orderId) => {
      socket.join(orderId);
    });

    socket.on("leaveOrderRoom", (orderId) => {
      socket.leave(orderId);
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};
