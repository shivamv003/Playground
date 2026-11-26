import { randomUUID } from "node:crypto";
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import {
  fillCredentials,
  mailpitUrl,
  openAccountEmail,
} from "./account-fixtures";

test.use({ trace: "off" });

async function signUpAndPublishProfile(
  page: Page,
  request: APIRequestContext,
  displayName: string,
) {
  await expect(
    page.getByRole("heading", { name: "Join Playground", exact: true }),
  ).toBeVisible();
  const key = randomUUID().slice(0, 8);
  const email = `live-${key}@example.com`;
  await fillCredentials(page, email, `Local-test-${randomUUID()}`);
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page.getByRole("status")).toHaveText(/Check your inbox/);
  await openAccountEmail(
    request,
    page,
    email,
    "Confirm your Playground account",
  );
  await page
    .getByRole("button", { name: "Confirm email", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Set up your profile" }),
  ).toBeVisible();
  await page.getByLabel("Display name").fill(displayName);
  await page.getByLabel("Username").fill(`live_${key}`);
  await page.getByRole("button", { name: "Save profile" }).click();
}

test("publish, discover, connect, share, report, and archive a live problem", async ({
  page: owner,
  browser,
  request,
  baseURL,
}) => {
  test.skip(
    !mailpitUrl,
    "Use a local Supabase stack and Mailpit for live problem tests.",
  );
  test.setTimeout(90_000);

  const readiness = await request.get("/health");
  expect(readiness.status()).toBe(200);
  expect(await readiness.json()).toEqual({ status: "ready" });

  const key = randomUUID().slice(0, 8);
  const title = `Build a neighborhood accessibility map ${key}`;
  const contact = `selected-${key}@example.com`;
  await owner.goto("/signup?next=%2Fcreate");
  await signUpAndPublishProfile(owner, request, "Neighborhood Organizer");
  await expect(
    owner.getByRole("heading", { name: "Post a problem" }),
  ).toBeVisible();
  await owner
    .getByLabel("Problem title / idea title", { exact: true })
    .fill(title);
  await owner
    .getByLabel("Description", { exact: true })
    .fill("Help neighbors record step-free entrances and accessible services.");
  await owner
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Accessibility" });
  await owner.getByLabel("Skills needed").fill(`Surveying ${key}, Design`);
  await owner.getByRole("button", { name: "Preview problem" }).click();
  await expect(
    owner.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await owner.getByRole("button", { name: "Publish problem" }).click();
  await expect(
    owner.getByRole("link", { name: "Manage problem" }),
  ).toBeVisible();
  const problemUrl = owner.url();
  expect(new URL(problemUrl).pathname).toMatch(/^\/problems\/[\da-f-]{36}$/);

  const builderContext = await browser.newContext({ baseURL });
  const guestContext = await browser.newContext({ baseURL });
  try {
    const builder = await builderContext.newPage();
    const guest = await guestContext.newPage();
    await guest.goto("/explore");
    await guest
      .getByRole("textbox", { name: "Search by problem or skill" })
      .fill(`Surveying ${key}`);
    await guest
      .getByLabel("Category", { exact: true })
      .selectOption("accessibility");
    await guest.getByRole("button", { name: "Search", exact: true }).click();
    await expect(
      guest.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await guest
      .getByRole("link", { name: `View problem: ${title}`, exact: true })
      .click();
    await expect(guest).toHaveURL(problemUrl);

    await builder.goto(problemUrl);
    await builder.getByRole("link", { name: "Log in to connect" }).click();
    await builder
      .getByRole("link", { name: "Join Playground", exact: true })
      .click();
    await signUpAndPublishProfile(builder, request, "Community Mapper");
    await expect(
      builder.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(builder).toHaveURL(problemUrl);
    await builder
      .getByLabel("Message", { exact: false })
      .fill("I can help test step-free routes.");
    await builder
      .getByRole("button", { name: "Send connection request" })
      .click();
    await expect(
      builder.getByText("Status: Pending", { exact: true }),
    ).toBeVisible();

    await owner.goto("/activity");
    const incoming = owner
      .getByRole("region", { name: "Incoming requests" })
      .getByRole("article")
      .filter({ hasText: title });
    await expect(
      incoming.getByText("I can help test step-free routes."),
    ).toBeVisible();
    await incoming.getByRole("button", { name: "Accept request" }).click();
    await expect(incoming.getByText("Accepted", { exact: true })).toBeVisible();
    await incoming.getByLabel("Contact type").selectOption("email");
    await incoming.getByLabel("Contact detail", { exact: true }).fill(contact);
    await incoming
      .getByRole("button", { name: "Share contact detail" })
      .click();
    await expect(incoming.getByText(contact, { exact: false })).toBeVisible();

    await builder.goto("/activity");
    await expect(builder.getByText(contact)).toBeVisible();
    await guest.goto("/activity");
    await expect(
      guest.getByRole("heading", { name: "Log in to see your activity" }),
    ).toBeVisible();
    await expect(guest.getByText(contact)).toHaveCount(0);

    await incoming.getByRole("button", { name: "Revoke Email" }).click();
    await expect(incoming.getByText(contact)).toHaveCount(0);
    await builder.reload();
    await expect(builder.getByText(contact)).toHaveCount(0);

    await builder.goto(problemUrl);
    const safety = builder.locator("details.safety-actions");
    await safety.getByText("Report or block").click();
    await safety.getByLabel("Report reason").selectOption("other");
    await safety
      .getByLabel("Details")
      .fill("Checking the report form with a local test account.");
    await safety.getByRole("button", { name: "Report problem" }).click();
    await expect(safety.getByRole("status")).toHaveText(
      "Report sent for review.",
    );

    await owner.goto(problemUrl + "/edit");
    await owner
      .getByLabel("Problem title / idea title", { exact: true })
      .fill(title + " updated");
    await owner.getByRole("button", { name: "Save changes" }).click();
    await expect(
      owner.getByRole("heading", { name: title + " updated", exact: true }),
    ).toBeVisible();
    await owner.getByRole("link", { name: "Manage problem" }).click();
    await owner.getByRole("button", { name: "Close requests" }).click();
    await expect(
      owner.getByText("Requests closed", { exact: true }),
    ).toBeVisible();
    await owner.getByRole("button", { name: "Archive problem" }).click();
    await expect(owner.getByText("Archived", { exact: true })).toBeVisible();
    await guest.goto(problemUrl);
    await expect(
      guest.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
  } finally {
    await Promise.all([builderContext.close(), guestContext.close()]);
  }
});
