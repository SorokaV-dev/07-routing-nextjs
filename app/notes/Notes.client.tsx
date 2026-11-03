"use client";

import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createNote, deleteNote, fetchNotes } from "@/lib/api";
import { noteKeys } from "@/lib/query/keys";
import type { NewNote, NoteTag } from "@/types/note";
import Modal from "@/components/Modal/Modal";
import NoteForm from "@/components/NoteForm/NoteForm";
import NoteList from "@/components/NoteList/NoteList";
import Pagination from "@/components/Pagination/Pagination";
import SearchBox from "@/components/SearchBox/SearchBox";
import css from "./NotesPage.module.css";

const PER_PAGE = 12;

interface NotesClientProps {
  initialPage: number;
  initialSearch: string;
  initialTag: NoteTag | null;
}

function getErrorMessage(error: Error | null): string {
  return error?.message ?? "Something went wrong. Please try again.";
}

export default function NotesClient({
  initialPage,
  initialSearch,
  initialTag,
}: NotesClientProps) {
  const hasToken = Boolean(process.env.NEXT_PUBLIC_NOTEHUB_TOKEN);
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateSearch = useDebouncedCallback((value: string) => {
    setSearch(value.trim());
    setCurrentPage(1);
  }, 350);

  const notesQuery = useQuery({
    queryKey: noteKeys.list(currentPage, search, initialTag ?? undefined),
    queryFn: () =>
      fetchNotes({
        page: currentPage,
        perPage: PER_PAGE,
        search,
        tag: initialTag ?? undefined,
      }),
    enabled: hasToken,
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: (note: NewNote) => createNote(note),
    onSuccess: async () => {
      setCurrentPage(1);
      await queryClient.invalidateQueries({ queryKey: noteKeys.all });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: noteKeys.all }),
  });

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    updateSearch(value);
  };

  const handleCreateNote = async (note: NewNote) => {
    await createMutation.mutateAsync(note);
  };

  const notes = notesQuery.data?.notes ?? [];
  const totalPages = notesQuery.data?.totalPages ?? 0;
  const requestError = notesQuery.error ?? deleteMutation.error;

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage, initialTag]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <main className={css.app}>
      <header className={css.toolbar}>
        <SearchBox value={searchInput} onChange={handleSearchChange} />
        {totalPages > 1 && (
          <Pagination
            currentPage={Math.min(currentPage, totalPages)}
            pageCount={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
        <button
          className={css.button}
          type="button"
          onClick={() => {
            createMutation.reset();
            setIsModalOpen(true);
          }}
        >
          Create note +
        </button>
      </header>

      {!hasToken ? (
        <p role="status">
          Add your personal <code>NEXT_PUBLIC_NOTEHUB_TOKEN</code> to the local
          .env file to load your notes.
        </p>
      ) : notesQuery.isPending ? (
        <p role="status" aria-live="polite">
          Loading notes…
        </p>
      ) : requestError ? (
        <p role="alert">{getErrorMessage(requestError)}</p>
      ) : notes.length > 0 ? (
        <>
          {deleteMutation.error && (
            <p role="alert">{getErrorMessage(deleteMutation.error)}</p>
          )}
          <NoteList
            notes={notes}
            onDelete={(id) => deleteMutation.mutate(id)}
            deletingId={
              deleteMutation.isPending ? deleteMutation.variables : null
            }
          />
        </>
      ) : (
        <p role="status">No notes found.</p>
      )}

      {createMutation.error && !isModalOpen && (
        <p role="alert">{getErrorMessage(createMutation.error)}</p>
      )}

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <NoteForm
            onSubmit={handleCreateNote}
            onCancel={() => setIsModalOpen(false)}
            isSaving={createMutation.isPending}
            errorMessage={createMutation.error?.message ?? null}
          />
        </Modal>
      )}
    </main>
  );
}
