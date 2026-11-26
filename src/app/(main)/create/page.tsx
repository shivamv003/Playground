import { PageIntro } from "@/components/page-intro";
import { ProblemDraftForm } from "@/features/discovery/problem-draft-form";

export const metadata = { title: "Post a problem" };

export default function CreatePage() {
  return (
    <>
      <PageIntro
        title="Post a problem"
        description="Draft an idea and show potential teammates where they can help."
      />
      <p className="notice">
        This is a preview. Publishing and saving drafts will be available in a
        later release.
      </p>
      <ProblemDraftForm />
    </>
  );
}
