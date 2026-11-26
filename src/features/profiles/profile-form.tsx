"use client";

import { useActionState, useState } from "react";
import { idleAuthState } from "@/features/auth/auth-state";
import { AuthStatus } from "@/features/auth/auth-status";
import { saveProfile } from "./actions";
import type { ProfileContent } from "./profile-validation";

export function ProfileForm({
  profile,
  next,
}: {
  profile?: ProfileContent;
  next: string;
}) {
  const [state, submit, pending] = useActionState(saveProfile, idleAuthState);
  const [values, setValues] = useState({
    display_name: profile?.display_name ?? "",
    username: profile?.username ?? "",
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    skills: profile?.skills.join(", ") ?? "",
    interests: profile?.interests.join(", ") ?? "",
  });

  function bindField(field: keyof typeof values) {
    return {
      id: field,
      name: field,
      value: values[field],
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => {
        const value = event.currentTarget.value;
        setValues((current) => ({ ...current, [field]: value }));
      },
    };
  }

  return (
    <form action={submit} className="form-stack">
      <input type="hidden" name="next" value={next} />
      <AuthStatus state={state} />
      <fieldset className="form-stack" disabled={pending}>
        <div className="form-field">
          <label htmlFor="display_name">Display name</label>
          <input
            {...bindField("display_name")}
            autoComplete="nickname"
            minLength={2}
            maxLength={60}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="username">Username</label>
          <input
            {...bindField("username")}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_]{3,24}"
            aria-describedby="username-hint"
            required
          />
          <span id="username-hint" className="field-hint">
            3–24 letters, numbers, or underscores.
          </span>
        </div>
        <div className="form-field">
          <label htmlFor="headline">
            Headline <span className="optional">(optional)</span>
          </label>
          <input
            {...bindField("headline")}
            maxLength={100}
            placeholder="e.g. Designer interested in accessible tech"
          />
        </div>
        <div className="form-field">
          <label htmlFor="bio">
            Bio <span className="optional">(optional)</span>
          </label>
          <textarea {...bindField("bio")} maxLength={400} rows={3} />
        </div>
        <div className="form-field">
          <label htmlFor="skills">
            Skills <span className="optional">(optional)</span>
          </label>
          <input
            {...bindField("skills")}
            maxLength={340}
            placeholder="e.g. Research, React, UX"
            aria-describedby="profile-tags-hint"
          />
        </div>
        <div className="form-field">
          <label htmlFor="interests">
            Interests <span className="optional">(optional)</span>
          </label>
          <input
            {...bindField("interests")}
            maxLength={340}
            placeholder="e.g. Education, sustainability"
            aria-describedby="profile-tags-hint"
          />
        </div>
        <p id="profile-tags-hint" className="field-hint">
          Separate items with commas. Add up to 10 skills and 10 interests.
        </p>
        <button className="button button-primary" type="submit">
          {pending ? "Saving…" : "Save profile"}
        </button>
      </fieldset>
    </form>
  );
}
