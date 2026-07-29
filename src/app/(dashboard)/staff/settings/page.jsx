"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/common/PageHeader";
import Loader from "@/components/common/Loader";
import useSettings from "@/hooks/useSettings";
import { formatCurrency } from "@/lib/utils";
import { Clock, Phone, MapPin, Percent, DollarSign } from "lucide-react";

export default function StaffSettingsPage() {
  const { settings, loading } = useSettings();

  if (loading) return <Loader />;

  return (
    <div className="space-y-4 max-w-xl">
      <PageHeader title="Restaurant Info" description="View restaurant details and configuration" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {settings?.restaurant_name || "FIRE Restaurant"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.logo_url && (
            <img src={settings.logo_url} alt="Logo" className="h-16 rounded-xl object-contain" />
          )}
          <Separator />
          <div className="space-y-3">
            {settings?.address && (
              <div className="flex items-start gap-3">
                <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{settings.address}</p>
                </div>
              </div>
            )}
            {settings?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm">{settings.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Clock className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Opening Hours</p>
                <p className="text-sm">{settings?.opening_time || "09:00"} — {settings?.closing_time || "23:00"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Currency</p>
                <p className="text-sm">{settings?.currency || "Rs."}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Percent className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Tax Rate</p>
                <p className="text-sm">{settings?.tax_percentage ?? 5}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
