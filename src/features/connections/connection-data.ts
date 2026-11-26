import type { PlaygroundSupabaseClient } from "@/lib/supabase/server";
import type { ContactKind, RequestStatus } from "./connection-validation";

type Person = { id: string; username: string; display_name: string };
export type ConnectionRequest = {
  id: string;
  problem_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  status: RequestStatus;
  updated_at: string;
  problem: { title: string } | null;
  sender: Person | null;
  recipient: Person | null;
};

export type ContactShare = {
  request_id: string;
  owner_id: string;
  kind: ContactKind;
  value: string;
};

const activityKinds = {
  incoming: "You received a connection request",
  accepted: "Your connection request was accepted",
  declined: "Your connection request was declined",
  contact_shared: "A connection shared a contact detail",
} as const;

type ActivityEvent = {
  id: string;
  request_id: string;
  kind: keyof typeof activityKinds;
  created_at: string;
};

type Block = { blocked_id: string; person: Person | null };

const requestFields =
  "id,problem_id,sender_id,recipient_id,message,status,updated_at,problem:problems(title),sender:profiles!connection_requests_sender_id_fkey(id,username,display_name),recipient:profiles!connection_requests_recipient_id_fkey(id,username,display_name)";
export const activityPageSize = 12;

export function listRequests(supabase: PlaygroundSupabaseClient, page: number) {
  const offset = (page - 1) * activityPageSize;
  return supabase
    .from("connection_requests")
    .select(requestFields)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + activityPageSize)
    .overrideTypes<ConnectionRequest[], { merge: false }>();
}

export function listActivityEvents(supabase: PlaygroundSupabaseClient) {
  return supabase
    .from("activity_events")
    .select("id,request_id,kind,created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(10)
    .overrideTypes<ActivityEvent[], { merge: false }>();
}

export function listShares(
  supabase: PlaygroundSupabaseClient,
  requestIds: string[],
) {
  if (!requestIds.length) return { data: [] as ContactShare[], error: null };
  return supabase
    .from("contact_shares")
    .select("request_id,owner_id,kind,value")
    .in("request_id", requestIds)
    .order("kind")
    .overrideTypes<ContactShare[], { merge: false }>();
}

export function listBlocks(supabase: PlaygroundSupabaseClient) {
  return supabase
    .from("blocks")
    .select(
      "blocked_id,person:profiles!blocks_blocked_id_fkey(id,username,display_name)",
    )
    .order("created_at", { ascending: false })
    .limit(20)
    .overrideTypes<Block[], { merge: false }>();
}

export function findOwnBlock(
  supabase: PlaygroundSupabaseClient,
  userId: string,
) {
  return supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocked_id", userId)
    .maybeSingle();
}

export function findLatestRequest(
  supabase: PlaygroundSupabaseClient,
  problemId: string,
  viewerId: string,
) {
  const retryCutoff = new Date(Date.now() - 86_400_000).toISOString();
  return supabase
    .from("connection_requests")
    .select("status,created_at")
    .eq("problem_id", problemId)
    .eq("sender_id", viewerId)
    .or(`status.in.(pending,accepted),created_at.gt.${retryCutoff}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .overrideTypes<
      { status: RequestStatus; created_at: string },
      { merge: false }
    >();
}

export function describeActivity(event: ActivityEvent) {
  return activityKinds[event.kind];
}
