import { Skeleton } from '@/components/ui/skeleton';

export default function DiscoverLoading() {
  return (
    <main className="container max-w-6xl mx-auto px-4 py-8">
      <Skeleton className="h-10 w-64 mb-8" />

      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, section) => (
          <div key={section} className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-video rounded" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
