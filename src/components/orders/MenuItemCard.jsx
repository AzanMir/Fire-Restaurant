"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

function availableVariants(item) {
  return (item.variants || item.menu_item_variants || [])
    .filter((variant) => variant.is_available)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export default function MenuItemCard({ item, onAdd, compact = false }) {
  const [open, setOpen] = useState(false);
  const variants = useMemo(() => availableVariants(item), [item]);
  const hasVariants = variants.length > 0;
  const lowestPrice = hasVariants ? Math.min(...variants.map((variant) => Number(variant.price))) : Number(item.price);

  function addSingleItem() {
    onAdd({ ...item, menu_item_id: item.id });
  }

  function addVariant(variant) {
    onAdd({
      ...item,
      id: variant.id,
      // Legacy size rows remain individually sellable until their database
      // migration is complete; persisted variants use the shared parent item.
      menu_item_id: variant.legacy ? variant.id : item.id,
      variant_id: variant.legacy ? null : variant.id,
      variant_name: variant.name,
      name: `${item.name} (${variant.name})`,
      price: Number(variant.price),
    });
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => (hasVariants ? setOpen(true) : addSingleItem())}
        className="flex flex-col items-start rounded-2xl border bg-card p-3 text-left hover:border-orange-300 hover:bg-orange-50 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-24 object-cover rounded-xl mb-2" />
        ) : (
          <div className="flex w-full h-24 items-center justify-center rounded-xl bg-muted mb-2 text-2xl">🍽️</div>
        )}
        <p className={`${compact ? "text-xs" : "text-sm"} font-semibold line-clamp-2 leading-tight`}>{item.name}</p>
        <p className="text-orange-600 font-bold text-sm mt-1">
          {hasVariants ? `From ${formatCurrency(lowestPrice)}` : formatCurrency(item.price)}
        </p>
        {hasVariants && <p className="text-xs text-muted-foreground mt-0.5">Choose a size</p>}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Choose a size for {item.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 pt-2">
            {variants.map((variant) => (
              <Button key={variant.id} variant="outline" className="justify-between h-12" onClick={() => addVariant(variant)}>
                <span>{variant.name}</span>
                <span className="text-orange-600 font-semibold">{formatCurrency(variant.price)}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
