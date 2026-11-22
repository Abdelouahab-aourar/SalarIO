"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeOff, LockKeyhole, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Enter a valid work email."),
  password: z.string().min(1, "Enter your password."),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "hr@sosgroupe.com", password: "" } });

  async function onSubmit(values: Values) {
    setError(null);
    try {
      const res = await authClient.signIn.email({ email: values.email, password: values.password });
      if (res.error) {
        // Better Auth 401 = wrong credentials; anything else (e.g. a cold
        // Neon compute dropping the first request) is transient → retry.
        const status = (res.error as unknown as { status?: number }).status;
        setError(
          status === 401
            ? "Sign-in failed. Check your credentials."
            : "Service temporarily unavailable (database waking up). Please try again in a few seconds.",
        );
        return;
      }
    } catch {
      setError("Service temporarily unavailable. Please try again in a few seconds.");
      return;
    }
    // Route each role to its own home:
    // employees have no company-wide view (FR-16); authorized users land on
    // their scoped absence entry; HR/approver open the company overview.
    const session = await authClient.getSession();
    const role = (session.data?.user as unknown as { role?: string } | undefined)?.role;
    router.push(role === "EMPLOYEE" ? "/account" : role === "AUTHORIZED" ? "/absences" : "/overview");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-stretch bg-[#F8F9F6]">
      <div className="relative hidden w-[770px] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0A211C] to-[#24624F] p-12 lg:flex">
        <p className="relative text-[23px] font-extrabold tracking-[1px] text-white">SALARIO</p>
        <div className="relative">
          <p className="text-[59px] font-extrabold leading-[1.12] tracking-tight text-[#F8F9F6]">
            Every person.<br />Every dinar.<br />In perfect focus.
          </p>
        </div>
        <div className="relative">
          <div className="h-[3px] w-12 bg-[#D5B77A]" />
          <p className="mt-4 text-[21px] font-semibold leading-[1.3] text-[#F8F9F6]">
            People and numbers.<br />Finally, on the same wavelength.
          </p>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between bg-gradient-to-b from-[#E7EFE9] to-[#F5F5F5] px-[86px] py-12">
        <div className="flex items-center justify-between text-[12px] text-[#62776E]">
          <Link href="/" className="transition-colors hover:text-[#173B32]">← Back to SALARIO</Link>
          <span className="font-bold tracking-[1.6px] text-[#398675]">HR ACCESS</span>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto w-full max-w-[480px] space-y-[18px]">
          <div>
            <p className="text-[11px] font-bold tracking-[1.7px] text-[#398675]">WELCOME BACK</p>
            <h1 className="mt-4 text-[46px] font-extrabold leading-[1.12] tracking-tight text-[#102E29]">Payroll, handled with precision.</h1>
            <p className="mt-4 text-[15px] leading-[1.6] text-[#62776E]">Sign in to your HR workspace.<br />Your people and payroll, connected.</p>
          </div>
          <Field label="Work email" error={form.formState.errors.email?.message}>
            <div className="relative">
              <Input placeholder="hr@sosgroupe.com" {...form.register("email")} />
              <Mail className="absolute top-1/2 right-3 size-[17px] -translate-y-1/2 text-[#62776E]" />
            </div>
          </Field>
          <Field label="Password" error={form.formState.errors.password?.message}>
            <div className="relative">
              <Input type="password" placeholder="••••••••••••" {...form.register("password")} />
              <EyeOff className="absolute top-1/2 right-3 size-[17px] -translate-y-1/2 text-[#62776E]" />
            </div>
          </Field>
          {error ? <p role="alert" className="rounded-[10px] border border-[#F3B8B8] bg-[#FDECEC] px-3 py-2 text-[12px] text-[#a02a2a]">{error}</p> : null}
          <Button type="submit" className="h-[54px] w-full bg-gradient-to-r from-[#398675] to-[#D5B77A] text-[14px] font-bold text-white">
            Login
          </Button>
          <p className="flex items-center justify-center gap-2 text-[11px] text-[#62776E]">
            <LockKeyhole className="size-[15px]" /> HR-only access. Keep your credentials private.
          </p>
        </form>
        <div className="flex items-center justify-between text-[10px] text-[#62776E]">
          <span>© 2026 SALARIO</span>
          <span>Enterprise payroll workspace</span>
        </div>
      </div>
    </div>
  );
}
