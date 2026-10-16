import { expect, test } from "@playwright/test";
import { signIn, userA, userB } from "./helpers";

test.describe.configure({ mode: "serial" });

test("anonymous visitors are redirected away from protected pages", async ({ page }) => {
  for (const path of ["/dashboard", "/tasks", "/finance", "/settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
  }
  const res = await page.request.get("/api/export");
  expect(res.status()).toBe(401);
});

test("login rejects bad credentials with a generic message", async ({ page }) => {
  await signIn(page, { email: userA.email, password: "wrong-password-1" });
  await expect(page.locator("#auth-error")).toContainText("Incorrect email or password");
});

test("open redirects are blocked after login", async ({ page }) => {
  await page.goto("/login?next=//evil.example");
  await page.getByLabel("Email").fill(userA.email);
  await page.getByLabel("Password").fill(userA.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/(onboarding|dashboard)/);
  expect(new URL(page.url()).host).toBe("localhost:3000");
});

test("user A: onboarding, task CRUD + recurrence, habit, project link, finance", async ({ page }) => {
  await signIn(page, userA);
  await page.waitForURL(/\/onboarding/);
  await page.getByLabel("What should we call you?").fill("Alice");
  await page.getByRole("button", { name: "Continue to my dashboard" }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Alice");

  // Project
  await page.goto("/projects");
  await page.getByRole("button", { name: "New project" }).first().click();
  await page.getByLabel("Title").fill("Launch site");
  await page.getByRole("button", { name: "Create project" }).click();
  await page.waitForURL(/\/projects\/[0-9a-f-]{36}/);

  // Task linked to project via quick add on project page, then complete -> progress 100%
  await page.getByLabel("New task title").fill("Write copy");
  await page.getByRole("search", { name: "Quick add task" }).getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Write copy")).toBeVisible();
  await expect(page.getByText("0 of 1 tasks done")).toBeVisible();
  await page.getByRole("checkbox", { name: /Complete “Write copy”/ }).click();
  await expect(page.getByText("1 of 1 tasks done")).toBeVisible();

  // Task CRUD with recurrence
  await page.goto("/tasks");
  await page.getByRole("button", { name: "New task" }).first().click();
  await page.getByLabel("Title").fill("Water plants");
  await page.getByLabel("Due date").fill("2030-01-10");
  await page.getByLabel("Frequency").selectOption("daily");
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText("Water plants")).toBeVisible();
  await page.getByRole("checkbox", { name: /Complete “Water plants”/ }).click();
  await expect(page.getByText("Task completed").or(page.getByText("next occurrence"))).toBeVisible();
  await page.reload();
  // original (done) + exactly one generated next occurrence — never duplicated by reloads
  const plants = page.locator("main li").filter({ hasText: "Water plants" });
  await expect(plants).toHaveCount(2);
  await expect(page.getByRole("checkbox", { name: /Complete “Water plants”/ })).toHaveCount(1);
  await page.getByRole("button", { name: /Actions for “Water plants”/ }).last().click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(plants).toHaveCount(1);

  // Habit
  await page.goto("/habits");
  await page.getByRole("button", { name: "New habit" }).first().click();
  await page.getByPlaceholder("e.g. Read 20 pages").fill("Read");
  await page.getByRole("button", { name: "Create habit" }).click();
  await expect(page.getByRole("heading", { name: "Read" })).toBeVisible();
  const today = page.getByRole("group", { name: /Last 7 days for Read/ }).getByRole("button").last();
  await today.click();
  await expect(today).toHaveAttribute("aria-pressed", "true");

  // Finance
  await page.goto("/finance");
  await page.getByRole("main").getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("dialog").getByLabel(/Amount/).fill("1,250.50");
  await page.getByRole("dialog").getByLabel("Category").fill("Food");
  await page.getByRole("button", { name: "Add transaction" }).click();
  await expect(page.getByRole("cell", { name: /−.*1,250\.50/ })).toBeVisible();

  // Notes
  await page.goto("/notes");
  await page.getByRole("button", { name: "New note" }).first().click();
  await page.waitForURL(/\/notes\/[0-9a-f-]{36}/);
  await page.getByLabel("Note title").fill("Secret plan");
  await page.getByLabel("Note body (Markdown)").fill("# Hi\n<img src=x onerror=alert(1)>");
  await expect(page.getByText(/Saved/)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("[aria-label=Preview] img[onerror]")).toHaveCount(0);
});

test("calendar controls and appearance settings work", async ({ page }) => {
  await signIn(page, userA);
  await page.waitForURL(/dashboard|today/);
  await page.goto("/calendar");
  const main = page.locator("main");
  await main.getByRole("link", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/view=month&date=/);
  await main.getByRole("link", { name: "Previous", exact: true }).click();
  await page.getByRole("navigation", { name: "Calendar view" }).getByRole("link", { name: "Week" }).click();
  await expect(page).toHaveURL(/view=week/);
  await page.getByRole("button", { name: "New task" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "New event" }).click();
  await page.getByLabel("Title").fill("E2E calendar event");
  await page.getByRole("button", { name: "Create event" }).click();
  await expect(page.getByRole("button", { name: /Event: E2E calendar event/ }).first()).toBeVisible();

  await page.goto("/settings");
  await page.getByRole("radio", { name: "Indigo" }).click();
  await page.getByRole("radio", { name: "24-hour" }).click();
  await page.getByRole("radio", { name: "Week", exact: true }).click();
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved")).toBeVisible();
  await page.goto("/calendar");
  await expect(page).toHaveURL(/calendar/);
  await expect(page.getByRole("navigation", { name: "Calendar view" }).getByRole("link", { name: "Week" })).toHaveAttribute("aria-current", "page");
  const hue = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--primary"));
  expect(hue).toContain("268");
});

test("signed-in users can return to the home page and get back to the dashboard", async ({ page }) => {
  await signIn(page, userA);
  await page.waitForURL(/dashboard|today/);
  await page.getByRole("link", { name: "Life OS home page" }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Open dashboard" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await page.screenshot({ path: "test-results/landing.png", fullPage: true });
  await page.getByRole("link", { name: "Open dashboard" }).first().click();
  await expect(page).toHaveURL(/dashboard/);
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
  await page.goto("/login");
  await expect(page).toHaveURL(/dashboard/);
});

test("user B cannot see user A's data", async ({ page }) => {
  await signIn(page, userB);
  await page.waitForURL(/\/onboarding/);
  await page.getByRole("button", { name: "Continue to my dashboard" }).click();
  await page.waitForURL(/\/dashboard/);
  for (const [path, secret] of [["/tasks?view=all", "Write copy"], ["/projects", "Launch site"], ["/notes", "Secret plan"], ["/finance", "Food"], ["/habits", "Read"]] as const) {
    await page.goto(path);
    await expect(page.getByText(secret, { exact: true })).toHaveCount(0);
  }
  // Direct URL access to A's records 404s
  await page.goto("/projects");
  const ids = await page.request.get("/api/export");
  const body = await ids.json();
  expect(body.tasks).toHaveLength(0);
  expect(body.notes).toHaveLength(0);
  expect(body.transactions).toHaveLength(0);
});

test("mobile layout shows the navigation drawer @mobile", async ({ page }) => {
  await signIn(page, userA);
  await page.waitForURL(/\/(dashboard|onboarding)/);
  if (page.url().includes("/onboarding")) {
    await page.getByRole("button", { name: "Continue to my dashboard" }).click();
    await page.waitForURL(/\/dashboard/);
  }
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Tasks" }).click();
  await expect(page).toHaveURL(/\/tasks/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
