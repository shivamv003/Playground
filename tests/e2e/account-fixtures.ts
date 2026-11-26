import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const mailpitUrl = process.env.PLAYWRIGHT_MAILPIT_URL;

type InboxResult = { messages: { ID: string; Subject: string }[] };
type InboxMessage = { HTML: string };

export async function openAccountEmail(
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

export async function fillCredentials(
  page: Page,
  email: string,
  password: string,
) {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
}
