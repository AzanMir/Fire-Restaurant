export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="size-10 animate-spin rounded-full border-4 border-muted border-t-orange-500" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
