import { Bell } from "lucide-react";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";

export const metadata = { title: "Activity" };

export default function ActivityPage() {
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
        <h2>Activity is coming soon</h2>
        <p>Connection updates will appear here when requests launch.</p>
        <Link href="/explore" className="button button-outline">
          Explore problems
        </Link>
      </section>
    </>
  );
}
