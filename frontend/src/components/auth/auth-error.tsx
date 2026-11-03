import { CircleAlert } from "lucide-react";

export function AuthError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mt-6 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">Authentication notice</p>
        <p className="mt-0.5 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
