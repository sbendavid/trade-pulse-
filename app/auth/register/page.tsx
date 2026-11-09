"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BUSINESS_TYPES, COUNTRIES, COUNTRY_DEFAULTS, type RegisterInput, registerSchema } from "@/lib/core";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";

const label = (s: string) => s.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase());

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { country: "NG", businessType: "electrician" },
  });
  const { errors } = form.formState;

  const register = useMutation({
    mutationFn: api.auth.register,
    onSuccess: ({ user }) => {
      setUser(user);
      router.replace("/auth/verify-phone");
    },
  });

  return (
    <>
      <h1 className="text-xl font-semibold">Create your free account</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">5 free invoices every month. No card needed.</p>
      <form onSubmit={form.handleSubmit((v) => register.mutate(v))} className="space-y-4" noValidate>
        {register.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {errorMessage(register.error)}
          </p>
        )}
        <Field label="Your name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...form.register("name")} />
        </Field>
        <Field label="Business name" htmlFor="businessName" error={errors.businessName?.message}>
          <Input
            id="businessName"
            autoComplete="organization"
            aria-invalid={!!errors.businessName}
            {...form.register("businessName")}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Trade" htmlFor="businessType" error={errors.businessType?.message}>
            <Select id="businessType" {...form.register("businessType")}>
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {label(t)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Country" htmlFor="country" error={errors.country?.message}>
            <Select id="country" {...form.register("country")}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {COUNTRY_DEFAULTS[c].name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="City" htmlFor="city" error={errors.city?.message}>
          <Input id="city" autoComplete="address-level2" aria-invalid={!!errors.city} {...form.register("city")} />
        </Field>
        <Field
          label="WhatsApp number"
          htmlFor="phone"
          error={errors.phone?.message}
          hint="We'll send a verification code on WhatsApp."
        >
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0803 123 4567"
            aria-invalid={!!errors.phone}
            {...form.register("phone")}
          />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters.">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={register.isPending}>
          Create account
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </>
  );
}
