import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-[#DCE6DF]/70", className)}
      {...props}
    />
  );
}

/** Marketing page skeleton shown by app/(marketing)/loading.tsx. */
function LandingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      <div className="flex h-[104px] items-center justify-between bg-[#0B241E] px-5 sm:px-10 lg:px-20">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg bg-white/20" />
          <Skeleton className="h-5 w-24 bg-white/20" />
        </div>
        <div className="hidden items-center gap-8 md:flex">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-3 w-16 bg-white/15" />
          ))}
        </div>
        <Skeleton className="h-10 w-36 rounded-[20px] bg-white/20" />
      </div>
      <div className="bg-gradient-to-br from-[#0B241E] via-[#24624F] to-[#173B35] px-5 py-14 sm:px-10 lg:px-20">
        <div className="grid items-center gap-10 lg:grid-cols-[565px_1fr]">
          <div className="space-y-6">
            <Skeleton className="h-[54px] w-[90%] bg-white/20" />
            <Skeleton className="h-[54px] w-[75%] bg-white/20" />
            <Skeleton className="h-[54px] w-[60%] bg-white/20" />
            <Skeleton className="h-4 w-[85%] bg-white/10" />
            <Skeleton className="h-4 w-[70%] bg-white/10" />
            <div className="flex gap-4 pt-6">
              <Skeleton className="h-[54px] w-[244px] rounded-[20px] bg-white/20" />
              <Skeleton className="h-[54px] w-[160px] rounded-[20px] bg-white/10" />
            </div>
          </div>
          <Skeleton className="h-[420px] w-full rounded-3xl bg-white/15" />
        </div>
      </div>
      <div className="space-y-6 px-5 py-16 sm:px-10 lg:px-20">
        <Skeleton className="h-12 w-[420px]" />
        <Skeleton className="h-4 w-[380px]" />
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </div>
    </div>
  );
}

/** Workspace skeleton shown while a gated page resolves. */
function WorkspaceSkeleton({ title = "Loading workspace" }: { title?: string }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={title}>
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-3 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Skeleton className="h-[190px] rounded-2xl" />
        <Skeleton className="h-[190px] rounded-2xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3 rounded-2xl border border-[#DCE6DF] bg-white p-5">
          <Skeleton className="h-4 w-48" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="space-y-3 rounded-2xl border border-[#DCE6DF] bg-white p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

export { Skeleton, LandingSkeleton, WorkspaceSkeleton };
