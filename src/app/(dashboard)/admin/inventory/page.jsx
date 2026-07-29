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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, History, AlertTriangle, TrendingUp } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import SearchBar from "@/components/common/SearchBar";
import Pagination from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import Loader from "@/components/common/Loader";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import useInventory from "@/hooks/useInventory";
import useSuppliers from "@/hooks/useSuppliers";
import { createIngredient, updateIngredient, deleteIngredient, getStockHistory, addStockMovement } from "@/services/inventoryService";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ITEMS_PER_PAGE, UNITS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

const EMPTY = { name: "", unit: "g", current_stock: "", minimum_stock: "", purchase_price: "", supplier_id: "" };

export default function InventoryPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { ingredients, loading, refresh } = useInventory();
  const { suppliers } = useSuppliers();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ type: "purchase", quantity: "", note: "" });

  const filtered = useMemo(() => {
    let list = ingredients;
    if (search) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    if (tab === "low") list = list.filter((i) => Number(i.current_stock) <= Number(i.minimum_stock));
    return list;
  }, [ingredients, search, tab]);

  const lowCount = useMemo(() => ingredients.filter((i) => Number(i.current_stock) <= Number(i.minimum_stock)).length, [ingredients]);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function openCreate() { setForm(EMPTY); setEditId(null); setDialogOpen(true); }

  function openEdit(item) {
    setForm({
      name: item.name, unit: item.unit,
      current_stock: item.current_stock, minimum_stock: item.minimum_stock,
      purchase_price: item.purchase_price, supplier_id: item.supplier_id || "",
    });
    setEditId(item.id);
    setDialogOpen(true);
  }

  async function openHistory(item) {
    setSelectedItem(item);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const data = await getStockHistory(item.id);
      setHistory(data);
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    } finally {
      setHistoryLoading(false);
    }
  }

  function openAdjust(item) {
    setSelectedItem(item);
    setAdjustForm({ type: "purchase", quantity: "", note: "" });
    setAdjustOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast({ title: "Validation", description: "Name is required.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name, unit: form.unit,
        current_stock: Number(form.current_stock) || 0,
        minimum_stock: Number(form.minimum_stock) || 0,
        purchase_price: Number(form.purchase_price) || 0,
        supplier_id: form.supplier_id || null,
      };
      if (editId) {
        await updateIngredient(editId, payload);
        toast({ title: "Ingredient updated", type: "success" });
      } else {
        await createIngredient(payload);
        toast({ title: "Ingredient created", type: "success" });
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
      await deleteIngredient(deleteId);
      toast({ title: "Ingredient removed", type: "success" });
      setDeleteId(null);
      refresh();
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  async function handleAdjust() {
    if (!adjustForm.quantity) {
      toast({ title: "Validation", description: "Quantity is required.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await addStockMovement({
        ingredientId: selectedItem.id,
        type: adjustForm.type,
        quantity: Number(adjustForm.quantity),
        note: adjustForm.note,
        createdBy: user?.id,
      });
      toast({ title: "Stock adjusted", type: "success" });
      setAdjustOpen(false);
      refresh();
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <PageHeader title="Inventory" description={`${ingredients.length} ingredients · ${lowCount} low stock`}>
        <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="size-4 mr-1" /> Add Ingredient
        </Button>
      </PageHeader>

      {lowCount > 0 && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="size-4 shrink-0" />
          <span><strong>{lowCount} item{lowCount > 1 ? "s" : ""}</strong> below minimum stock level.</span>
        </div>
      )}

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search ingredients..." className="w-64" />
          <div className="flex gap-1 ml-auto">
            <Button variant={tab === "all" ? "default" : "outline"} size="sm" onClick={() => setTab("all")}>All</Button>
            <Button variant={tab === "low" ? "default" : "outline"} size="sm" onClick={() => setTab("low")} className={tab === "low" ? "bg-red-500 hover:bg-red-600" : ""}>
              <AlertTriangle className="size-3 mr-1" /> Low Stock ({lowCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {paged.length === 0 ? (
            <EmptyState title="No ingredients found">
              <Button variant="outline" onClick={openCreate}><Plus className="size-4 mr-1" /> Add Ingredient</Button>
            </EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Price/Unit</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((item) => {
                  const isLow = Number(item.current_stock) <= Number(item.minimum_stock);
                  return (
                    <TableRow key={item.id} className={isLow ? "bg-red-50/50" : ""}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                      <TableCell>
                        <span className={isLow ? "text-red-600 font-semibold" : ""}>{item.current_stock}</span>
                      </TableCell>
                      <TableCell>{item.minimum_stock}</TableCell>
                      <TableCell>{formatCurrency(item.purchase_price)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.supplier?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={isLow ? "bg-red-100 text-red-700 border-red-200" : "bg-green-100 text-green-700 border-green-200"}>
                          {isLow ? "Low Stock" : "OK"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openAdjust(item)} title="Adjust stock">
                            <TrendingUp className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => openHistory(item)} title="View history">
                            <History className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleteId(item.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Ingredient" : "New Ingredient"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chicken Breast" /></div>
            <div className="space-y-1.5">
              <Label>Unit *</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Current Stock</Label><Input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Minimum Stock</Label><Input type="number" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Purchase Price / Unit</Label><Input type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5">
              <Label>Supplier</Label>
              <Select value={form.supplier_id || "none"} onValueChange={(v) => setForm({ ...form, supplier_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Supplier</SelectItem>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">{saving ? "Saving..." : editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Stock History — {selectedItem?.name}</DialogTitle></DialogHeader>
          {historyLoading ? <Loader /> : history.length === 0 ? (
            <EmptyState title="No history yet" description="Stock movements will appear here." />
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-start justify-between rounded-xl border px-3 py-2.5 text-sm">
                  <div>
                    <Badge variant="outline" className={
                      h.type === "purchase" ? "bg-green-50 text-green-700" :
                      h.type === "usage" ? "bg-blue-50 text-blue-700" :
                      h.type === "waste" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"
                    }>{h.type}</Badge>
                    <p className="text-muted-foreground mt-1 text-xs">{h.note || "—"}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</p>
                  </div>
                  <span className={`font-semibold ${h.type === "usage" || h.type === "waste" ? "text-red-600" : "text-green-600"}`}>
                    {h.type === "usage" || h.type === "waste" ? "-" : "+"}{h.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Stock — {selectedItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Movement Type</Label>
              <Select value={adjustForm.type} onValueChange={(v) => setAdjustForm({ ...adjustForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase (add)</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="waste">Waste (remove)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Quantity ({selectedItem?.unit})</Label><Input type="number" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Note</Label><Input value={adjustForm.note} onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })} placeholder="Reason..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjust} disabled={saving} className="bg-orange-500 hover:bg-orange-600">{saving ? "Saving..." : "Apply"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Remove Ingredient?" description="This will remove the ingredient from inventory. Recipes using it will be affected." confirmLabel="Remove" />
    </div>
  );
}
