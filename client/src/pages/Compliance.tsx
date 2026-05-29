import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Compliance() {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<number | null>(null);

  // Fetch real data
  const complianceQuery = trpc.compliance.listTasks.useQuery(
    { companyId: user?.companyId || 0 },
    { enabled: !!user?.companyId }
  );
  const violationsQuery = trpc.compliance.getViolations.useQuery(
    { companyId: user?.companyId || 0 },
    { enabled: !!user?.companyId }
  );

  const complianceTasks = complianceQuery.data || [];
  const violations = violationsQuery.data || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "overdue":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "outline",
      in_progress: "secondary",
      completed: "default",
      overdue: "destructive",
      pending_remediation: "destructive",
      remediated: "default",
    };
    return <Badge variant={variants[status] || "outline"}>{status.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compliance Management</h1>
          <p className="text-muted-foreground">Track and manage compliance tasks and violations</p>
        </div>
        <Button onClick={() => toast.info("Create task feature coming soon")}>New Task</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {complianceQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{complianceTasks.length}</div>
                <p className="text-xs text-muted-foreground">compliance tasks</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            {complianceQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {complianceTasks.filter((t: any) => t.status === "completed").length}
                </div>
                <p className="text-xs text-muted-foreground">tasks completed</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Violations</CardTitle>
          </CardHeader>
          <CardContent>
            {violationsQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{violations.length}</div>
                <p className="text-xs text-muted-foreground">active violations</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            {complianceQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">
                  {complianceTasks.filter((t: any) => t.status === "pending").length}
                </div>
                <p className="text-xs text-muted-foreground">pending tasks</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Compliance Tasks</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="space-y-2">
            {complianceQuery.isLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : complianceTasks.length > 0 ? (
              complianceTasks.map((task: any) => (
              <Card
                key={task.id}
                className="cursor-pointer hover:bg-accent"
                onClick={() => setSelectedTask(task.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">{getStatusIcon(task.status)}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="text-sm text-muted-foreground">{task.property}</p>
                        <div className="flex gap-2 mt-2">
                          {getStatusBadge(task.status)}
                          <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{task.assignee}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.dueDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
            ) : (
              <p className="text-muted-foreground">No compliance tasks</p>
            )}
          </div>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          <div className="space-y-2">
            {violationsQuery.isLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : violations.length > 0 ? (
              violations.map((violation: any) => (
              <Card key={violation.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{violation.type}</h3>
                      <p className="text-sm text-muted-foreground">{violation.property}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge
                          variant={
                            violation.severity === "high" ? "destructive" : "secondary"
                          }
                        >
                          {violation.severity}
                        </Badge>
                        {getStatusBadge(violation.status)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{violation.evidence} evidence files</p>
                      <p className="text-xs text-muted-foreground">
                        {violation.detectedAt.toLocaleDateString()}
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
            ) : (
              <p className="text-muted-foreground">No violations</p>
            )}
          </div>
        </TabsContent>

        {/* Checklists Tab */}
        <TabsContent value="checklists">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Checklists</CardTitle>
              <CardDescription>Standard compliance verification checklists</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {["Quarterly Audit", "Buffer Zone Check", "Fertilizer Application", "Equipment Inspection"].map(
                  (checklist) => (
                    <div key={checklist} className="flex items-center justify-between p-3 border rounded">
                      <span>{checklist}</span>
                      <Button variant="outline" size="sm">
                        Use
                      </Button>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>Generate and view compliance reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">Generate Monthly Report</Button>
              <Button variant="outline" className="w-full">
                Generate Quarterly Report
              </Button>
              <Button variant="outline" className="w-full">
                Export Audit Trail
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
