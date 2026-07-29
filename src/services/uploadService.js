import { supabase } from "@/lib/supabase";
import { STORAGE_BUCKETS } from "@/lib/constants";

export async function uploadImage(file, bucket = STORAGE_BUCKETS.MENU) {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteImage(url, bucket) {
  if (!url) return;
  const fileName = url.split("/").pop();
  await supabase.storage.from(bucket).remove([fileName]);
}

export async function uploadProfileImage(file, userId) {
  const ext = file.name.split(".").pop();
  const fileName = `${userId}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.PROFILES)
    .upload(fileName, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(STORAGE_BUCKETS.PROFILES).getPublicUrl(fileName);
  return data.publicUrl;
}
