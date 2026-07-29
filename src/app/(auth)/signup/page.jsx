"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Flame, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import Spinner from "@/components/common/Spinner";

const DUPLICATE = "Account Already Exists";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    setLoading(true);

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const body = await res.json().catch(() => null);
      if (body?.exists) {
        setError(DUPLICATE);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp(
        { email: normalizedEmail, password },
        { data: { full_name: fullName, role: "staff" } }
      );

      if (signUpError) {
        const msg = signUpError.message ?? "";
        setError(/already|registered|not allowed/i.test(msg) ? DUPLICATE : msg);
        return;
      }

      if (data?.user && !data.user.identities?.length) {
        setError(DUPLICATE);
        return;
      }

      if (data?.session) {
        router.push("/staff/dashboard");
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("signup error", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-neutral-950 dark:to-neutral-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center size-14 rounded-2xl bg-orange-500 mb-4 shadow-lg">
            <Flame className="size-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">FIRE Restaurant</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your account to access the dashboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
            <CardDescription>Create a new staff account for the restaurant system.</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle className="size-12 text-green-500" />
                <p className="text-lg font-semibold">Account created!</p>
                <p className="text-sm text-muted-foreground">
                  Check your email to confirm your account, then sign in using your credentials.
                </p>
                <Button variant="secondary" className="w-full" onClick={() => router.push("/login")}>Go to Login</Button>
              </div>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                </div>

                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : "Create account"}
                </Button>
              </form>
            )}

            <div className="mt-4 text-center">
              <Link href="/login" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <ArrowLeft className="size-3" /> Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
