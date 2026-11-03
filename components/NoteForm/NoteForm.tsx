"use client";

import { Formik } from "formik";
import * as Yup from "yup";
import type { NewNote, NoteTag } from "@/types/note";
import css from "./NoteForm.module.css";

export interface NoteFormProps {
  onSubmit: (note: NewNote) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
  errorMessage?: string | null;
}

interface NoteFormValues {
  title: string;
  content: string;
  tag: NoteTag;
}

const tags: NoteTag[] = ["Todo", "Work", "Personal", "Meeting", "Shopping"];

const validationSchema = Yup.object({
  title: Yup.string()
    .trim()
    .min(3, "Title must contain at least 3 characters")
    .max(50, "Title must contain no more than 50 characters")
    .required("Title is required"),
  content: Yup.string().max(
    500,
    "Content must contain no more than 500 characters",
  ),
  tag: Yup.mixed<NoteTag>().oneOf(tags).required("Tag is required"),
});

export default function NoteForm({
  onSubmit,
  onCancel,
  isSaving = false,
  errorMessage = null,
}: NoteFormProps) {
  const initialValues: NoteFormValues = {
    title: "",
    content: "",
    tag: "Todo",
  };

  return (
    <Formik<NoteFormValues>
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={async (values, helpers) => {
        try {
          await onSubmit({
            title: values.title.trim(),
            content: values.content.trim(),
            tag: values.tag,
          });
          helpers.resetForm();
        } catch {
          // The parent keeps the form open and displays the request error.
        }
      }}
    >
      {(form) => (
        <form className={css.form} onSubmit={form.handleSubmit} noValidate>
          <div className={css.formGroup}>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              name="title"
              className={css.input}
              value={form.values.title}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              aria-invalid={Boolean(form.touched.title && form.errors.title)}
              aria-describedby="title-error"
            />
            <span
              {...{ name: "title" }}
              id="title-error"
              className={css.error}
              aria-live="polite"
            >
              {form.touched.title ? form.errors.title : ""}
            </span>
          </div>

          <div className={css.formGroup}>
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              name="content"
              rows={8}
              className={css.textarea}
              value={form.values.content}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              aria-invalid={Boolean(
                form.touched.content && form.errors.content,
              )}
              aria-describedby="content-error"
            />
            <span
              {...{ name: "content" }}
              id="content-error"
              className={css.error}
              aria-live="polite"
            >
              {form.touched.content ? form.errors.content : ""}
            </span>
          </div>

          <div className={css.formGroup}>
            <label htmlFor="tag">Tag</label>
            <select
              id="tag"
              name="tag"
              className={css.select}
              value={form.values.tag}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              aria-invalid={Boolean(form.touched.tag && form.errors.tag)}
              aria-describedby="tag-error"
            >
              {tags.map((tag) => (
                <option value={tag} key={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <span
              {...{ name: "tag" }}
              id="tag-error"
              className={css.error}
              aria-live="polite"
            >
              {form.touched.tag && typeof form.errors.tag === "string"
                ? form.errors.tag
                : ""}
            </span>
          </div>

          {errorMessage && (
            <p className={css.error} role="alert">
              {errorMessage}
            </p>
          )}

          <div className={css.actions}>
            <button
              type="button"
              className={css.cancelButton}
              onClick={onCancel}
              disabled={isSaving || form.isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={css.submitButton}
              disabled={isSaving || form.isSubmitting}
            >
              {isSaving ? "Creating…" : "Create note"}
            </button>
          </div>
        </form>
      )}
    </Formik>
  );
}
