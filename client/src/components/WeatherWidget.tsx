import { useEffect, useState } from "react";
import { Cloud, CloudRain, Wind, Droplets, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

interface WeatherWidgetProps {
  lat: number;
  lon: number;
  propertyName?: string;
}

export function WeatherWidget({ lat, lon, propertyName }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: weatherData } = trpc.weather.getCurrentWeather.useQuery({ lat, lon }, { enabled: !!lat && !!lon });
  const { data: alertsData } = trpc.weather.getComplianceAlerts.useQuery({ lat, lon }, { enabled: !!lat && !!lon });

  useEffect(() => {
    if (weatherData) {
      setWeather(weatherData);
      setLoading(false);
    }
  }, [weatherData]);

  useEffect(() => {
    if (alertsData) {
      setAlerts(alertsData.alerts);
    }
  }, [alertsData]);

  if (loading) {
    return <div className="text-center py-4">Loading weather...</div>;
  }

  if (!weather) {
    return <div className="text-center py-4">Unable to load weather data</div>;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Weather Conditions</span>
            {propertyName && <span className="text-sm font-normal text-muted-foreground">{propertyName}</span>}
          </CardTitle>
          <CardDescription>Current conditions and compliance alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Weather */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3 rounded">
              <p className="text-xs text-muted-foreground mb-1">Temperature</p>
              <p className="text-2xl font-bold">{Math.round(weather.temp)}°C</p>
              <p className="text-xs text-muted-foreground">Feels like {Math.round(weather.feelsLike)}°C</p>
            </div>

            <div className="bg-slate-50 p-3 rounded">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Droplets className="w-3 h-3" /> Humidity
              </p>
              <p className="text-2xl font-bold">{weather.humidity}%</p>
            </div>

            <div className="bg-slate-50 p-3 rounded">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Wind className="w-3 h-3" /> Wind
              </p>
              <p className="text-2xl font-bold">{Math.round(weather.windSpeed)} m/s</p>
            </div>

            <div className="bg-slate-50 p-3 rounded">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <CloudRain className="w-3 h-3" /> Rain
              </p>
              <p className="text-2xl font-bold">{weather.rain}mm</p>
            </div>
          </div>

          {/* Weather Description */}
          <div className="bg-blue-50 p-3 rounded flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium capitalize">{weather.description}</p>
              <p className="text-sm text-muted-foreground">Clouds: {weather.clouds}%</p>
            </div>
          </div>

          {/* Compliance Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                Compliance Alerts
              </h4>
              {alerts.map((alert, idx) => (
                <div key={idx} className={`p-3 rounded ${getSeverityColor(alert.severity)}`}>
                  <p className="font-medium text-sm">{alert.description}</p>
                  <p className="text-xs mt-1">{alert.recommendation}</p>
                </div>
              ))}
            </div>
          )}

          {alerts.length === 0 && (
            <div className="bg-green-50 p-3 rounded text-green-800 text-sm">
              ✓ Weather conditions are favorable for field operations
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
