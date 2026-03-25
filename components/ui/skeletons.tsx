import { Skeleton } from "@/components/ui/skeleton";

export function BookCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 w-full animate-pulse">
      <Skeleton className="h-[280px] w-full rounded-xl bg-muted" />
      <div className="space-y-2 px-1">
        <Skeleton className="h-4 w-[200px] bg-muted/80" />
        <Skeleton className="h-3 w-[150px] bg-muted/60" />
      </div>
    </div>
  );
}

export function ReaderSkeleton() {
  return (
    <div className="flex h-screen w-full flex-col p-6 space-y-8 animate-pulse">
      <div className="flex justify-between items-center w-full max-w-4xl mx-auto">
        <Skeleton className="h-6 w-[300px] bg-muted" />
        <Skeleton className="h-8 w-[120px] rounded-full bg-muted" />
      </div>
      <div className="w-full max-w-2xl mx-auto space-y-6 flex-1 mt-12">
        <Skeleton className="h-5 w-full bg-muted/80" />
        <Skeleton className="h-5 w-[90%] bg-muted/80" />
        <Skeleton className="h-5 w-[95%] bg-muted/80" />
        <Skeleton className="h-5 w-full bg-muted/80" />
        <Skeleton className="h-5 w-[85%] bg-muted/80" />
        <div className="pt-4 space-y-6">
          <Skeleton className="h-5 w-[92%] bg-muted/80" />
          <Skeleton className="h-5 w-[88%] bg-muted/80" />
          <Skeleton className="h-5 w-[96%] bg-muted/80" />
        </div>
      </div>
    </div>
  );
}
