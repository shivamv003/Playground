"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { z } from "zod";
import { problemDraftSchema } from "./problem-draft";
import { featuredCategories } from "./sample-problems";

type Draft = z.infer<typeof problemDraftSchema>;

export function ProblemDraftForm() {
  const [preview, setPreview] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const result = problemDraftSchema.safeParse(fields);
    setErrors(
      result.success ? [] : result.error.issues.map((issue) => issue.message),
    );
    setPreview(result.success ? result.data : null);
  }

  return (
    <div className="draft-layout">
      <form className="panel form-stack" onSubmit={handlePreview}>
        <div className="form-field">
          <label htmlFor="title">Problem title</label>
          <input
            id="title"
            name="title"
            placeholder="What would you like to solve?"
            required
            minLength={8}
            maxLength={100}
          />
        </div>
        <div className="form-field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows={5}
            placeholder="Describe the problem and who it affects."
            required
            minLength={20}
            maxLength={2000}
          />
        </div>
        <div className="form-field">
          <label htmlFor="draft-category">Category</label>
          <select id="draft-category" name="category" required defaultValue="">
            <option value="" disabled>
              Choose a category
            </option>
            {featuredCategories.map(({ name }) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="skills">
            Skills needed <span className="optional">(optional)</span>
          </label>
          <input
            id="skills"
            name="skills"
            placeholder="e.g. Research, UI/UX, Backend"
            maxLength={180}
          />
        </div>
        {errors.length > 0 && (
          <ul className="form-errors" role="alert">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
        <button className="button button-primary" type="submit">
          Preview problem <ArrowRight size={18} aria-hidden="true" />
        </button>
      </form>
      <section className="panel draft-preview" aria-labelledby="preview-title">
        <h2 id="preview-title">Draft preview</h2>
        <div aria-live="polite">
          {preview ? (
            <>
              <p className="sample-label">{preview.category}</p>
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
