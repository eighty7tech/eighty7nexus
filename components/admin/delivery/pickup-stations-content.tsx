"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IPickupStation } from "@/types";
import { PickupStationDialog } from "@/components/admin/delivery/pickup-station-dialog";
import { Trash2, Edit, Plus, Loader2, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

export function PickupStationsContent() {
  const [stations, setStations] = useState<IPickupStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<IPickupStation | null>(null);

  const loadStations = () => {
    setLoading(true);
    fetch("/api/admin/pickup-stations?limit=100")
      .then(res => res.json())
      .then(data => {
        // paginatedResponse returns { success, data: { data: [], pagination: {} } }
        if (data?.data?.data && Array.isArray(data.data.data)) {
          setStations(data.data.data);
        } else if (data?.data && Array.isArray(data.data)) {
          setStations(data.data);
        } else if (Array.isArray(data)) {
          setStations(data);
        } else {
          setStations([]);
        }
      })
      .catch(err => {
        console.error("Failed to load pickup stations:", err);
        toast.error("Failed to load pickup stations");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadStations();
  }, []);

  const handleAdd = () => {
    setSelectedStation(null);
    setDialogOpen(true);
  };

  const handleEdit = (station: IPickupStation) => {
    setSelectedStation(station);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pickup station?")) return;
    try {
      const res = await fetch(`/api/admin/pickup-stations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Pickup station deleted");
      loadStations();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete pickup station");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pickup Stations</h1>
          <p className="text-muted-foreground mt-2">
            Manage your physical pickup locations for customers to collect their orders.
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Pickup Station
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Stations</CardTitle>
          <CardDescription>
            These stations are presented as pickup location options during checkout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Station</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations.map((station) => (
                    <TableRow key={station._id as string}>
                      <TableCell>
                        <div className="font-medium text-base">{station.name}</div>
                        {station.specialInstructions && (
                          <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]" title={station.specialInstructions}>
                            {station.specialInstructions}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {station.district}, {station.region}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={station.address}>
                            {station.address}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {station.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {station.operatingHours || <span className="text-muted-foreground italic">Not specified</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{station.capacity} parcels</Badge>
                      </TableCell>
                      <TableCell>
                        {station.isActive ? (
                          <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(station)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(station._id as string)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {stations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <p>No pickup stations configured yet.</p>
                          <Button variant="outline" onClick={handleAdd}>Create First Station</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PickupStationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        station={selectedStation}
        onSaved={() => {
          toast.success(`Pickup station ${selectedStation ? "updated" : "created"}`);
          loadStations();
        }}
      />
    </div>
  );
}
