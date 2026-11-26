"use client";

import { ArrowRight } from "lucide-react";
import { useActionState, useRef, useState, type FormEvent } from "react";
import { idleAuthState } from "@/features/auth/auth-state";
import { AuthStatus } from "@/features/auth/auth-status";
import type { ProblemCategory } from "./problem-data";
import { saveProblem } from "./problem-actions";
import {
  blankProblem,
  collaborationModes,
  compensationTypes,
  experienceLevels,
  problemDraftSchema,
  purposes,
  type ProblemDraft,
} from "./problem-validation";

export function ProblemForm({
  categories,
  initial = blankProblem,
  id = null,
  demo = false,
}: {
  categories: ProblemCategory[];
  initial?: ProblemDraft;
  id?: string | null;
  demo?: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(initial);
  const [preview, setPreview] = useState<ProblemDraft | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [state, submit, pending] = useActionState(
    saveProblem.bind(null, id),
    idleAuthState,
  );

  function field(key: keyof ProblemDraft) {
    return {
      id: key,
      name: key,
      value: values[key],
      onChange: (
        event: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => {
        const value = event.currentTarget.value;
        setValues((current) => ({ ...current, [key]: value }));
      },
    };
  }

  function showPreview() {
    if (!form.current?.reportValidity()) return;
    const result = problemDraftSchema.safeParse(
      Object.fromEntries(new FormData(form.current)),
    );
    setPreview(result.success ? result.data : null);
    setPreviewError(result.success ? "" : result.error.issues[0].message);
  }

  function previewDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    showPreview();
  }

  return (
    <div className="draft-layout">
      <form
        className="panel form-stack"
        ref={form}
        action={demo ? undefined : submit}
        onSubmit={demo ? previewDemo : undefined}
      >
        <AuthStatus state={state} />
        {previewError && (
          <p className="notice form-error" role="alert">
            {previewError}
          </p>
        )}
        <fieldset className="form-stack" disabled={pending}>
          <div className="form-field">
            <label htmlFor="title">Problem title / idea title</label>
            <input
              {...field("title")}
              placeholder="What would you like to solve?"
              required
              minLength={8}
              maxLength={100}
            />
          </div>
          <div className="form-field">
            <label htmlFor="description">Description</label>
            <textarea
              {...field("description")}
              rows={5}
              placeholder="Describe the problem and who it affects."
              required
              minLength={20}
              maxLength={2000}
            />
          </div>
          <div className="form-field">
            <label htmlFor="category_id">Category</label>
            <select {...field("category_id")} required>
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map(({ id: value, name }) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="skills">
              Skills needed <span className="optional">(optional)</span>
            </label>
            <input
              {...field("skills")}
              placeholder="e.g. Research, UI/UX, Backend"
              maxLength={180}
            />
          </div>
          <details className="form-details">
            <summary>Optional collaboration details</summary>
            <div className="form-stack">
              <div className="form-field">
                <label htmlFor="motivation">Why it matters</label>
                <textarea {...field("motivation")} rows={3} maxLength={1000} />
              </div>
              <div className="form-field">
                <label htmlFor="approach">Proposed approach</label>
                <textarea {...field("approach")} rows={3} maxLength={1000} />
              </div>
              <div className="form-field">
                <label htmlFor="commitment">Time commitment</label>
                <input
                  {...field("commitment")}
                  maxLength={100}
                  placeholder="e.g. Two hours on weekends"
                />
              </div>
              {(
                [
                  { key: "purpose", label: "Purpose", options: purposes },
                  {
                    key: "collaboration_mode",
                    label: "Work arrangement",
                    options: collaborationModes,
                  },
                  {
                    key: "experience",
                    label: "Experience",
                    options: experienceLevels,
                  },
                  {
                    key: "compensation",
                    label: "Compensation",
                    options: compensationTypes,
                  },
                ] as const
              ).map(({ key, label, options }) => (
                <div className="form-field" key={key}>
                  <label htmlFor={key}>{label}</label>
                  <select {...field(key)}>
                    {options.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </details>
          <div className="profile-actions">
            <button
              className={`button ${demo ? "button-primary" : "button-outline"}`}
              type={demo ? "submit" : "button"}
              onClick={demo ? undefined : showPreview}
            >
              Preview problem <ArrowRight size={18} aria-hidden="true" />
            </button>
            {!demo && (
              <button className="button button-primary" type="submit">
                {pending ? "Saving…" : id ? "Save changes" : "Publish problem"}
              </button>
            )}
          </div>
        </fieldset>
      </form>
      <section className="panel draft-preview" aria-labelledby="preview-title">
        <h2 id="preview-title">Draft preview</h2>
        <div aria-live="polite">
          {preview ? (
            <>
              <p className="sample-label">
                {
                  categories.find(
                    ({ id: categoryId }) => categoryId === preview.category_id,
                  )?.name
                }
              </p>
              <h3>{preview.title}</h3>
              <p className="draft-description">{preview.description}</p>
              {preview.skills && (
                <p>
                  <strong>Skills needed</strong>
                  <br />
                  {preview.skills}
                </p>
              )}
            </>
          ) : (
            <p>Fill out the form to see how your problem will read.</p>
          )}
        </div>
      </section>
    </div>
  );
}
