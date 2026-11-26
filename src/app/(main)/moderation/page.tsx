import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { PageIntro } from "@/components/page-intro";
import { Pagination } from "@/components/pagination";
import { requireMember } from "@/features/auth/member";
import { reviewReport } from "@/features/moderation/report-actions";
import {
  reportReasons,
  type ReportReason,
} from "@/features/moderation/report-validation";
import { pageNumber } from "@/features/problems/pagination";

export const metadata = { title: "Moderation", robots: { index: false } };

type Report = {
  id: string;
  problem_id: string | null;
  reason: ReportReason;
  details: string;
  problem: { title: string } | null;
  person: { username: string; display_name: string } | null;
};
const pageSize = 12;

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = pageNumber((await searchParams).page);
  const { supabase } = await requireMember("/moderation", true);
  const access = await supabase.rpc("is_playground_moderator");
  if (access.error) throw new Error("Could not verify moderation access.");
  if (!access.data) notFound();

  const offset = (page - 1) * pageSize;
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id,problem_id,reason,details,problem:problems(title),person:profiles!reports_reported_user_id_fkey(username,display_name)",
    )
    .eq("status", "open")
    .order("created_at")
    .order("id")
    .range(offset, offset + pageSize)
    .overrideTypes<Report[], { merge: false }>();

  return (
    <>
      <PageIntro
        title="Moderation"
        description="Review open reports and take action on content that breaks Playground’s rules."
      />
      {error ? (
        <p className="notice form-error" role="alert">
          We couldn’t load the reports. Refresh the page to try again.
        </p>
      ) : !data?.length ? (
        <p className="panel">No open reports on this page.</p>
      ) : (
        <div className="activity-grid">
          {data.slice(0, pageSize).map((report) => (
            <article className="panel request-card" key={report.id}>
              <h2>
                {report.problem_id ? (
                  <Link href={`/problems/${report.problem_id}`}>
                    {report.problem?.title ?? "Reported problem"}
                  </Link>
                ) : report.person ? (
                  <Link href={`/people/${report.person.username}`}>
                    {report.person.display_name}
                  </Link>
                ) : (
                  "Reported profile"
                )}
              </h2>
              <p>
                <strong>{reportReasons[report.reason]}</strong>
              </p>
              {report.details && <p className="user-copy">{report.details}</p>}
              <ActionForm
                action={reviewReport.bind(null, report.id)}
                label="Review report"
              >
                <div className="form-field">
                  <label htmlFor={`decision-${report.id}`}>Decision</label>
                  <select
                    id={`decision-${report.id}`}
                    name="decision"
                    defaultValue=""
                    required
                  >
                    <option value="" disabled>
                      Choose a decision
                    </option>
                    <option value="dismissed">Dismiss report</option>
                    <option value="resolved">Mark reviewed</option>
                    {report.problem_id && (
                      <option value="remove_problem">Remove problem</option>
                    )}
                  </select>
                </div>
              </ActionForm>
            </article>
          ))}
        </div>
      )}
      {!error && (
        <Pagination
          page={page}
          hasNext={Boolean(data && data.length > pageSize && page < 1000)}
          getHref={(next) =>
            next === 1 ? "/moderation" : `/moderation?page=${next}`
          }
        />
      )}
    </>
  );
}
