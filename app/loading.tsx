import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mb-3" />
      <p className="text-xs font-medium text-zinc-500">Loading console data...</p>
    </div>
  );
}
