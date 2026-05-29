import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, MapPin, Zap } from "lucide-react";

export default function Fleet() {
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);

  const devices = [
    {
      id: 1,
      name: "Vehicle #001",
      type: "truck",
      status: "active",
      location: "Property #123",
      battery: 85,
      lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
      driver: "John Doe",
      maintenance: "good",
    },
    {
      id: 2,
      name: "Vehicle #002",
      type: "van",
      status: "active",
      location: "Property #456",
      battery: 45,
      lastUpdate: new Date(Date.now() - 15 * 60 * 1000),
      driver: "Jane Smith",
      maintenance: "warning",
    },
    {
      id: 3,
      name: "GPS Device #003",
      type: "gps",
      status: "offline",
      location: "Unknown",
      battery: 10,
      lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      driver: "N/A",
      maintenance: "critical",
    },
  ];

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
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">18 active, 6 offline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">75% utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Next: 5 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Battery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <p className="text-xs text-muted-foreground">Healthy</p>
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
                        <Badge className={getStatusColor(device.status)}>
                          {device.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{device.type.toUpperCase()}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {device.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className={`w-4 h-4 ${getBatteryColor(device.battery)}`} />
                          {device.battery}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{device.driver}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated {Math.round((Date.now() - device.lastUpdate.getTime()) / 60000)} min ago
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
