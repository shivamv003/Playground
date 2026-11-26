import { Bell } from "lucide-react";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { PageIntro } from "@/components/page-intro";
import { Pagination } from "@/components/pagination";
import { withReturnPath } from "@/features/auth/return-path";
import { getViewerId } from "@/features/auth/viewer";
import { changeBlock } from "@/features/connections/connection-actions";
import {
  activityPageSize,
  describeActivity,
  listActivityEvents,
  listBlocks,
  listRequests,
  listShares,
} from "@/features/connections/connection-data";
import { RequestCard } from "@/features/connections/request-card";
import { pageNumber } from "@/features/problems/pagination";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Activity", robots: { index: false } };

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const viewerId = await getViewerId();
  const supabase = await createServerSupabaseClient({ readOnly: true });
  const page = pageNumber((await searchParams).page);

  if (!supabase || !viewerId) {
    return (
      <>
        <PageIntro
          title="Activity"
          description="Keep up with connection requests and replies."
        />
        <section className="empty-state">
          <div className="state-icon tone-peach">
            <Bell size={26} aria-hidden="true" />
          </div>
          <h2>
            {supabase
              ? "Log in to see your activity"
              : "Activity is unavailable in demo mode"}
          </h2>
          {supabase ? (
            <Link
              href={withReturnPath("/login", "/activity")}
              className="button button-primary"
            >
              Log in
            </Link>
          ) : (
            <Link href="/explore" className="button button-outline">
              Explore problems
            </Link>
          )}
        </section>
      </>
    );
  }

  const [requests, events, blocks] = await Promise.all([
    listRequests(supabase, page),
    listActivityEvents(supabase),
    listBlocks(supabase),
  ]);
  const visible = requests.data?.slice(0, activityPageSize) ?? [];
  const accepted = visible
    .filter(({ status }) => status === "accepted")
    .map(({ id }) => id);
  const shares = await listShares(supabase, accepted);

  return (
    <>
      <PageIntro
        title="Activity"
        description="Keep up with connection requests and replies."
      />
      {(requests.error || events.error || blocks.error || shares.error) && (
        <p className="notice form-error" role="alert">
          Some activity couldn’t load. Refresh the page to try again.
        </p>
      )}
      {page === 1 && Boolean(events.data?.length) && (
        <section
          className="panel recent-activity"
          aria-labelledby="recent-activity"
        >
          <h2 id="recent-activity">Recent updates</h2>
          <ul>
            {events.data?.map((event) => (
              <li key={event.id}>
                {visible.some(({ id }) => id === event.request_id) ? (
                  <Link
                    className="text-link"
                    href={`#request-${event.request_id}`}
                  >
                    {describeActivity(event)}
                  </Link>
                ) : (
                  describeActivity(event)
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {(["Incoming requests", "Outgoing requests"] as const).map(
        (title, index) => {
          const group = visible.filter(
            (request) => (request.recipient_id === viewerId) === (index === 0),
          );
          return (
            <section
              className="activity-section"
              key={title}
              aria-labelledby={`requests-${index}`}
            >
              <h2 id={`requests-${index}`}>{title}</h2>
              {group.length ? (
                <div className="activity-grid">
                  {group.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      viewerId={viewerId}
                      shares={
                        shares.data?.filter(
                          ({ request_id }) => request_id === request.id,
                        ) ?? []
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="panel">
                  No {index === 0 ? "incoming" : "outgoing"} requests on this
                  page.
                </p>
              )}
            </section>
          );
        },
      )}
      <Pagination
        page={page}
        hasNext={Boolean(
          requests.data &&
          requests.data.length > activityPageSize &&
          page < 1000,
        )}
        getHref={(next) =>
          next === 1 ? "/activity" : `/activity?page=${next}`
        }
      />
      {page === 1 && Boolean(blocks.data?.length) && (
        <section
          className="panel recent-activity"
          aria-labelledby="blocked-people"
        >
          <h2 id="blocked-people">Recently blocked people</h2>
          <ul className="shared-details">
            {blocks.data?.map((block) => (
              <li key={block.blocked_id}>
                {block.person ? (
                  <Link
                    href={`/people/${block.person.username}`}
                    className="text-link"
                  >
                    {block.person.display_name}
                  </Link>
                ) : (
                  "Unavailable profile"
                )}
                <ActionForm
                  action={changeBlock.bind(
                    null,
                    block.blocked_id,
                    false,
                    "/activity",
                  )}
                  label="Unblock person"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
