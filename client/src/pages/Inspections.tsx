import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, CheckCircle, AlertCircle, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Inspections() {
  const { user } = useAuth();
  const [selectedInspection, setSelectedInspection] = useState<number | null>(null);

  // Use mock data for now (inspection router only has analyzeImage/analyzeApplication)
  const mockInspections = [
    {
      id: 1,
      fileName: "turf-sample-1.jpg",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "completed",
      score: 87,
      analysis: { condition: "Healthy", compliance: "Compliant" },
    },
    {
      id: 2,
      fileName: "fertilizer-check.jpg",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: "completed",
      score: 72,
      analysis: { condition: "Good", compliance: "Compliant" },
    },
  ];

  const inspections = mockInspections;



  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "info":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Calculate stats from real data
  const totalInspections = inspections.length;
  const completedInspections = inspections.filter((i: any) => i.status === "completed").length;
  const avgScore = completedInspections > 0
    ? Math.round(
        inspections
          .filter((i: any) => i.status === "completed" && i.score)
          .reduce((sum: number, i: any) => sum + (i.score || 0), 0) / completedInspections
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Inspections</h1>
          <p className="text-muted-foreground">Upload images for AI-powered compliance analysis</p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload Image
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInspections}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}%</div>
            <p className="text-xs text-muted-foreground">From completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedInspections}</div>
            <p className="text-xs text-muted-foreground">{totalInspections - completedInspections} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Analysis Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inspections.filter((i: any) => i.status === "analyzing").length}</div>
            <p className="text-xs text-muted-foreground">Currently analyzing</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Inspections</TabsTrigger>
          <TabsTrigger value="upload">Upload New</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Recent Inspections Tab */}
        <TabsContent value="recent" className="space-y-4">
          {inspections.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No inspections yet. Upload an image to get started.
              </CardContent>
            </Card>
          ) : (
          <div className="space-y-2">
            {inspections.map((inspection: any) => (
              <Card
                key={inspection.id}
                className="cursor-pointer hover:bg-accent"
                onClick={() => setSelectedInspection(inspection.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{inspection.property}</h3>
                        {inspection.status === "completed" && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {inspection.status === "analyzing" && (
                          <Zap className="w-4 h-4 text-blue-600 animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{inspection.type}</p>

                      {inspection.analysis && (
                        <div className="mt-3 space-y-2">
                          {typeof inspection.analysis === 'object' && Object.entries(inspection.analysis).map(([key, value], i) => (
                            <div
                              key={i}
                              className={`inline-block px-2 py-1 rounded text-xs bg-blue-100 text-blue-800`}
                            >
                              {key}: {String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      {inspection.score !== null && (
                        <div className="mb-2">
                          <div className={`text-3xl font-bold ${getScoreColor(inspection.score)}`}>
                            {inspection.score}%
                          </div>
                          <p className="text-xs text-muted-foreground">Compliance Score</p>
                        </div>
                      )}
                      {inspection.status === "analyzing" && (
                        <div className="mb-2">
                          <p className="text-sm text-muted-foreground">Analyzing...</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mb-2">
                        {inspection.uploadedAt.toLocaleString()}
                      </p>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </TabsContent>

        {/* Upload New Tab */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Inspection Image</CardTitle>
              <CardDescription>
                Upload turf, site, or equipment images for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Drag and drop images here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or WEBP up to 10MB</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Property</label>
                <select className="w-full border rounded px-3 py-2">
                  <option>Property #123</option>
                  <option>Property #456</option>
                  <option>Property #789</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Inspection Type</label>
                <select className="w-full border rounded px-3 py-2">
                  <option>Turf Health Assessment</option>
                  <option>Fertilizer Application Check</option>
                  <option>Disease Detection</option>
                  <option>Buffer Zone Compliance</option>
                  <option>Equipment Inspection</option>
                </select>
              </div>

              <Button className="w-full">Analyze Image</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Inspection History</CardTitle>
              <CardDescription>All past inspections and analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inspections.length === 0 ? (
                  <p className="text-muted-foreground">No inspection history</p>
                ) : (
                  inspections.map((inspection: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{new Date(inspection.createdAt).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">Inspection #{inspection.id}</p>
                      </div>
                      <div className={`text-lg font-bold ${getScoreColor(inspection.score || 0)}`}>
                        {inspection.score || 'N/A'}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Reports</CardTitle>
              <CardDescription>Generate reports from inspection data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">Generate Monthly Report</Button>
              <Button variant="outline" className="w-full">
                Export Inspection Data
              </Button>
              <Button variant="outline" className="w-full">
                Compliance Summary
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
