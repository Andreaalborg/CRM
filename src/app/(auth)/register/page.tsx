"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button, Input, Label, Card, CardContent } from "@/components/ui";
import { registerSchema, type RegisterInput } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");

  // Passordkrav-sjekker
  const passwordChecks = [
    { label: "Minst 8 tegn", valid: password.length >= 8 },
    { label: "Én stor bokstav", valid: /[A-Z]/.test(password) },
    { label: "Én liten bokstav", valid: /[a-z]/.test(password) },
    { label: "Ett tall", valid: /[0-9]/.test(password) },
  ];

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return;
      }

      setSuccess(true);

      // Automatisk innlogging etter registrering
      setTimeout(async () => {
        await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch {
      setError("Noe gikk galt. Prøv igjen senere.");
    }
  };

  if (success) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-success-light)] mb-6">
            <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
            Konto opprettet!
          </h2>
          <p className="text-[var(--color-muted)]">
            Du blir nå logget inn automatisk...
          </p>
        </CardContent>
      </Card>
    );
  }

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
              Opprett konto
            </h2>
            <p className="text-[var(--color-muted)] mt-2">
              Kom i gang med Kundedata i dag
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
              <Label htmlFor="name">Fullt navn</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ola Nordmann"
                icon={<User className="h-5 w-5" />}
                error={errors.name?.message}
                {...register("name")}
              />
            </div>

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
              <Label htmlFor="password">Passord</Label>
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
              
              {/* Passordkrav */}
              {password && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {passwordChecks.map((check) => (
                    <div
                      key={check.label}
                      className={`flex items-center gap-1.5 text-xs ${
                        check.valid ? "text-[var(--color-success)]" : "text-[var(--color-muted)]"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{check.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bekreft passord</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  icon={<Lock className="h-5 w-5" />}
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  {showConfirmPassword ? (
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
              Opprett konto
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[var(--color-muted)]">
              Har du allerede en konto?{" "}
              <Link 
                href="/login" 
                className="text-[var(--color-primary)] font-medium hover:underline"
              >
                Logg inn
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}



