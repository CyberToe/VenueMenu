import { SearchExperience } from "@/components/search/SearchExperience";

export default function SearchPage() {
  return (
    <div>
      <div className="border-b border-zinc-200 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Find venue</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Search by date and radius. Map shows your position and nearby venues with visible shows.
          </p>
        </div>
      </div>
      <SearchExperience />
    </div>
  );
}
