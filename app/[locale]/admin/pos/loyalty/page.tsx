"use client";

import { useEffect, useState } from "react";
import { Users, Award, TrendingUp, History, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function LoyaltyDashboardPage() {
  const t = useTranslations("Admin");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/pos/loyalty");
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load loyalty dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Loyalty Program</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse h-[120px] bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Loyalty Program</h2>
          <p className="text-muted-foreground">
            Monitor customer rewards, points issued, and program engagement.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.totalMembers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Issued</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.totalPointsIssued || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Redeemed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.totalPointsRedeemed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.totalPointsActive || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Top Members</CardTitle>
            <CardDescription>Customers with the highest points balance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topMembers?.map((member: any) => (
                <div key={member._id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {member.userId?.firstName?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {member.userId?.firstName} {member.userId?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.userId?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{member.loyaltyTier}</Badge>
                    <span className="font-bold text-primary">{member.loyaltyPoints} pts</span>
                  </div>
                </div>
              ))}
              {(!data?.topMembers || data.topMembers.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No loyalty members found.</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest point issuances and redemptions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recentTransactions?.map((tx: any) => (
                <div key={tx._id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.type === 'earn' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {tx.type === 'earn' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {tx.type === 'earn' ? 'Earned Points' : 'Redeemed Points'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.type === 'earn' ? 'text-green-600' : 'text-orange-600'}`}>
                    {tx.type === 'earn' ? '+' : '-'}{Math.abs(tx.points)}
                  </div>
                </div>
              ))}
              {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent transactions.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
