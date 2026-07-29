"use client";

import { useState, useMemo } from "react";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, ImageIcon, ToggleLeft, ToggleRight } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import SearchBar from "@/components/common/SearchBar";
import Pagination from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import Loader from "@/components/common/Loader";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ImageUpload from "@/components/common/ImageUpload";
import useCategories from "@/hooks/useCategories";
import {
  createCategory, updateCategory, deleteCategory,
} from "@/services/categoryService";
import { uploadImage } from "@/services/uploadService";
import { STORAGE_BUCKETS, ITEMS_PER_PAGE } from "@/lib/constants";

const EMPTY = { name: "", description: "", is_active: true };

export default function CategoriesPage() {
  const { toast } = useToast();
  const { categories, loading, refresh } = useCategories();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function openCreate() {
    setForm(EMPTY);
    setEditId(null);
    setImageFile(null);
    setDialogOpen(true);
  }

  function openEdit(cat) {
    setForm({ name: cat.name, description: cat.description || "", is_active: cat.is_active });
    setEditId(cat.id);
    setImageFile(null);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast({ title: "Validation", description: "Name is required.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      let image_url = editId
        ? categories.find((c) => c.id === editId)?.image_url || ""
        : "";

      if (imageFile) {
        image_url = await uploadImage(imageFile, STORAGE_BUCKETS.CATEGORIES);
      }

      if (editId) {
        await updateCategory(editId, { ...form, image_url });
        toast({ title: "Category updated", type: "success" });
      } else {
        await createCategory({ ...form, image_url });
        toast({ title: "Category created", type: "success" });
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
      await deleteCategory(deleteId);
      toast({ title: "Category deleted", type: "success" });
      setDeleteId(null);
      refresh();
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggle(cat) {
    try {
      await updateCategory(cat.id, { is_active: !cat.is_active });
      toast({ title: cat.is_active ? "Category deactivated" : "Category activated", type: "success" });
      refresh();
    } catch (e) {
      toast({ title: "Error", description: e.message, type: "error" });
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <PageHeader title="Categories" description={`${categories.length} total categories`}>
        <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="size-4 mr-1" /> Add Category
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search categories..." className="max-w-sm" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {paged.length === 0 ? (
            <EmptyState title="No categories found" description="Create your first category to organise your menu." className="py-16">
              <Button onClick={openCreate} variant="outline"><Plus className="size-4 mr-1" /> Add Category</Button>
            </EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="size-10 rounded-xl object-cover" />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                          <ImageIcon className="size-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                      {cat.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cat.is_active
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                        }
                      >
                        {cat.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleToggle(cat)} title="Toggle status">
                          {cat.is_active
                            ? <ToggleRight className="size-4 text-green-600" />
                            : <ToggleLeft className="size-4 text-gray-400" />}
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(cat)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(cat.id)}>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <ImageUpload
              value={editId ? categories.find((c) => c.id === editId)?.image_url : null}
              onChange={setImageFile}
              className="items-start"
            />
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. Burgers"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Short description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="cat-active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="cat-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
              {saving ? "Saving..." : editId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Category?"
        description="This will permanently delete the category. Menu items assigned to it will be unassigned."
        confirmLabel="Delete"
      />
    </div>
  );
}
