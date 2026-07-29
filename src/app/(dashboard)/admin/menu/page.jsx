"use client";

import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, ImageIcon, ChefHat, X } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import SearchBar from "@/components/common/SearchBar";
import Pagination from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import Loader from "@/components/common/Loader";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ImageUpload from "@/components/common/ImageUpload";
import useMenu from "@/hooks/useMenu";
import useCategories from "@/hooks/useCategories";
import useInventory from "@/hooks/useInventory";
import { createMenuItem, updateMenuItem, deleteMenuItem, upsertRecipe } from "@/services/menuService";
import { uploadImage } from "@/services/uploadService";
import { formatCurrency } from "@/lib/utils";
import { STORAGE_BUCKETS, ITEMS_PER_PAGE, UNITS } from "@/lib/constants";

const EMPTY_ITEM = { name: "", description: "", category_id: "", price: "", is_available: true };

export default function MenuPage() {
  const { toast } = useToast();
  const { items, loading, refresh } = useMenu();
  const { categories } = useCategories();
  const { ingredients } = useInventory();

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [recipeItems, setRecipeItems] = useState([]);
  const [recipeNotes, setRecipeNotes] = useState("");

  const filtered = useMemo(() => {
    let list = items;
    if (search) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    if (filterCat !== "all") list = list.filter((i) => i.category_id === filterCat);
    return list;
  }, [items, search, filterCat]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function openCreate() {
    setForm(EMPTY_ITEM);
    setEditId(null);
    setImageFile(null);
    setRecipeItems([]);
    setRecipeNotes("");
    setDialogOpen(true);
  }

  async function openEdit(item) {
    const { getMenuItem } = await import("@/services/menuService");
    const full = await getMenuItem(item.id);
    setForm({
      name: full.name,
      description: full.description || "",
      category_id: full.category_id || "",
      price: full.price,
      is_available: full.is_available,
    });
    setEditId(full.id);
    setImageFile(null);
    setRecipeNotes(full.recipe?.notes || "");
    setRecipeItems(
      (full.recipe?.recipe_items || []).map((ri) => ({
        ingredient_id: ri.ingredient_id,
        quantity: ri.quantity,
        unit: ri.unit,
        _name: ri.ingredient?.name || "",
      }))
    );
    setDialogOpen(true);
  }

  function addRecipeRow() {
    setRecipeItems((prev) => [...prev, { ingredient_id: "", quantity: "", unit: "g", _name: "" }]);
  }

  function removeRecipeRow(idx) {
    setRecipeItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateRecipeRow(idx, field, value) {
    setRecipeItems((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const updated = { ...row, [field]: value };
        if (field === "ingredient_id") {
          const ing = ingredients.find((x) => x.id === value);
          updated._name = ing?.name || "";
          updated.unit = ing?.unit || "g";
        }
        return updated;
      })
    );
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) {
      toast({ title: "Validation error", description: "Name and price are required.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      let image_url = editId ? items.find((i) => i.id === editId)?.image_url || "" : "";
      if (imageFile) image_url = await uploadImage(imageFile, STORAGE_BUCKETS.MENU);

      let savedItem;
      if (editId) {
        savedItem = await updateMenuItem(editId, { ...form, image_url, price: Number(form.price) });
        toast({ title: "Menu item updated", type: "success" });
      } else {
        savedItem = await createMenuItem({ ...form, image_url, price: Number(form.price) });
        toast({ title: "Menu item created", type: "success" });
      }

      // Save recipe
      const validRecipe = recipeItems.filter((r) => r.ingredient_id && r.quantity);
      await upsertRecipe(savedItem.id, recipeNotes, validRecipe);

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
      await deleteMenuItem(deleteId);
      toast({ title: "Menu item deleted", type: "success" });
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
      <PageHeader title="Menu" description={`${items.length} total items`}>
        <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="size-4 mr-1" /> Add Item
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search menu..." className="w-64" />
          <Select value={filterCat} onValueChange={(v) => { setFilterCat(v); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {paged.length === 0 ? (
            <EmptyState title="No menu items found" description="Add your first menu item.">
              <Button onClick={openCreate} variant="outline"><Plus className="size-4 mr-1" /> Add Item</Button>
            </EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="size-10 rounded-xl object-cover" />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                          <ImageIcon className="size-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category?.name || "—"}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(item.price)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={item.is_available ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                        {item.is_available ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Menu Item" : "New Menu Item"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="recipe"><ChefHat className="size-3 mr-1" />Recipe</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <ImageUpload value={editId ? items.find((i) => i.id === editId)?.image_url : null} onChange={setImageFile} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Name *</Label>
                  <Input placeholder="e.g. Chicken Burger" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Price *</Label>
                  <Input type="number" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Description</Label>
                  <Textarea placeholder="Describe this item..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="menu-avail" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
                  <Label htmlFor="menu-avail">Available for ordering</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recipe" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Define ingredients used per serving. Inventory will auto-deduct on order completion.</p>
              <div className="space-y-1.5">
                <Label>Recipe Notes</Label>
                <Textarea placeholder="Preparation notes..." value={recipeNotes} onChange={(e) => setRecipeNotes(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                {recipeItems.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select value={row.ingredient_id || "none"} onValueChange={(v) => updateRecipeRow(idx, "ingredient_id", v === "none" ? "" : v)}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Ingredient" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select ingredient</SelectItem>
                        {ingredients.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      className="w-24"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => updateRecipeRow(idx, "quantity", e.target.value)}
                    />
                    <Select value={row.unit} onValueChange={(v) => updateRecipeRow(idx, "unit", v)}>
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeRecipeRow(idx)}>
                      <X className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addRecipeRow}>
                <Plus className="size-4 mr-1" /> Add Ingredient
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
              {saving ? "Saving..." : editId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Menu Item?" description="This will permanently delete the item and its recipe." confirmLabel="Delete" />
    </div>
  );
}
