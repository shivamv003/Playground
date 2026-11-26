import { ActionForm } from "@/components/action-form";
import { changeBlock } from "@/features/connections/connection-actions";
import { submitReport } from "./report-actions";
import { reportReasons, type ReportTarget } from "./report-validation";

export function SafetyActions({
  target,
  authorId,
  blocked,
  next,
}: {
  target: ReportTarget;
  authorId: string;
  blocked: boolean;
  next: string;
}) {
  const reasonId = `report-reason-${target.id}`;
  const detailsId = `report-details-${target.id}`;

  return (
    <details className="panel safety-actions">
      <summary>Report or block</summary>
      <ActionForm
        action={submitReport.bind(null, target, next)}
        label={target.kind === "problem" ? "Report problem" : "Report profile"}
      >
        <div className="form-field">
          <label htmlFor={reasonId}>Report reason</label>
          <select id={reasonId} name="reason" required defaultValue="">
            <option value="" disabled>
              Choose a reason
            </option>
            {Object.entries(reportReasons).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor={detailsId}>
            Details <span className="optional">(optional)</span>
          </label>
          <textarea id={detailsId} name="details" maxLength={500} rows={2} />
        </div>
      </ActionForm>
      <div className="safety-block">
        <p>
          {blocked
            ? "Unblocking allows new requests. Previous shares stay removed."
            : "Blocking ends current connections and removes contact shares between you."}
        </p>
        <ActionForm
          action={changeBlock.bind(null, authorId, !blocked, next)}
          label={blocked ? "Unblock person" : "Block person"}
        />
      </div>
    </details>
  );
}
