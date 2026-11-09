import { Logo } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-gradient-to-b from-primary-soft to-background px-4 py-10">
      <Logo className="mb-8 text-lg" />
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8">{children}</div>
    </div>
  );
}
