import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Compliance() {
  const [selectedTask, setSelectedTask] = useState<number | null>(null);

  // Mock data for compliance tasks
  const complianceTasks = [
    {
      id: 1,
      title: "Quarterly Compliance Audit",
      property: "Property #123",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "pending",
      priority: "high",
      assignee: "John Doe",
    },
    {
      id: 2,
      title: "Buffer Zone Verification",
      property: "Property #456",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: "in_progress",
      priority: "medium",
      assignee: "Jane Smith",
    },
    {
      id: 3,
      title: "Fertilizer Application Review",
      property: "Property #789",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "overdue",
      priority: "critical",
      assignee: "Unassigned",
    },
  ];

  const violations = [
    {
      id: 1,
      type: "Buffer Zone Violation",
      property: "Property #123",
      severity: "high",
      detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: "pending_remediation",
      evidence: 3,
    },
    {
      id: 2,
      type: "Fertilizer Overapplication",
      property: "Property #456",
      severity: "medium",
      detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: "remediated",
      evidence: 5,
    },
  ];

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
        <Button>New Task</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">+2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">2 pending remediation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evidence Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">All verified</p>
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
            {complianceTasks.map((task) => (
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
            ))}
          </div>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          <div className="space-y-2">
            {violations.map((violation) => (
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
            ))}
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
