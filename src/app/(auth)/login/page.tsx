"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button, Input, Label, Card, CardContent } from "@/components/ui";
import { loginSchema, type LoginInput } from "@/lib/validations";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Noe gikk galt. Prøv igjen senere.");
    }
  };

  return (
    <>
      {/* Mobil logo */}
      <div className="lg:hidden text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg mb-4">
          <svg 
            className="w-8 h-8 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold gradient-text">Kundedata</h1>
      </div>

      <Card className="border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
              Velkommen tilbake
            </h2>
            <p className="text-[var(--color-muted)] mt-2">
              Logg inn for å fortsette til dashboardet
            </p>
          </div>

          {/* Feilmelding */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-[var(--color-error-light)] border border-[var(--color-error)]/20 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[var(--color-error)] flex-shrink-0" />
              <p className="text-sm text-[var(--color-error)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-postadresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="din@epost.no"
                icon={<Mail className="h-5 w-5" />}
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passord</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-[var(--color-primary)] hover:underline"
                >
                  Glemt passord?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  icon={<Lock className="h-5 w-5" />}
                  error={errors.password?.message}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting}
            >
              Logg inn
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[var(--color-muted)]">
              Har du ikke en konto?{" "}
              <Link 
                href="/register" 
                className="text-[var(--color-primary)] font-medium hover:underline"
              >
                Registrer deg
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full"></div></div>}>
      <LoginForm />
    </Suspense>
  );
}

