import { z } from "zod";

// ============================================
// AUTH VALIDATIONS
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Ugyldig e-postadresse"),
  password: z.string().min(1, "Passord er påkrevd"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Navn må være minst 2 tegn"),
  email: z.string().email("Ugyldig e-postadresse"),
  password: z
    .string()
    .min(8, "Passord må være minst 8 tegn")
    .regex(/[A-Z]/, "Passord må inneholde minst én stor bokstav")
    .regex(/[a-z]/, "Passord må inneholde minst én liten bokstav")
    .regex(/[0-9]/, "Passord må inneholde minst ett tall"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passordene må være like",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Ugyldig e-postadresse"),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Passord må være minst 8 tegn")
    .regex(/[A-Z]/, "Passord må inneholde minst én stor bokstav")
    .regex(/[a-z]/, "Passord må inneholde minst én liten bokstav")
    .regex(/[0-9]/, "Passord må inneholde minst ett tall"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passordene må være like",
  path: ["confirmPassword"],
});

// ============================================
// ORGANIZATION VALIDATIONS
// ============================================

export const createOrganizationSchema = z.object({
  name: z.string().min(2, "Navn må være minst 2 tegn").max(100, "Navn kan ikke være lengre enn 100 tegn"),
  slug: z
    .string()
    .min(2, "URL-navn må være minst 2 tegn")
    .max(50, "URL-navn kan ikke være lengre enn 50 tegn")
    .regex(/^[a-z0-9-]+$/, "URL-navn kan kun inneholde små bokstaver, tall og bindestreker"),
  website: z.string().url("Ugyldig URL").optional().or(z.literal("")),
  description: z.string().max(500, "Beskrivelse kan ikke være lengre enn 500 tegn").optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

// ============================================
// FORM VALIDATIONS
// ============================================

export const formFieldSchema = z.object({
  type: z.enum([
    "TEXT",
    "EMAIL",
    "PHONE",
    "NUMBER",
    "TEXTAREA",
    "SELECT",
    "MULTI_SELECT",
    "CHECKBOX",
    "RADIO",
    "DATE",
    "TIME",
    "DATETIME",
    "FILE",
    "HIDDEN",
    "HEADING",
    "PARAGRAPH",
    "DIVIDER",
  ]),
  name: z.string().min(1, "Feltnavn er påkrevd"),
  label: z.string().min(1, "Etikett er påkrevd"),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().default(false),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  pattern: z.string().optional(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  width: z.enum(["full", "half", "third"]).default("full"),
  order: z.number().default(0),
});

export const createFormSchema = z.object({
  name: z.string().min(2, "Navn må være minst 2 tegn").max(100, "Navn kan ikke være lengre enn 100 tegn"),
  slug: z
    .string()
    .min(2, "URL-navn må være minst 2 tegn")
    .max(50, "URL-navn kan ikke være lengre enn 50 tegn")
    .regex(/^[a-z0-9-]+$/, "URL-navn kan kun inneholde små bokstaver, tall og bindestreker")
    .optional(), // Slug genereres automatisk hvis ikke oppgitt
  description: z.string().max(500, "Beskrivelse kan ikke være lengre enn 500 tegn").optional(),
  submitButtonText: z.string().optional().default("Send inn"),
  successMessage: z.string().optional().default("Takk for din henvendelse!"),
  redirectUrl: z.string().url("Ugyldig URL").optional().or(z.literal("")),
  fields: z.array(formFieldSchema).optional(),
});

export const updateFormSchema = createFormSchema.partial();

// ============================================
// SUBMISSION VALIDATIONS
// ============================================

export const updateSubmissionSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST", "SPAM"]).optional(),
  notes: z.string().max(2000, "Notater kan ikke være lengre enn 2000 tegn").optional(),
});

// ============================================
// EMAIL TEMPLATE VALIDATIONS
// ============================================

export const createEmailTemplateSchema = z.object({
  name: z.string().min(2, "Navn må være minst 2 tegn").max(100, "Navn kan ikke være lengre enn 100 tegn"),
  subject: z.string().min(2, "Emne må være minst 2 tegn").max(200, "Emne kan ikke være lengre enn 200 tegn"),
  htmlContent: z.string().min(10, "Innhold er påkrevd"),
  textContent: z.string().optional(),
  variables: z.array(z.string()).optional(),
});

export const updateEmailTemplateSchema = createEmailTemplateSchema.partial();

// ============================================
// AUTOMATION VALIDATIONS
// ============================================

export const createAutomationSchema = z.object({
  name: z.string().min(2, "Navn må være minst 2 tegn").max(100, "Navn kan ikke være lengre enn 100 tegn"),
  description: z.string().max(500, "Beskrivelse kan ikke være lengre enn 500 tegn").optional(),
  formId: z.string().optional(),
  triggerType: z.enum([
    "FORM_SUBMISSION", 
    "FIELD_VALUE", 
    "TIME_DELAY", 
    "SUBMISSION_STATUS",
    "SCHEDULED",
    "RECURRING",
    "INACTIVITY",
    "DATE_FIELD",
  ]),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  actions: z
    .array(
      z.object({
        type: z.enum([
          "SEND_EMAIL", 
          "WAIT_DELAY", 
          "UPDATE_SUBMISSION_STATUS", 
          "WEBHOOK", 
          "SEND_NOTIFICATION",
          "CONDITION",
          "SPLIT_TEST",
          "ADD_TAG",
          "REMOVE_TAG",
        ]),
        config: z.record(z.string(), z.unknown()).optional(),
        order: z.number().optional(),
        emailTemplateId: z.string().optional(),
      })
    )
    .optional(),
});

export const updateAutomationSchema = createAutomationSchema.partial();

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export type FormFieldInput = z.infer<typeof formFieldSchema>;
export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;

export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;

export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;

export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationInput = z.infer<typeof updateAutomationSchema>;

