"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button, Input, Textarea, Label, Checkbox } from "@/components/ui";
import { cn } from "@/lib/utils";

interface FieldOption {
  value: string;
  label: string;
}

interface FormField {
  id: string;
  type: string;
  name: string;
  label: string;
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any;
  width: string;
}

interface Form {
  id: string;
  name: string;
  description: string | null;
  submitButtonText: string;
  successMessage: string;
  redirectUrl: string | null;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderRadius: number;
  fontFamily: string;
  fields: FormField[];
  organization: {
    name: string;
    logo: string | null;
  };
}

interface PublicFormProps {
  form: Form;
}

export function PublicForm({ form }: PublicFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    setServerErrors({});

    try {
      const response = await fetch(`/api/forms/${form.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setServerErrors(result.errors);
        }
        return;
      }

      setIsSuccess(true);
      reset();

      if (result.redirectUrl) {
        setTimeout(() => {
          window.location.href = result.redirectUrl;
        }, 2000);
      }
    } catch (error) {
      console.error("Submit error:", error);
      setServerErrors({ _form: "Noe gikk galt. Prøv igjen." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const widthClasses = {
    full: "w-full",
    half: "w-full md:w-[calc(50%-0.5rem)]",
    third: "w-full md:w-[calc(33.333%-0.67rem)]",
  };

  if (isSuccess) {
    return (
      <div 
        className="w-full max-w-lg mx-auto text-center p-8 rounded-2xl shadow-xl animate-scale-in"
        style={{ 
          backgroundColor: "#fff",
          borderRadius: `${form.borderRadius}px`,
        }}
      >
        <div 
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ backgroundColor: form.buttonColor + "20" }}
        >
          <CheckCircle2 
            className="h-10 w-10" 
            style={{ color: form.buttonColor }}
          />
        </div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: form.textColor }}>
          Takk!
        </h2>
        <p className="text-lg" style={{ color: form.textColor + "cc" }}>
          {form.successMessage}
        </p>
        {form.redirectUrl && (
          <p className="text-sm mt-4 opacity-60" style={{ color: form.textColor }}>
            Du blir videresendt om et øyeblikk...
          </p>
        )}
      </div>
    );
  }

  return (
    <div 
      className="w-full max-w-lg mx-auto p-8 rounded-2xl shadow-xl animate-slide-up"
      style={{ 
        backgroundColor: "#fff",
        borderRadius: `${form.borderRadius}px`,
      }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        {form.organization.logo && (
          <img 
            src={form.organization.logo} 
            alt={form.organization.name}
            className="h-12 mx-auto mb-4"
          />
        )}
        <h1 
          className="text-2xl font-bold mb-2"
          style={{ color: form.textColor }}
        >
          {form.name}
        </h1>
        {form.description && (
          <p style={{ color: form.textColor + "99" }}>{form.description}</p>
        )}
      </div>

      {/* Feilmelding */}
      {serverErrors._form && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{serverErrors._form}</p>
        </div>
      )}

      {/* Skjema */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex flex-wrap gap-4">
          {form.fields
            .filter((field: FormField) => !["HEADING", "PARAGRAPH", "DIVIDER"].includes(field.type))
            .map((field: FormField): React.ReactNode => {
              const fieldError = errors[field.name]?.message;
              const error: string | undefined = (typeof fieldError === 'string' ? fieldError : undefined) || serverErrors[field.name];
              
              return (
                <div 
                  key={field.id} 
                  className={cn(widthClasses[field.width as keyof typeof widthClasses])}
                >
                  {field.type !== "CHECKBOX" && (
                    <Label 
                      htmlFor={field.name} 
                      required={field.required}
                      className="mb-2 block"
                      style={{ color: form.textColor }}
                    >
                      {field.label}
                    </Label>
                  )}

                  {/* Tekst, E-post, Telefon, Nummer */}
                  {["TEXT", "EMAIL", "PHONE", "NUMBER"].includes(field.type) && (
                    <Input
                      id={field.name}
                      type={
                        field.type === "EMAIL" ? "email" :
                        field.type === "PHONE" ? "tel" :
                        field.type === "NUMBER" ? "number" :
                        "text"
                      }
                      placeholder={field.placeholder || undefined}
                      error={error}
                      style={{ borderRadius: `${form.borderRadius / 2}px` }}
                      {...register(field.name, {
                        required: field.required ? `${field.label} er påkrevd` : false,
                      })}
                    />
                  )}

                  {/* Textarea */}
                  {field.type === "TEXTAREA" && (
                    <Textarea
                      id={field.name}
                      placeholder={field.placeholder || undefined}
                      error={error}
                      style={{ borderRadius: `${form.borderRadius / 2}px` }}
                      {...register(field.name, {
                        required: field.required ? `${field.label} er påkrevd` : false,
                      })}
                    />
                  )}

                  {/* Select */}
                  {field.type === "SELECT" && field.options && Array.isArray(field.options) && (
                    <select
                      id={field.name}
                      className={cn(
                        "flex h-11 w-full rounded-lg border-2 bg-white px-4 py-2 text-base transition-all duration-200",
                        "border-[var(--color-border)]",
                        "hover:border-[var(--color-muted)]",
                        "focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20",
                        error && "border-red-500"
                      )}
                      style={{ borderRadius: `${form.borderRadius / 2}px` }}
                      {...register(field.name, {
                        required: field.required ? `${field.label} er påkrevd` : false,
                      })}
                    >
                      <option value="">Velg...</option>
                      {(field.options as { value: string; label: string }[]).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Radio */}
                  {field.type === "RADIO" && field.options && Array.isArray(field.options) && (
                    <div className="space-y-2">
                      {(field.options as { value: string; label: string }[]).map((option) => (
                        <label 
                          key={option.value}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            value={option.value}
                            className="w-4 h-4"
                            style={{ accentColor: form.buttonColor }}
                            {...register(field.name, {
                              required: field.required ? `${field.label} er påkrevd` : false,
                            })}
                          />
                          <span style={{ color: form.textColor }}>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Checkbox */}
                  {field.type === "CHECKBOX" && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        id={field.name}
                        {...register(field.name, {
                          required: field.required ? `${field.label} er påkrevd` : false,
                        })}
                      />
                      <span style={{ color: form.textColor }}>{field.label}</span>
                    </label>
                  )}

                  {/* Dato */}
                  {field.type === "DATE" && (
                    <Input
                      id={field.name}
                      type="date"
                      error={error}
                      style={{ borderRadius: `${form.borderRadius / 2}px` }}
                      {...register(field.name, {
                        required: field.required ? `${field.label} er påkrevd` : false,
                      })}
                    />
                  )}

                  {/* Hjelpetekst */}
                  {field.helpText && !error && (
                    <p className="mt-1.5 text-sm opacity-60" style={{ color: form.textColor }}>
                      {field.helpText}
                    </p>
                  )}

                  {/* Feil */}
                  {error && (
                    <p className="mt-1.5 text-sm text-red-500">{error}</p>
                  )}
                </div>
              );
            })}
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
          style={{
            backgroundColor: form.buttonColor,
            color: form.buttonTextColor,
            borderRadius: `${form.borderRadius / 2}px`,
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sender...
            </>
          ) : (
            form.submitButtonText
          )}
        </Button>
      </form>

      {/* Powered by */}
      <p className="text-center text-xs mt-6 opacity-40" style={{ color: form.textColor }}>
        Drevet av Kundedata
      </p>
    </div>
  );
}

