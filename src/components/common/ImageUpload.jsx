"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function ImageUpload({ value, onChange, className }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(value || null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file);
  }

  function handleRemove() {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className="relative flex h-32 w-32 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted hover:bg-muted/80 transition"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Upload preview"
            fill
            className="object-cover rounded-2xl"
            unoptimized
          />
        ) : (
          <ImageIcon className="size-8 text-muted-foreground" />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="size-3 mr-1" /> Upload
        </Button>
        {preview && (
          <Button type="button" variant="outline" size="sm" onClick={handleRemove}>
            <X className="size-3 mr-1" /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}
