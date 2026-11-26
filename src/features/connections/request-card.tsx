import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import {
  changeRequest,
  revokeContact,
  shareContact,
} from "./connection-actions";
import type { ConnectionRequest, ContactShare } from "./connection-data";
import {
  contactLabels,
  requestLabels,
  type RequestStatus,
} from "./connection-validation";

export function RequestCard({
  request,
  shares,
  viewerId,
}: {
  request: ConnectionRequest;
  shares: ContactShare[];
  viewerId: string;
}) {
  const outgoing = request.sender_id === viewerId;
  const other = outgoing ? request.recipient : request.sender;
  const actions: { status: RequestStatus; label: string; primary?: boolean }[] =
    [];
  if (request.status === "pending") {
    if (outgoing)
      actions.push({ status: "cancelled", label: "Cancel request" });
    else
      actions.push(
        { status: "accepted", label: "Accept request", primary: true },
        { status: "declined", label: "Decline request" },
      );
  }
  if (request.status === "accepted")
    actions.push({ status: "disconnected", label: "Disconnect" });

  return (
    <article id={`request-${request.id}`} className="panel request-card">
      <div className="section-heading">
        <h3>
          {request.problem ? (
            <Link href={`/problems/${request.problem_id}`}>
              {request.problem.title}
            </Link>
          ) : (
            "Unavailable problem"
          )}
        </h3>
        <span className="sample-label">{requestLabels[request.status]}</span>
      </div>
      <p>
        {outgoing ? "To" : "From"}{" "}
        {other ? (
          <Link href={`/people/${other.username}`} className="text-link">
            {other.display_name}
          </Link>
        ) : (
          "an unavailable profile"
        )}
      </p>
      {request.message && (
        <p className="user-copy request-message">{request.message}</p>
      )}
      {request.status === "accepted" && (
        <div className="contact-sharing">
          <h4>Share contact details</h4>
          <p>
            Choose what to share with this person. Revoking removes access here,
            though they may already have copied the detail.
          </p>
          {shares.length > 0 && (
            <ul className="shared-details">
              {shares.map((share) => (
                <li key={`${share.owner_id}-${share.kind}`}>
                  <p className="user-copy">
                    <strong>{contactLabels[share.kind]}</strong> ·{" "}
                    {share.owner_id === viewerId
                      ? "Shared by you"
                      : "Shared with you"}
                    <br />
                    {share.value}
                  </p>
                  {share.owner_id === viewerId && (
                    <ActionForm
                      action={revokeContact.bind(null, request.id, share.kind)}
                      label={`Revoke ${contactLabels[share.kind]}`}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
          <ActionForm
            action={shareContact.bind(null, request.id)}
            label="Share contact detail"
          >
            <div className="form-field">
              <label htmlFor={`kind-${request.id}`}>Contact type</label>
              <select
                id={`kind-${request.id}`}
                name="kind"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Choose a contact type
                </option>
                {Object.entries(contactLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor={`value-${request.id}`}>Contact detail</label>
              <input
                id={`value-${request.id}`}
                name="value"
                required
                maxLength={300}
                autoComplete="off"
              />
            </div>
          </ActionForm>
        </div>
      )}
      {actions.length > 0 && (
        <div className="request-actions">
          {actions.map(({ status, label, primary }) => (
            <ActionForm
              key={status}
              action={changeRequest.bind(null, request.id)}
              label={label}
              primary={primary}
            >
              <input type="hidden" name="operation" value={status} />
            </ActionForm>
          ))}
        </div>
      )}
    </article>
  );
}
