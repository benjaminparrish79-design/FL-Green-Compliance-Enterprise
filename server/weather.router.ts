import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getCurrentWeather,
  getWeatherForecast,
  analyzeWeatherForCompliance,
  canExecuteWorkOrder,
  findOptimalApplicationWindow,
} from "./weather.service";

export const weatherRouter = router({
  /**
   * Get current weather for a property location
   */
  getCurrentWeather: protectedProcedure
    .input(z.object({ lat: z.number(), lon: z.number() }))
    .query(async ({ input }) => {
      const weather = await getCurrentWeather(input.lat, input.lon);
      if (!weather) {
        throw new Error("Failed to fetch weather data");
      }
      return weather;
    }),

  /**
   * Get weather forecast for next 5 days
   */
  getWeatherForecast: protectedProcedure
    .input(z.object({ lat: z.number(), lon: z.number() }))
    .query(async ({ input }) => {
      const forecast = await getWeatherForecast(input.lat, input.lon);
      return forecast;
    }),

  /**
   * Analyze weather and get compliance alerts
   */
  getComplianceAlerts: protectedProcedure
    .input(z.object({ lat: z.number(), lon: z.number() }))
    .query(async ({ input }) => {
      const weather = await getCurrentWeather(input.lat, input.lon);
      if (!weather) {
        throw new Error("Failed to fetch weather data");
      }
      const alerts = analyzeWeatherForCompliance(weather);
      return { weather, alerts };
    }),

  /**
   * Check if weather conditions allow work order execution
   */
  canExecuteWorkOrder: protectedProcedure
    .input(z.object({ lat: z.number(), lon: z.number() }))
    .query(async ({ input }) => {
      const weather = await getCurrentWeather(input.lat, input.lon);
      if (!weather) {
        throw new Error("Failed to fetch weather data");
      }
      const result = canExecuteWorkOrder(weather);
      return { ...result, weather };
    }),

  /**
   * Find optimal application window based on weather forecast
   */
  findOptimalApplicationWindow: protectedProcedure
    .input(z.object({ lat: z.number(), lon: z.number() }))
    .query(async ({ input }) => {
      const forecast = await getWeatherForecast(input.lat, input.lon);
      if (!forecast || forecast.length === 0) {
        throw new Error("Failed to fetch weather forecast");
      }
      const window = findOptimalApplicationWindow(forecast);
      return { window, forecast };
    }),
});
