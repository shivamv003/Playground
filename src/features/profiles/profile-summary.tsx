import type { ProfileContent } from "./profile-validation";

export function ProfileSummary({ profile }: { profile: ProfileContent }) {
  const {
    display_name: displayName,
    username,
    headline,
    bio,
    skills,
    interests,
  } = profile;

  return (
    <div className="profile-summary">
      <div className="profile-name">
        <span className="profile-avatar tone-peach" aria-hidden="true">
          {[...displayName][0].toLocaleUpperCase()}
        </span>
        <div>
          <h1>{displayName}</h1>
          <p>
            @{username}
            {headline && ` · ${headline}`}
          </p>
        </div>
      </div>
      {bio && <p className="profile-bio">{bio}</p>}
      <ProfileTags title="Skills" tags={skills} />
      <ProfileTags title="Interests" tags={interests} />
    </div>
  );
}

function ProfileTags({ title, tags }: { title: string; tags: string[] }) {
  if (tags.length === 0) return null;

  return (
    <section className="profile-tags">
      <h2>{title}</h2>
      <ul className="skills">
        {tags.map((tag, index) => (
          <li key={`${tag}-${index}`}>{tag}</li>
        ))}
      </ul>
    </section>
  );
}
