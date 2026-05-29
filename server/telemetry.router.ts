import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { gpsLocations, devices } from "../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";

export const telemetryRouter = router({
  // Record GPS location
  recordLocation: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        accuracy: z.number().optional(),
        speed: z.number().optional(),
        heading: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify device belongs to user's company
      const device = await db
        .select()
        .from(devices)
        .where(eq(devices.deviceId, input.deviceId))
        .limit(1);

      if (!device.length || device[0].tenantId !== ctx.user.tenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Device not found or access denied" });
      }

      // Record location
      await db.insert(gpsLocations).values({
        deviceId: device[0].id,
        tenantId: ctx.user.tenantId,
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString(),
        accuracy: input.accuracy ? input.accuracy.toString() : null,
        speed: input.speed ? input.speed.toString() : null,
        heading: input.heading ? input.heading.toString() : null,
        createdAt: new Date(),
      });

      return { success: true };
    }),

  // Get device current location
  getCurrentLocation: protectedProcedure
    .input(z.object({ deviceId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantId) return null;

      // Get device
      const device = await db
        .select()
        .from(devices)
        .where(eq(devices.deviceId, input.deviceId))
        .limit(1);

      if (!device.length || device[0].tenantId !== ctx.user.tenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Device not found or access denied" });
      }

      // Get latest location
      const locations = await db
        .select()
        .from(gpsLocations)
        .where(eq(gpsLocations.deviceId, device[0].id))
        .orderBy(gpsLocations.createdAt)
        .limit(1);

      if (!locations.length) return null;

      const loc = locations[0];
      return {
        deviceId: input.deviceId,
        latitude: parseFloat(loc.latitude),
        longitude: parseFloat(loc.longitude),
        accuracy: loc.accuracy ? parseFloat(loc.accuracy) : undefined,
        speed: loc.speed ? parseFloat(loc.speed) : undefined,
        heading: loc.heading ? parseFloat(loc.heading) : undefined,
        timestamp: loc.createdAt,
      };
    }),

  // Get location history for device
  getLocationHistory: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        hours: z.number().min(1).max(720).default(24),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantId) return [];

      // Get device
      const device = await db
        .select()
        .from(devices)
        .where(eq(devices.deviceId, input.deviceId))
        .limit(1);

      if (!device.length || device[0].tenantId !== ctx.user.tenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Device not found or access denied" });
      }

      // Get locations from last N hours
      const since = new Date(Date.now() - input.hours * 60 * 60 * 1000);

      const locations = await db
        .select()
        .from(gpsLocations)
        .where(and(eq(gpsLocations.deviceId, device[0].id), gte(gpsLocations.createdAt, since)))
        .orderBy(gpsLocations.createdAt);

      return locations.map((loc) => ({
        latitude: parseFloat(loc.latitude),
        longitude: parseFloat(loc.longitude),
        accuracy: loc.accuracy ? parseFloat(loc.accuracy) : undefined,
        speed: loc.speed ? parseFloat(loc.speed) : undefined,
        heading: loc.heading ? parseFloat(loc.heading) : undefined,
        timestamp: loc.createdAt,
      }));
    }),

  // Get all device locations (fleet view)
  getFleetLocations: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Get all devices for company
      const companyDevices = await db
        .select()
        .from(devices)
        .where(eq(devices.companyId, input.companyId));

      if (!companyDevices.length) return [];

      // Get latest location for each device
      const fleetLocations = await Promise.all(
        companyDevices.map(async (device) => {
          const locations = await db
            .select()
            .from(gpsLocations)
            .where(eq(gpsLocations.deviceId, device.id))
            .orderBy(gpsLocations.createdAt)
            .limit(1);

          if (!locations.length) return null;

          const loc = locations[0];
          return {
            deviceId: device.deviceId,
            deviceName: device.name,
            deviceType: device.deviceType,
            latitude: parseFloat(loc.latitude),
            longitude: parseFloat(loc.longitude),
            accuracy: loc.accuracy ? parseFloat(loc.accuracy) : undefined,
            speed: loc.speed ? parseFloat(loc.speed) : undefined,
            heading: loc.heading ? parseFloat(loc.heading) : undefined,
            timestamp: loc.createdAt,
          };
        })
      );

      return fleetLocations.filter((loc) => loc !== null);
    }),

  // Get device statistics
  getDeviceStats: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        hours: z.number().min(1).max(720).default(24),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantId) return null;

      // Get device
      const device = await db
        .select()
        .from(devices)
        .where(eq(devices.deviceId, input.deviceId))
        .limit(1);

      if (!device.length || device[0].tenantId !== ctx.user.tenantId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Device not found or access denied" });
      }

      // Get locations from last N hours
      const since = new Date(Date.now() - input.hours * 60 * 60 * 1000);

      const locations = await db
        .select()
        .from(gpsLocations)
        .where(and(eq(gpsLocations.deviceId, device[0].id), gte(gpsLocations.createdAt, since)));

      if (!locations.length) {
        return {
          deviceId: input.deviceId,
          recordCount: 0,
          averageSpeed: 0,
          maxSpeed: 0,
          lastUpdate: null,
        };
      }

      const speeds = locations
        .filter((loc) => loc.speed)
        .map((loc) => parseFloat(loc.speed!));

      return {
        deviceId: input.deviceId,
        recordCount: locations.length,
        averageSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
        maxSpeed: speeds.length > 0 ? Math.max(...speeds) : 0,
        lastUpdate: locations[locations.length - 1].createdAt,
      };
    }),
});
