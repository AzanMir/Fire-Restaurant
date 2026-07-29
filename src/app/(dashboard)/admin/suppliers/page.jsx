"use client";

import { useState, useMemo } from "react";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, History, Phone, Mail, MapPin } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import SearchBar from "@/components/common/SearchBar";
import Pagination from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import Loader from "@/components/common/Loader";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import useSuppliers from "@/hooks/useSuppliers";
import { createSupplier, updateSupplier, deleteSupplier, getSupplierPurchases } from "@/services/supplierService";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/lib/constants";

const EMPTY = { name: "", phone: "", email: "", address: "", notes: "" };

export default function SuppliersPage() {
  const { toast } = useToast();
  const { suppliers, loading, refresh } = useSuppliers();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);

  const filtered = useMemo(() => {
    if (!search) return suppliers;
    return suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search) || s.email?.toLowerCase().includes(search));
  }, [suppliers, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function openCreate() { setForm(EMPTY); setEditId(null); setDialogOpen(true); }

  function openEdit(s) {
    setForm({ name: s.name, phone: s.phone || "", email: s.email || "", address: s.address || "", notes: s.notes || "" });
    setEditId(s.id);
    setDialogOpen(true);
  }

  async function openHistory(s) {
    setSelectedSupplier(s);
    setHistoryOpen(true);
    setHistLoading(true);
    try {
      const data = await getSupplierPurchases(s.id);
      setPurchaseHistory(data);
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    } finally {
      setHistLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { toast({ title: "Name is required", type: "error" }); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateSupplier(editId, form);
        toast({ title: "Supplier updated", type: "success" });
      } else {
        await createSupplier(form);
        toast({ title: "Supplier created", type: "success" });
      }
      setDialogOpen(false);
      refresh();
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteSupplier(deleteId);
      toast({ title: "Supplier removed", type: "success" });
      setDeleteId(null);
      refresh();
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <PageHeader title="Suppliers" description={`${suppliers.length} active suppliers`}>
        <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="size-4 mr-1" /> Add Supplier
        </Button>
      </PageHeader>

      <Card><CardContent className="p-4">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search suppliers..." className="max-w-sm" />
      </CardContent></Card>

      <Card><CardContent className="p-0 overflow-x-auto">
        {paged.length === 0 ? (
          <EmptyState title="No suppliers found">
            <Button variant="outline" onClick={openCreate}><Plus className="size-4 mr-1" /> Add Supplier</Button>
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    {s.phone ? (
                      <span className="flex items-center gap-1 text-sm"><Phone className="size-3" /> {s.phone}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {s.email ? (
                      <span className="flex items-center gap-1 text-sm"><Mail className="size-3" /> {s.email}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {s.address ? (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3" /> {s.address}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" title="Purchase history" onClick={() => openHistory(s)}>
                        <History className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleteId(s.id)}>
                        <Trash2 className="size-4" />
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
          <DialogHeader><DialogTitle>{editId ? "Edit Supplier" : "New Supplier"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Supplier name" /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92..." /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="supplier@example.com" /></div>
            <div className="space-y-1.5"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">{saving ? "Saving..." : editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Purchase History — {selectedSupplier?.name}</DialogTitle></DialogHeader>
          {histLoading ? <Loader /> : purchaseHistory.length === 0 ? (
            <EmptyState title="No purchases yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseHistory.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.purchase_date)}</TableCell>
                    <TableCell>{p.ingredient?.name || "—"}</TableCell>
                    <TableCell>{p.quantity} {p.ingredient?.unit}</TableCell>
                    <TableCell>{formatCurrency(p.unit_price)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(p.total_price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Remove Supplier?" description="The supplier will be deactivated. Existing records are preserved." confirmLabel="Remove" />
    </div>
  );
}
