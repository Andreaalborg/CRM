"use client";
import { useActionState } from "react";
import { requestMagicLink } from "@/lib/portal/actions";
export function LoginRequestForm() {
  const [state, action, pending] = useActionState(requestMagicLink, null);
  if (state?.ok) return <p role="status" className="mt-4 rounded-lg border border-green-700 bg-green-50 p-3 text-sm text-green-900">{state.msg}</p>;
  return (
    <form action={action} className="mt-4 space-y-3">
      <div><label htmlFor="email" className="crm-label">E-post</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="deg@bedrift.no" className="crm-input" /></div>
      {state && !state.ok && <p role="alert" className="text-sm text-red-800">{state.error}</p>}
      <button className="crm-btn w-full justify-center" disabled={pending}>{pending ? "Sender …" : "Send innloggingslenke"}</button>
    </form>
  );
}
