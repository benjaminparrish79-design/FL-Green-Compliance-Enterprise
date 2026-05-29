import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, MapPin, FileText, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Queries
  const companiesQuery = trpc.companies.list.useQuery(undefined, { enabled: !!user?.tenantId });
  const propertiesQuery = trpc.properties.list.useQuery(undefined, { enabled: !!user?.companyId });
  const workOrdersQuery = trpc.workorder.list.useQuery({ companyId: user?.companyId || 0 }, { enabled: !!user?.companyId });
  const devicesQuery = trpc.telemetry.getFleetLocations.useQuery({ companyId: user?.companyId || 0 }, { enabled: !!user?.companyId });
  const complianceScoreQuery = trpc.compliance.getComplianceScore.useQuery(
    { companyId: user?.companyId || 0 },
    { enabled: !!user?.companyId, retry: false }
  );
  const violationsQuery = trpc.compliance.getViolations.useQuery(
    { companyId: user?.companyId || 0 },
    { enabled: !!user?.companyId }
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Compliance Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            </CardHeader>
            <CardContent>
              {complianceScoreQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{complianceScoreQuery.data?.score || 0}</span>
                  <Badge variant={complianceScoreQuery.data?.status === "COMPLIANT" ? "default" : "destructive"}>
                    {complianceScoreQuery.data?.status}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Work Orders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {workOrdersQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{workOrdersQuery.data?.length || 0}</span>
                  <span className="text-xs text-muted-foreground">active</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Properties */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {propertiesQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{propertiesQuery.data?.length || 0}</span>
                  <span className="text-xs text-muted-foreground">managed</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Devices */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Devices</CardTitle>
            </CardHeader>
            <CardContent>
              {devicesQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{devicesQuery.data?.length || 0}</span>
                  <span className="text-xs text-muted-foreground">tracked</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="workorders">Work Orders</TabsTrigger>
            <TabsTrigger value="fleet">Fleet</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Recent Violations */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Violations</CardTitle>
                  <CardDescription>Latest compliance issues</CardDescription>
                </CardHeader>
                <CardContent>
                  {violationsQuery.isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : violationsQuery.data?.length ? (
                    <div className="space-y-3">
                      {violationsQuery.data.slice(0, 5).map((violation: any) => (
                        <div key={violation.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                          <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                            violation.severity === "CRITICAL" ? "text-red-500" :
                            violation.severity === "HIGH" ? "text-orange-500" :
                            violation.severity === "MEDIUM" ? "text-yellow-500" :
                            "text-blue-500"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{violation.violationId}</p>
                            <p className="text-xs text-muted-foreground">{violation.status}</p>
                          </div>
                          <Badge variant="outline">{violation.severity}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No violations</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    New Work Order
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MapPin className="h-4 w-4 mr-2" />
                    View Fleet
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Check Compliance
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>Current compliance metrics and violations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Score</span>
                    <span className="text-2xl font-bold">{complianceScoreQuery.data?.score || 0}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${complianceScoreQuery.data?.score || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {violationsQuery.data?.length || 0} active violations
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Orders Tab */}
          <TabsContent value="workorders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Work Orders</CardTitle>
                <CardDescription>Manage field operations</CardDescription>
              </CardHeader>
              <CardContent>
                {workOrdersQuery.isLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : workOrdersQuery.data?.length ? (
                  <div className="space-y-2">
                    {workOrdersQuery.data.map((wo: any) => (
                      <div key={wo.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{wo.title || 'Work Order'}</p>
                          <p className="text-xs text-muted-foreground">{wo.status}</p>
                        </div>
                        <Badge>{wo.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No work orders</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fleet Tab */}
          <TabsContent value="fleet" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Management</CardTitle>
                <CardDescription>Monitor devices and vehicles</CardDescription>
              </CardHeader>
              <CardContent>
                {devicesQuery.isLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : devicesQuery.data?.length ? (
                  <div className="space-y-2">
                    {devicesQuery.data.map((device: any) => (
                      <div key={device.deviceId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{device.deviceName}</p>
                          <p className="text-xs text-muted-foreground">{device.deviceType}</p>
                        </div>
                        <Badge variant="default">
                          Online
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No devices</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
