"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function WholesaleApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/wholesale/applications");
      if (!res.ok) throw new Error("Failed to fetch applications");
      const json = await res.json();
      if (json.success && json.data) {
        setApplications(json.data.applications);
      }
    } catch (error) {
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      const payload = { id, action, rejectionReason: action === "reject" ? "Did not meet requirements" : undefined };
      const res = await fetch("/api/admin/wholesale/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Failed to ${action}`);
      toast.success(`Application ${action}d successfully`);
      fetchApplications();
    } catch (error) {
      toast.error(`Failed to ${action} application`);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending KYC Applications</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve wholesale buyer applications.
        </p>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Registration No.</TableHead>
              <TableHead>Tax ID</TableHead>
              <TableHead>Business Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No pending applications.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app._id}>
                  <TableCell className="font-medium">{app.companyName}</TableCell>
                  <TableCell>{app.companyRegistrationNumber}</TableCell>
                  <TableCell>{app.taxIdNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {app.businessType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald-600 border-emerald-600/30 hover:bg-emerald-50"
                      onClick={() => handleAction(app._id, "approve")}
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleAction(app._id, "reject")}
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
