"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";

export default function RegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?tab=signup");
  }, [router]);

  return (
    <div className="page-container flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <LoaderCircle className="size-8 animate-spin text-forest" />
      <p className="text-sm text-muted">Redirecting to Sign up...</p>
    </div>
  );
}
