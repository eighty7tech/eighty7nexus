"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { getAdminsListAction, removeAdminPrivilegesAction } from "@/app/actions/admin-management-actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminManagementModal } from "./admin-management-modal";
import { Shield, ShieldAlert, MoreHorizontal, UserX, UserCog } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ADMIN_PERMISSIONS } from "@/config/permissions.config";

export function AdminListContent({ locale }: { locale: string }) {
  const t = useTranslations();
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminsListAction();
      if (res.success && res.data) {
        setAdmins(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || t("admin.systemManagement.title"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleRevoke = (id: string) => {
    if (!confirm(t("admin.systemManagement.deleteConfirmDesc"))) return;
    
    startTransition(async () => {
      try {
        const res = await removeAdminPrivilegesAction(id);
        if (res.success) {
          toast.success(res.message);
          fetchAdmins();
        }
      } catch (err: any) {
        toast.error(err.message || t("admin.systemManagement.deleteConfirmTitle"));
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <CardTitle>{t("admin.systemManagement.title")}</CardTitle>
        <AdminManagementModal onSaved={fetchAdmins}>
          <Button size="sm">
            <Shield className="h-4 w-4 mr-2" /> {t("admin.systemManagement.newAdminButton")}
          </Button>
        </AdminManagementModal>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex justify-center p-8 text-muted-foreground">Loading...</div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No administrators found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 rounded-tl-md">{t("admin.systemManagement.nameColumn")}</th>
                  <th className="px-4 py-3">{t("admin.systemManagement.roleColumn")}</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-4 py-3 text-right rounded-tr-md">{t("admin.systemManagement.actionsColumn")}</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{admin.name}</div>
                      <div className="text-muted-foreground text-xs">{admin.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {admin.isSuperAdmin ? (
                        <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                          Super Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">Admin</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {admin.department}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {admin.isSuperAdmin ? (
                          <span className="text-xs text-muted-foreground">All Permissions</span>
                        ) : (
                          admin.permissions.slice(0, 2).map((p: string) => (
                            <Badge key={p} variant="secondary" className="text-[10px] leading-none px-1.5 py-0.5">
                              {p.replace(/_/g, ' ')}
                            </Badge>
                          ))
                        )}
                        {!admin.isSuperAdmin && admin.permissions.length > 2 && (
                          <Badge variant="secondary" className="text-[10px] leading-none px-1.5 py-0.5">
                            +{admin.permissions.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("admin.systemManagement.actionsColumn")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <AdminManagementModal admin={admin} onSaved={fetchAdmins}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <UserCog className="h-4 w-4 mr-2" /> {t("admin.systemManagement.editAction")}
                            </DropdownMenuItem>
                          </AdminManagementModal>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => handleRevoke(admin.id)}
                          >
                            <UserX className="h-4 w-4 mr-2" /> {t("admin.systemManagement.revokeAction")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
