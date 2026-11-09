import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "./auth-guard";

function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// The signed-in area renders on the client (tokens live in localStorage) and
// reads the URL, so it sits behind one Suspense boundary for Cache Components.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <AuthGuard fallback={<FullPageSpinner />}>
        <AppShell>{children}</AppShell>
      </AuthGuard>
    </Suspense>
  );
}
