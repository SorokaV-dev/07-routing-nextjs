import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { notFound } from "next/navigation";
import NotesClient from "./Notes.client";
import { fetchNotes } from "@/lib/api/notes";
import { getApiTag, parseNoteFilter } from "@/lib/notes/filter";
import { noteKeys } from "@/lib/query/keys";

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

interface FilteredNotesPageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{
    page?: string | string[];
    search?: string | string[];
  }>;
}

function getFirstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function FilteredNotesPage({
  params,
  searchParams,
}: FilteredNotesPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const filter = parseNoteFilter(slug);
  if (!filter) notFound();

  const requestedPage = Number.parseInt(getFirstValue(query.page), 10);
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const search = getFirstValue(query.search).trim();
  const tag = getApiTag(filter);
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_NOTEHUB_TOKEN) {
    await queryClient.prefetchQuery({
      queryKey: noteKeys.list(page, search, tag),
      queryFn: () => fetchNotes({ page, perPage: PER_PAGE, search, tag }),
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotesClient
        initialPage={page}
        initialSearch={search}
        initialTag={tag ?? null}
      />
    </HydrationBoundary>
  );
}
