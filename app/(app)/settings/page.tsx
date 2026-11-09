"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BUSINESS_TYPES,
  COUNTRIES,
  COUNTRY_DEFAULTS,
  CURRENCIES,
  type UpdateProfileInput,
  updateProfileSchema,
} from "@/lib/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ImageUp, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { keys } from "@/lib/queries";
import { initials } from "@/lib/utils";

const label = (s: string) => s.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase());

export default function SettingsPage() {
  const user = useAuth((s) => s.user);
  if (!user) return <Skeleton className="h-96" />;
  return <SettingsForm key={user.id} />;
}

function SettingsForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: user
      ? {
          name: user.name,
          phone: user.phone,
          businessName: user.businessName,
          businessType: user.businessType,
          city: user.city,
          country: user.country,
          currency: user.currency,
        }
      : {},
  });
  const { errors, isDirty } = form.formState;

  const save = useMutation({
    mutationFn: api.users.update,
    onSuccess: (u) => {
      setUser(u);
      qc.setQueryData(keys.me, u);
      void qc.invalidateQueries({ queryKey: keys.stats });
      form.reset(form.getValues());
      toast.success("Profile saved");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const uploadLogo = useMutation({
    mutationFn: (file: File) => api.users.uploadLogo(file, file.name),
    onSuccess: (u) => {
      setUser(u);
      toast.success("Logo updated");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  async function logout() {
    await api.auth.logout().catch(() => {});
    qc.clear();
    router.replace("/auth/login");
  }

  if (!user) return null;

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
            <CardDescription>This appears on your invoices and WhatsApp messages.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" htmlFor="s-name" error={errors.name?.message}>
                  <Input id="s-name" {...form.register("name")} />
                </Field>
                <Field label="Business name" htmlFor="s-business" error={errors.businessName?.message}>
                  <Input id="s-business" {...form.register("businessName")} />
                </Field>
                <Field label="Trade" htmlFor="s-type">
                  <Select id="s-type" {...form.register("businessType")}>
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {label(t)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="City" htmlFor="s-city" error={errors.city?.message}>
                  <Input id="s-city" {...form.register("city")} />
                </Field>
                <Field label="Country" htmlFor="s-country">
                  <Select
                    id="s-country"
                    {...form.register("country", {
                      onChange: (e) =>
                        form.setValue("currency", COUNTRY_DEFAULTS[e.target.value as keyof typeof COUNTRY_DEFAULTS].currency, {
                          shouldDirty: true,
                        }),
                    })}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {COUNTRY_DEFAULTS[c].name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Currency" htmlFor="s-currency">
                  <Select id="s-currency" {...form.register("currency")}>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="WhatsApp number"
                  htmlFor="s-phone"
                  error={errors.phone?.message}
                  hint="Changing it requires verifying again."
                  className="sm:col-span-2"
                >
                  <Input id="s-phone" type="tel" {...form.register("phone")} />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={!isDirty} loading={save.isPending}>
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>PNG, JPEG or WebP, up to 2 MB.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              {user.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
                <img src={user.logo} alt="Business logo" className="size-16 rounded-lg border object-contain" />
              ) : (
                <span className="grid size-16 place-items-center rounded-lg bg-primary-soft text-lg font-semibold text-primary">
                  {initials(user.businessName)}
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadLogo.mutate(file);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()} loading={uploadLogo.isPending}>
                <ImageUp /> Upload
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                You&apos;re on the <span className="font-semibold capitalize">{user.plan}</span> plan.
                {user.plan === "free" && ` ${user.invoiceCount} of 5 invoices used this month.`}
              </p>
              <Link href="/settings/billing" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                {user.plan === "free" ? "Upgrade" : "Manage plan"}
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-5 text-sm">
              <p className="flex items-center gap-2">
                {user.whatsappVerified ? (
                  <>
                    <CheckCircle2 className="size-4 text-success" /> WhatsApp verified
                  </>
                ) : (
                  <Link href="/auth/verify-phone" className="text-primary hover:underline">
                    Verify your WhatsApp number →
                  </Link>
                )}
              </p>
              <p className="text-muted-foreground">{user.email}</p>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut /> Log out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
