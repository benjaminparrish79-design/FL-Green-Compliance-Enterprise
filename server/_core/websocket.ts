import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";

interface AuthenticatedSocket extends Socket {
  userId?: number;
  tenantId?: number;
}

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? undefined : "*",
      methods: ["GET", "POST"],
    },
  });

  // Middleware for authentication
  io.use(async (socket: AuthenticatedSocket, next: any) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      // In production, verify JWT token here
      // For now, we'll use a simple user ID from the token
      socket.userId = parseInt(socket.handshake.auth.userId || "0");
      socket.tenantId = parseInt(socket.handshake.auth.tenantId || "0");

      if (!socket.userId || !socket.tenantId) {
        return next(new Error("Invalid authentication"));
      }

      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`[WebSocket] User ${socket.userId} connected`);

    // Join tenant-specific room for multi-tenancy
    if (socket.tenantId) {
      socket.join(`tenant-${socket.tenantId}`);
      socket.join(`user-${socket.userId}`);
    }

    // GPS Location Update
    socket.on("gps:update", async (data: any) => {
      try {
        // Broadcast to all users in the same tenant
        io.to(`tenant-${socket.tenantId}`).emit("gps:updated", {
          userId: socket.userId,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          speed: data.speed,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[WebSocket] GPS update error:", error);
      }
    });

    // Work Order Status Update
    socket.on("workorder:statusChanged", async (data: any) => {
      try {
        io.to(`tenant-${socket.tenantId}`).emit("workorder:updated", {
          workOrderId: data.workOrderId,
          status: data.status,
          updatedBy: socket.userId,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[WebSocket] Work order update error:", error);
      }
    });

    // Notification Delivery
    socket.on("notification:subscribe", async (data: any) => {
      try {
        socket.join(`notifications-${data.userId}`);
        socket.emit("notification:subscribed", { success: true });
      } catch (error) {
        console.error("[WebSocket] Notification subscription error:", error);
      }
    });

    // Broadcast notification to specific user
    socket.on("notification:send", async (data: any) => {
      try {
        io.to(`notifications-${data.userId}`).emit("notification:received", {
          title: data.title,
          content: data.content,
          type: data.type,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[WebSocket] Notification send error:", error);
      }
    });

    // Compliance Alert
    socket.on("compliance:alert", async (data: any) => {
      try {
        io.to(`tenant-${socket.tenantId}`).emit("compliance:alertReceived", {
          propertyId: data.propertyId,
          severity: data.severity,
          message: data.message,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[WebSocket] Compliance alert error:", error);
      }
    });

    // Device Status Update
    socket.on("device:statusChanged", async (data: any) => {
      try {
        io.to(`tenant-${socket.tenantId}`).emit("device:updated", {
          deviceId: data.deviceId,
          status: data.status,
          battery: data.battery,
          lastSeen: new Date(),
        });
      } catch (error) {
        console.error("[WebSocket] Device status error:", error);
      }
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      console.log(`[WebSocket] User ${socket.userId} disconnected`);
    });

    // Error handler
    socket.on("error", (error: any) => {
      console.error(`[WebSocket] Error for user ${socket.userId}:`, error);
    });
  });

  return io;
}

// Helper function to broadcast to tenant
export function broadcastToTenant(io: SocketIOServer, tenantId: number, event: string, data: any) {
  io.to(`tenant-${tenantId}`).emit(event, data);
}

// Helper function to send notification to user
export function sendNotificationToUser(io: SocketIOServer, userId: number, notification: any) {
  io.to(`notifications-${userId}`).emit("notification:received", notification);
}

// Helper function to broadcast GPS update
export function broadcastGPSUpdate(io: SocketIOServer, tenantId: number, location: any) {
  io.to(`tenant-${tenantId}`).emit("gps:updated", location);
}

// Helper function to broadcast work order update
export function broadcastWorkOrderUpdate(io: SocketIOServer, tenantId: number, workOrder: any) {
  io.to(`tenant-${tenantId}`).emit("workorder:updated", workOrder);
}
