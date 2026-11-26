import { randomUUID } from "node:crypto";
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

const mailpitUrl = process.env.PLAYWRIGHT_MAILPIT_URL;
const problemPath = "/problems/campus-food-waste";
test.use({ trace: "off" });

type InboxResult = { messages: { ID: string; Subject: string }[] };
type InboxMessage = { HTML: string };

async function openAccountEmail(
  request: APIRequestContext,
  page: Page,
  email: string,
  subject: string,
) {
  if (!mailpitUrl)
    throw new Error("Set PLAYWRIGHT_MAILPIT_URL to run the account tests.");

  const search = new URL("/api/v1/search", mailpitUrl);
  search.searchParams.set("query", `to:${email}`);
  let messageId: string | undefined;

  await expect
    .poll(
      async () => {
        const response = await request.get(search.href);
        if (!response.ok()) return false;
        const { messages } = (await response.json()) as InboxResult;
        messageId = messages?.find(
          (message) => message.Subject === subject,
        )?.ID;
        return Boolean(messageId);
      },
      {
        message: `Expected a local email with subject "${subject}"`,
        timeout: 12_000,
      },
    )
    .toBe(true);

  const response = await request.get(
    new URL(`/api/v1/message/${messageId}`, mailpitUrl).href,
  );
  const { HTML } = (await response.json()) as InboxMessage;
  const link = HTML.match(/href="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&");
  if (!link)
    throw new Error("The local account email did not contain an action link.");

  const origin = new URL(page.url()).origin;
  if (new URL(link).origin !== origin)
    throw new Error("The account email points outside the local test app.");

  // Browser diagnostics for these URLs can contain a one-time token.
  try {
    await page.goto(link);
  } catch {
    throw new Error("The local account email link did not open.");
  }
}

async function fillCredentials(page: Page, email: string, password: string) {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
}

test.describe("Supabase accounts", () => {
  test.skip(
    !mailpitUrl,
    "Set PLAYWRIGHT_MAILPIT_URL to a local Mailpit inbox.",
  );
  test("a guest confirms email, saves a public profile, and returns to the same problem", async ({
    page,
    browser,
    request,
  }) => {
    const unique = randomUUID().slice(0, 8);
    const email = `builder-${unique}@example.com`;
    const password = `Test-login-${randomUUID()}`;
    const newPassword = `Test-reset-${randomUUID()}`;
    const username = `builder_${unique}`;

    await page.goto(problemPath);
    await page
      .getByRole("link", { name: "Create a profile", exact: true })
      .click();
    await fillCredentials(page, email, password);
    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("status")).toHaveText(/Check your inbox/);

    await page.getByRole("link", { name: "Log in", exact: true }).click();
    await fillCredentials(page, email, password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      /Confirm your email/,
    );

    // The confirmation must work even in a browser without the signup cookies.
    const freshContext = await browser.newContext();
    try {
      const builder = await freshContext.newPage();
      await builder.goto(new URL(problemPath, page.url()).href);
      await openAccountEmail(
        request,
        builder,
        email,
        "Confirm your Playground account",
      );
      await builder
        .getByRole("button", { name: "Confirm email", exact: true })
        .click();
      await expect(
        builder.getByRole("heading", { name: "Set up your profile" }),
      ).toBeVisible();
      await builder.getByLabel("Display name").fill("Avery Builder");
      await builder.getByLabel("Username").fill(username.toUpperCase());
      await builder.getByLabel("Skills").fill("React, Research, react");
      await builder.getByLabel("Interests").fill("Education");
      await builder.getByRole("button", { name: "Save profile" }).click();
      await expect(
        builder.getByRole("heading", {
          name: "Give campus leftovers a second life",
        }),
      ).toBeVisible();
      expect(new URL(builder.url()).pathname).toBe(problemPath);

      await builder.reload();
      const cookies = await freshContext.cookies();
      expect(
        cookies.some(
          ({ name, httpOnly }) => name.startsWith("pg-session") && httpOnly,
        ),
      ).toBe(true);
      await builder
        .getByRole("link", { name: "Your profile", exact: true })
        .click();
      await expect(
        builder.getByRole("heading", { name: "Avery Builder" }),
      ).toBeVisible();
      await expect(builder.getByText("React", { exact: true })).toHaveCount(1);
      await builder.getByRole("link", { name: "Edit profile" }).click();
      await builder
        .getByLabel("Headline")
        .fill("Learning by building with others");
      await builder.getByRole("button", { name: "Save profile" }).click();
      await expect(
        builder.getByText(/Learning by building with others/),
      ).toBeVisible();

      await page.goto(`/people/${username}`);
      await expect(
        page.getByRole("heading", { name: "Avery Builder" }),
      ).toBeVisible();
      await expect(page.getByText(email, { exact: true })).toHaveCount(0);
      await builder.getByRole("button", { name: "Log out" }).click();
      await expect(
        builder.getByRole("link", { name: "Join Playground", exact: true }),
      ).toBeVisible();
      await builder.goto(new URL("/profile/edit", page.url()).href);
      await expect(
        builder.getByRole("heading", { name: "Welcome back" }),
      ).toBeVisible();
      await builder
        .getByRole("link", { name: "Forgot your password?" })
        .click();
      await builder.getByLabel("Email", { exact: true }).fill(email);
      await builder.getByRole("button", { name: "Send reset link" }).click();
      await expect(builder.getByRole("status")).toHaveText(
        /If an account exists/,
      );
      await openAccountEmail(
        request,
        builder,
        email,
        "Reset your Playground password",
      );
      await builder
        .getByLabel("New password", { exact: true })
        .fill(newPassword);
      await builder.getByLabel("Confirm new password").fill(newPassword);
      await builder.getByRole("button", { name: "Update password" }).click();
      await expect(builder.getByRole("status")).toHaveText(/Password updated/);

      await fillCredentials(builder, email, password);
      await builder
        .getByRole("button", { name: "Log in", exact: true })
        .click();
      await expect(builder.getByRole("main").getByRole("alert")).toHaveText(
        /couldn’t log you in/,
      );
      await fillCredentials(builder, email, newPassword);
      await builder
        .getByRole("button", { name: "Log in", exact: true })
        .click();
      await expect(
        builder.getByRole("heading", { name: "Edit your profile" }),
      ).toBeVisible();
    } finally {
      await freshContext.close();
    }
  });
});

test("sign-up only carries approved return paths", async ({ page }) => {
  await page.goto("/signup?next=%2F%2Fexample.com");
  await expect(page.locator('input[name="next"]')).toHaveValue("/");
  await page.goto("/signup?next=%2Fauth%2Fcallback");
  await expect(page.locator('input[name="next"]')).toHaveValue("/");
  await page.goto("/signup?next=%2Fexplore%3Fq%3Ddesign");
  await expect(page.locator('input[name="next"]')).toHaveValue(
    "/explore?q=design",
  );
});
