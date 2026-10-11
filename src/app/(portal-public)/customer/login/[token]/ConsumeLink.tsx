"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
export function ConsumeLink({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "err">("idle");
  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-[var(--color-brand-muted)]">Trykk på knappen for å logge inn. Lenken kan bare brukes én gang.</p>
      {state === "err" && <p role="alert" className="text-sm text-red-800">Lenken er ugyldig, utløpt eller allerede brukt. <a className="underline" href="/customer/login">Be om en ny lenke</a>.</p>}
      <button type="button" className="crm-btn w-full justify-center" disabled={state === "busy"}
        onClick={async () => { setState("busy"); const r = await signIn("magic-link", { token, redirect: false }); if (r?.ok && !r.error) window.location.href = "/customer"; else setState("err"); }}>
        {state === "busy" ? "Logger inn …" : "Logg inn"}
      </button>
    </div>
  );
}
