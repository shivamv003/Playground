import { expect, test } from "@playwright/test";

test("a guest can discover problems and open a shareable sample", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Great ideas deserve the right people.",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Sustainability", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Explore problems" }),
  ).toBeVisible();
  if (await page.getByText("Sample problems", { exact: true }).isVisible()) {
    await expect(page.getByRole("article")).toHaveCount(1);
  }
  await page.goto("/problems/campus-food-waste");
  await expect(
    page.getByRole("heading", { name: "Give campus leftovers a second life" }),
  ).toBeVisible();
  await expect(page.getByText("Sample problem", { exact: true })).toBeVisible();
});

test("guest search supports clearing empty results", async ({ page }) => {
  await page.goto("/explore");
  const query = page.getByRole("textbox", {
    name: "Search by problem or skill",
  });
  const submit = page.getByRole("button", { name: "Search", exact: true });

  if (await page.getByText("Sample problems", { exact: true }).isVisible()) {
    await query.fill("mapping");
    await submit.click();
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Map a more accessible city" }),
    ).toBeVisible();
  }

  await query.fill("nothing should match this query 31c3bc");
  await submit.click();
  await expect(
    page.getByRole("heading", { name: "No problems found" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Clear search" }).click();
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
});

test("mobile navigation opens the create and activity screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const navigation = page.getByRole("navigation", {
    name: "Mobile navigation",
  });
  await expect(navigation).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeHidden();
  await expect(page.locator("html")).toHaveJSProperty("scrollWidth", 390);
  const demo = await page
    .getByText("Sample problems", { exact: true })
    .isVisible();
  await navigation.getByRole("link", { name: "Create" }).click();

  if (!demo) {
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    expect(new URL(page.url()).searchParams.get("next")).toBe("/create");
    await page.getByRole("link", { name: "Enter as a guest" }).click();
  } else {
    await page
      .getByLabel("Problem title / idea title", { exact: true })
      .fill("Open a community repair café");
    await page
      .getByLabel("Description")
      .fill("Help neighbors learn how to repair household electronics.");
    await page
      .getByLabel("Category", { exact: true })
      .selectOption("education");
    await page.getByRole("button", { name: "Preview problem" }).click();
    await expect(
      page.getByRole("heading", { name: "Open a community repair café" }),
    ).toBeVisible();
    await expect(page.getByText(/This is a preview/)).toBeVisible();
  }

  await navigation.getByRole("link", { name: "Activity" }).click();
  await expect(
    page.getByRole("heading", { name: "Activity", exact: true }),
  ).toBeVisible();
  await navigation.getByRole("link", { name: "Me", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your profile", exact: true }),
  ).toBeVisible();
});

test("account screens preserve guest browsing", async ({ page }) => {
  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: "Join Playground" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create an account" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Log in" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Enter as a guest", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Explore problems" }),
  ).toBeVisible();
});
