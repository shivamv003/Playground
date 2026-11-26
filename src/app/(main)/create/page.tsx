import { PageIntro } from "@/components/page-intro";
import { requireMember } from "@/features/auth/member";
import { featuredCategories } from "@/features/discovery/sample-problems";
import { listCategories } from "@/features/problems/problem-data";
import { ProblemForm } from "@/features/problems/problem-form";
import { readSupabaseConfig } from "@/lib/supabase/config";

export const metadata = { title: "Post a problem" };

export default async function CreatePage() {
  const demo = !readSupabaseConfig();
  const categories = demo
    ? featuredCategories.map(({ name, slug }) => ({ id: slug, name, slug }))
    : (await listCategories((await requireMember("/create", true)).supabase))
        .data;

  return (
    <>
      <PageIntro
        title="Post a problem"
        description="Share an idea and show potential teammates where they can help."
      />
      {demo && (
        <p className="notice">
          This is a preview. Connect Supabase to publish problems.
        </p>
      )}
      {categories?.length ? (
        <ProblemForm categories={categories} demo={demo} />
      ) : (
        <p className="notice form-error" role="alert">
          We couldn’t load the categories. Refresh the page to try again.
        </p>
      )}
    </>
  );
}
