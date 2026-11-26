# Database schema

`public.categories` is the initial production catalog. Each row has a UUID, unique slug and display name, and creation timestamp. The migration installs the initial catalog and enables row-level security. Anonymous and authenticated roles can select categories. Writes require a privileged role.

The website's sample problems are development fixtures and are separate from this catalog. Once live discovery is connected, render available categories from PostgreSQL. The problem and connection migrations extend this catalog with the live workflow.

Store contact shares separately from public profiles. Future policies must verify the connection, the participants, the current share grant, and block status before returning contact details.

## Profiles

`public.profiles` uses the Auth user ID as its primary key. It stores a unique lowercase username, display name, headline, bio, skills, and interests. The Auth user table holds email and credential information. Public profile reads never join it.

Creating or editing a profile requires an authenticated role whose user ID matches the row. Username uniqueness and field lengths are enforced in PostgreSQL. Skills and interests are currently bounded lists on the profile. A shared catalog can replace these lists when live discovery needs cross-profile matching.

## Problems and introductions

`public.problems` stores post content, the author and category references, collaboration preferences, and visibility. Public search indexes the title, description, and skills. Owners can edit their posts, close requests, and archive them. A moderator removal is separate from a user archive.

`public.connection_requests` stores the request and its authorized state. Here an accepted request is also the connection, so acceptance and connection creation are one state change. `public.contact_shares` stores each field by connection and owner. Granting access requires an accepted request. Revocation, disconnection, and blocking remove shares.

`public.activity_events` records private request updates. `public.blocks` is private to the user placing the block. `public.reports` is visible to the reporter and moderators. PostgreSQL functions validate state transitions, serialize changes between a pair, and use a private moderation membership table and per-user rate limits.
