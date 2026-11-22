"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Modal from "@/components/Modal/Modal";
import { fetchNoteById } from "@/lib/api";
import { noteKeys } from "@/lib/query/keys";
import css from "@/components/NotePreview/NotePreview.module.css";

function formatDate(date: string): string {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(value);
}

export default function NotePreview() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const hasToken = Boolean(process.env.NEXT_PUBLIC_NOTEHUB_TOKEN);
  const closePreview = () => router.back();
  const noteQuery = useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => fetchNoteById(id),
    enabled: Boolean(id) && hasToken,
  });
  const note = noteQuery.data;

  return (
    <Modal onClose={closePreview}>
      <div className={css.container}>
        <article className={css.item}>
          <header className={css.header}>
            <h2>{note?.title ?? "Note preview"}</h2>
            <button
              type="button"
              className={css.backBtn}
              onClick={closePreview}
              aria-label="Close note preview"
            >
              Close
            </button>
          </header>
          {!hasToken ? (
            <p role="status">
              Add your personal <code>NEXT_PUBLIC_NOTEHUB_TOKEN</code> to the
              local .env file to load this note.
            </p>
          ) : noteQuery.isPending ? (
            <p role="status">Loading note…</p>
          ) : noteQuery.error ? (
            <p role="alert">
              Could not fetch note details. {noteQuery.error.message}
            </p>
          ) : !note ? (
            <p role="status">Note not found.</p>
          ) : (
            <>
              <p className={css.tag}>{note.tag}</p>
              <p className={css.content}>{note.content}</p>
              <time className={css.date} dateTime={note.createdAt}>
                {formatDate(note.createdAt)}
              </time>
            </>
          )}
        </article>
      </div>
    </Modal>
  );
}
