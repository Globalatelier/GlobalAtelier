export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-40 animate-pulse bg-neutral-100" />
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-20 animate-pulse bg-neutral-100" />
      ))}
    </div>
  );
}
