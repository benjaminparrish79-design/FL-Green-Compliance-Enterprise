import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, MapPin, Zap, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Fleet() {
  const { user } = useAuth();
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);

  // Fetch real device data
  const devicesQuery = trpc.devices.list.useQuery(undefined, {
    enabled: !!user?.companyId,
  });

  const locationsQuery = trpc.telemetry.getFleetLocations.useQuery(
    { companyId: user?.companyId || 0 },
    { enabled: !!user?.companyId }
  );

  const devices = devicesQuery.data || [];
  const locations = locationsQuery.data || [];

  const getDeviceLocation = (deviceId: number) => {
    return locations.find((loc: any) => loc.deviceId === deviceId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "offline":
        return "bg-red-100 text-red-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 60) return "text-green-600";
    if (battery > 30) return "text-yellow-600";
    return "text-red-600";
  };

  if (devicesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const activeDevices = devices.filter((d) => d.status === "active").length;
  const maintenanceDevices = devices.filter((d) => d.status === "maintenance").length;
  const avgBattery = 0; // Battery data from telemetry service

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fleet Management</h1>
          <p className="text-muted-foreground">Monitor and manage your fleet vehicles and devices</p>
        </div>
        <Button>Add Device</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-xs text-muted-foreground">{activeDevices} active, {devices.length - activeDevices} offline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDevices}</div>
            <p className="text-xs text-muted-foreground">{devices.length > 0 ? Math.round((activeDevices / devices.length) * 100) : 0}% utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceDevices}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Battery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgBattery}%</div>
            <p className="text-xs text-muted-foreground">{avgBattery > 60 ? "Healthy" : avgBattery > 30 ? "Warning" : "Critical"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="map">Live Map</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <div className="space-y-2">
            {devices.map((device) => (
              <Card
                key={device.id}
                className="cursor-pointer hover:bg-accent"
                onClick={() => setSelectedDevice(device.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{device.name}</h3>
                        <Badge className={getStatusColor(device.status || "inactive")}>
                          {device.status || "inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{(device.deviceType || "equipment").toUpperCase()}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {getDeviceLocation(device.id) ? `${getDeviceLocation(device.id)?.latitude.toFixed(4)}, ${getDeviceLocation(device.id)?.longitude.toFixed(4)}` : "Unknown"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className={`w-4 h-4 ${getBatteryColor(0)}`} />
                          N/A
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{device.deviceId || "Unassigned"}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated {device.updatedAt ? Math.round((Date.now() - new Date(device.updatedAt).getTime()) / 60000) : "?"} min ago
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Live Fleet Map</CardTitle>
              <CardDescription>Real-time device locations and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 bg-gray-100 rounded flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Map component would be integrated here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
              <CardDescription>Track device maintenance and repairs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { device: "Vehicle #002", type: "Oil Change", dueDate: "2026-06-15", status: "pending" },
                { device: "Vehicle #003", type: "Tire Rotation", dueDate: "2026-06-20", status: "pending" },
                { device: "GPS Device #001", type: "Battery Replacement", dueDate: "2026-07-01", status: "scheduled" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{item.device}</p>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{item.dueDate}</p>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Location History</CardTitle>
              <CardDescription>Track device movement and activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { time: "10:30 AM", location: "Property #123", action: "Arrived" },
                  { time: "10:15 AM", location: "Route 5", action: "In Transit" },
                  { time: "09:45 AM", location: "Property #456", action: "Departed" },
                  { time: "09:00 AM", location: "Property #456", action: "Arrived" },
                ].map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{entry.location}</p>
                      <p className="text-sm text-muted-foreground">{entry.action}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
