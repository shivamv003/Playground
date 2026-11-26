# Database schema

`public.categories` is the initial production catalog. Each row has a UUID, unique slug and display name, and creation timestamp. The migration installs the initial catalog and enables row-level security. Anonymous and authenticated roles can select categories. Writes require a privileged role.

The website's sample problems are development fixtures and are separate from this catalog. Once live discovery is connected, render available categories from PostgreSQL. Add problem and connection tables through additional migrations, then generate TypeScript database types as the deployed schema grows.

Store contact shares separately from public profiles. Future policies must verify the connection, the participants, the current share grant, and block status before returning contact details.

## Profiles

`public.profiles` uses the Auth user ID as its primary key. It stores a unique lowercase username, display name, headline, bio, skills, and interests. The Auth user table holds email and credential information. Public profile reads never join it.

Creating or editing a profile requires an authenticated role whose user ID matches the row. Username uniqueness and field lengths are enforced in PostgreSQL. Skills and interests are currently bounded lists on the profile. A shared catalog can replace these lists when live discovery needs cross-profile matching.
