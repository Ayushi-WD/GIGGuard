import type { Worker } from "@/lib/types";

export function WorkerPicker({
  workers,
  value,
  onChange,
}: {
  workers: Worker[];
  value: string;
  onChange: (workerId: string) => void;
}) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-xs font-semibold text-muted sm:w-64">
      Viewing worker
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-input !py-2.5 text-sm font-medium"
      >
        {workers.map((worker) => (
          <option key={worker.id} value={worker.id}>
            {worker.full_name} · {worker.platform}
          </option>
        ))}
      </select>
    </label>
  );
}
