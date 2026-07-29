import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <div className="text-7xl font-black text-orange-500">404</div>
      <h1 className="text-2xl font-bold">Page Not Found</h1>
      <p className="text-muted-foreground text-sm">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="mt-2 rounded-2xl bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 transition"
      >
        Go Home
      </Link>
    </main>
  );
}
