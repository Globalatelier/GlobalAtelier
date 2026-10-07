export default function Loading() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10 lg:py-16">
      <div className="h-24 w-2/3 animate-pulse bg-neutral-100" />
      <div className="mt-8 h-10 w-full animate-pulse bg-neutral-100" />
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index}>
            <div className="aspect-[3/4] animate-pulse bg-neutral-100" />
            <div className="mt-3 h-3 w-2/3 animate-pulse bg-neutral-100" />
            <div className="mt-2 h-3 w-1/3 animate-pulse bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
