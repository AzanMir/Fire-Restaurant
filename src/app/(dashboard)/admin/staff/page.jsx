"use client";

import { useState, useMemo } from "react";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, KeyRound, ToggleLeft, ToggleRight, ShieldCheck, User } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import SearchBar from "@/components/common/SearchBar";
import Pagination from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import Loader from "@/components/common/Loader";
import useStaff from "@/hooks/useStaff";
import { createStaffMember, updateStaffMember, toggleStaffStatus, resetStaffPassword } from "@/services/staffService";
import { formatDate, getInitials } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/lib/constants";

const EMPTY = { full_name: "", email: "", phone: "", role: "staff", password: "" };

export default function StaffPage() {
  const { toast } = useToast();
  const { staff, loading, refresh } = useStaff();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const filtered = useMemo(() => {
    if (!search) return staff;
    const q = search.toLowerCase();
    return staff.filter((s) => s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q));
  }, [staff, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function openCreate() { setForm(EMPTY); setEditId(null); setDialogOpen(true); }
  function openEdit(s) {
    setForm({ full_name: s.full_name, email: s.email, phone: s.phone || "", role: s.role, password: "" });
    setEditId(s.id);
    setDialogOpen(true);
  }
  function openReset(s) { setSelectedStaff(s); setNewPassword(""); setResetOpen(true); }

  async function handleSave() {
    if (!form.full_name || !form.email) { toast({ title: "Name and email required", type: "error" }); return; }
    if (!editId && (!form.password || form.password.length < 8)) { toast({ title: "Password must be at least 8 characters", type: "error" }); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateStaffMember(editId, { full_name: form.full_name, phone: form.phone, role: form.role });
        toast({ title: "Staff member updated", type: "success" });
      } else {
        await createStaffMember(form);
        toast({ title: "Staff member created", type: "success" });
      }
      setDialogOpen(false);
      refresh();
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(s) {
    try {
      await toggleStaffStatus(s.id, !s.is_active);
      toast({ title: s.is_active ? "Staff deactivated" : "Staff activated", type: "success" });
      refresh();
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    }
  }

  async function handleReset() {
    if (!newPassword || newPassword.length < 8) { toast({ title: "Password must be at least 8 characters", type: "error" }); return; }
    setSaving(true);
    try {
      await resetStaffPassword(selectedStaff.id, newPassword);
      toast({ title: "Password reset successfully", type: "success" });
      setResetOpen(false);
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <PageHeader title="Staff" description={`${staff.length} members`}>
        <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="size-4 mr-1" /> Add Staff
        </Button>
      </PageHeader>

      <Card><CardContent className="p-4">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search staff..." className="max-w-sm" />
      </CardContent></Card>

      <Card><CardContent className="p-0 overflow-x-auto">
        {paged.length === 0 ? (
          <EmptyState title="No staff found">
            <Button variant="outline" onClick={openCreate}><Plus className="size-4 mr-1" /> Add Staff</Button>
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                        {getInitials(s.full_name)}
                      </div>
                      <span className="font-medium">{s.full_name || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                  <TableCell className="text-sm">{s.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={s.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"}>
                      {s.role === "admin" ? <><ShieldCheck className="size-3 mr-1 inline" />Admin</> : <><User className="size-3 mr-1 inline" />Staff</>}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={s.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}>
                      {s.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleToggle(s)} title="Toggle status">
                        {s.is_active ? <ToggleRight className="size-4 text-green-600" /> : <ToggleLeft className="size-4 text-gray-400" />}
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openReset(s)} title="Reset password">
                        <KeyRound className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)}>
                        <Pencil className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Staff Member" : "New Staff Member"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editId} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editId && (
              <div className="space-y-1.5"><Label>Password *</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">{saving ? "Saving..." : editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password — {selectedStaff?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button onClick={handleReset} disabled={saving} className="bg-orange-500 hover:bg-orange-600">{saving ? "Resetting..." : "Reset Password"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
