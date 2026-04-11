export default function ProjectCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-0 border border-zinc-800 divide-y divide-zinc-800">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-zinc-950 p-6 animate-pulse">
          {/* Author row */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-zinc-800" />
            <div className="h-3 w-28 bg-zinc-800 rounded" />
            <div className="h-3 w-16 bg-zinc-800/60 rounded" />
          </div>
          {/* Title */}
          <div className="h-5 w-2/3 bg-zinc-800 rounded mb-2" />
          {/* Description */}
          <div className="h-3 w-full bg-zinc-800/60 rounded mb-1" />
          <div className="h-3 w-3/4 bg-zinc-800/60 rounded mb-4" />
          {/* Pills */}
          <div className="flex gap-2 mb-4">
            <div className="h-5 w-16 bg-zinc-800 rounded-full" />
            <div className="h-5 w-12 bg-zinc-800/60 rounded-full" />
            <div className="h-5 w-14 bg-zinc-800/60 rounded-full" />
          </div>
          {/* Footer */}
          <div className="flex justify-between pt-4 border-t border-zinc-800">
            <div className="h-4 w-32 bg-zinc-800/60 rounded" />
            <div className="h-7 w-24 bg-zinc-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}