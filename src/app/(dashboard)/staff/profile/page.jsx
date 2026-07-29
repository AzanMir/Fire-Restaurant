"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/common/PageHeader";
import Loader from "@/components/common/Loader";
import Spinner from "@/components/common/Spinner";
import ImageUpload from "@/components/common/ImageUpload";
import { getProfile, updateProfile, changePassword } from "@/services/profileService";
import { uploadProfileImage } from "@/services/uploadService";

export default function StaffProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [pwForm, setPwForm] = useState({ newPw: "", confirm: "" });

  useEffect(() => {
    if (user) {
      getProfile(user.id)
        .then((p) => {
          setProfile(p);
          setForm({ full_name: p.full_name || "", phone: p.phone || "" });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let avatar_url = profile?.avatar_url || "";
      if (avatarFile) avatar_url = await uploadProfileImage(avatarFile, user.id);
      const updated = await updateProfile(user.id, { ...form, avatar_url });
      setProfile(updated);
      toast({ title: "Profile updated", type: "success" });
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePw(e) {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      toast({ title: "Passwords do not match", type: "error" }); return;
    }
    if (pwForm.newPw.length < 8) {
      toast({ title: "Min 8 characters", type: "error" }); return;
    }
    setChangingPw(true);
    try {
      await changePassword(pwForm.newPw);
      setPwForm({ newPw: "", confirm: "" });
      toast({ title: "Password changed", type: "success" });
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    } finally {
      setChangingPw(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="space-y-4 max-w-xl">
      <PageHeader title="My Profile" />
      <Card>
        <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4">
              <ImageUpload value={profile?.avatar_url} onChange={setAvatarFile} />
              <div>
                <p className="font-semibold">{profile?.full_name || "—"}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{profile?.role}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={profile?.email || ""} disabled className="opacity-60" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600">
              {saving ? <Spinner size="sm" /> : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleChangePw} className="space-y-3">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })} placeholder="Min 8 characters" />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
            </div>
            <Button type="submit" disabled={changingPw} variant="outline">
              {changingPw ? <Spinner size="sm" /> : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
