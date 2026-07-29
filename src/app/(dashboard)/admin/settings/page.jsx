"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/common/PageHeader";
import Loader from "@/components/common/Loader";
import ImageUpload from "@/components/common/ImageUpload";
import Spinner from "@/components/common/Spinner";
import useSettings from "@/hooks/useSettings";
import { upsertSettings } from "@/services/settingsService";
import { uploadImage } from "@/services/uploadService";
import { STORAGE_BUCKETS } from "@/lib/constants";

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, loading, refresh } = useSettings();
  const [form, setForm] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        restaurant_name: settings.restaurant_name || "",
        address: settings.address || "",
        phone: settings.phone || "",
        email: settings.email || "",
        currency: settings.currency || "Rs.",
        tax_percentage: settings.tax_percentage ?? 5,
        opening_time: settings.opening_time || "09:00",
        closing_time: settings.closing_time || "23:00",
        logo_url: settings.logo_url || "",
      });
    }
  }, [settings]);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.restaurant_name) { toast({ title: "Restaurant name is required", type: "error" }); return; }
    setSaving(true);
    try {
      let logo_url = form.logo_url;
      if (logoFile) logo_url = await uploadImage(logoFile, STORAGE_BUCKETS.SETTINGS);

      await upsertSettings({ ...form, logo_url });
      toast({ title: "Settings saved", type: "success" });
      refresh();
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) return <Loader />;

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader title="Settings" description="Configure your restaurant details" />

      <form onSubmit={handleSave} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Restaurant Branding</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-6">
              <ImageUpload value={form.logo_url} onChange={setLogoFile} />
              <div className="flex-1 space-y-3">
                <div className="space-y-1.5">
                  <Label>Restaurant Name *</Label>
                  <Input value={form.restaurant_name} onChange={(e) => set("restaurant_name", e.target.value)} placeholder="My Restaurant" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="info@restaurant.com" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contact & Location</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main Street, City" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+92-300-1234567" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Billing & Tax</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Currency Symbol</Label>
              <Input value={form.currency} onChange={(e) => set("currency", e.target.value)} placeholder="Rs." maxLength={5} />
            </div>
            <div className="space-y-1.5">
              <Label>Tax Percentage (%)</Label>
              <Input type="number" value={form.tax_percentage} onChange={(e) => set("tax_percentage", Number(e.target.value))} min={0} max={100} step={0.01} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Opening Hours</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Opening Time</Label>
              <Input type="time" value={form.opening_time} onChange={(e) => set("opening_time", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Closing Time</Label>
              <Input type="time" value={form.closing_time} onChange={(e) => set("closing_time", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600">
          {saving ? <><Spinner size="sm" className="mr-2" />Saving...</> : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
