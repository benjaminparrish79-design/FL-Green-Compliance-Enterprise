import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, AlertCircle, User, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function WorkOrders() {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);

  // Fetch real work order data
  const workOrdersQuery = trpc.workorder.list.useQuery(
    { companyId: user?.companyId || 0 },
    { enabled: !!user?.companyId }
  );

  const updateStatusMutation = trpc.workorder.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      workOrdersQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const workOrders = workOrdersQuery.data || [];

  if (workOrdersQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "outline",
      in_progress: "secondary",
      completed: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Work Orders</h1>
          <p className="text-muted-foreground">Create, assign, and track field work orders</p>
        </div>
        <Button>Create Work Order</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workOrders.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workOrders.filter((w: any) => w.status === "in_progress").length}</div>
            <p className="text-xs text-muted-foreground">Active now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workOrders.filter((w: any) => w.status === "completed").length}</div>
            <p className="text-xs text-muted-foreground">{workOrders.length > 0 ? Math.round((workOrders.filter((w: any) => w.status === "completed").length / workOrders.length) * 100) : 0}% completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workOrders.filter((w: any) => w.status === "pending").length}</div>
            <p className="text-xs text-muted-foreground">Need assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
        </TabsList>

        {/* Active Tab */}
        <TabsContent value="active" className="space-y-4">
          <div className="space-y-2">
            {workOrders
              .filter((wo: any) => wo.status === "in_progress")
              .map((order: any) => (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedOrder(order.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">{getStatusIcon(order.status)}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{order.title}</h3>
                          <p className="text-sm text-muted-foreground">{order.property}</p>
                          <div className="flex gap-2 mt-2">
                            {getStatusBadge(order.status)}
                            <Badge variant={order.priority === "high" ? "destructive" : "secondary"}>
                              {order.priority}
                            </Badge>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${order.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{order.progress}% complete</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-2">
                          <User className="w-4 h-4" />
                          <p className="text-sm font-medium">{order.assignee}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Due {order.dueDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Update
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-2">
            {workOrders
              .filter((wo: any) => wo.status === "pending")
              .map((order: any) => (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{order.title}</h3>
                        <p className="text-sm text-muted-foreground">{order.property}</p>
                        <div className="flex gap-2 mt-2">
                          {getStatusBadge(order.status)}
                          <Badge variant="outline">{order.priority}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Starts {order.startDate.toLocaleDateString()}</p>
                        <Button size="sm" className="mt-2">
                          Assign
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed" className="space-y-4">
          <div className="space-y-2">
            {workOrders
              .filter((wo: any) => wo.status === "completed")
              .map((order: any) => (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{order.title}</h3>
                          <p className="text-sm text-muted-foreground">{order.property}</p>
                          <div className="flex gap-2 mt-2">
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{order.assignee}</p>
                        <p className="text-xs text-muted-foreground">
                          Completed {order.dueDate.toLocaleDateString()}
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          View Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Dispatch Tab */}
        <TabsContent value="dispatch">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Dashboard</CardTitle>
              <CardDescription>Assign and optimize work order routes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">Optimize Routes</Button>
              <Button variant="outline" className="w-full">
                View Map
              </Button>
              <Button variant="outline" className="w-full">
                Bulk Assign
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
