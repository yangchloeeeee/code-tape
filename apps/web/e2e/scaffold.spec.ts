import { expect, test } from "@playwright/test";

test("recorder route renders Monaco with usable recorder controls", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "我的录制" })).toBeVisible();

  await page.getByRole("link", { name: "新建录制" }).click();
  await expect(page.locator("[data-code-editor] .monaco-editor")).toBeVisible();
  await expect(page.getByText(/CodeEditor scaffold/)).toHaveCount(0);
  await expect(page.getByText("待录制")).toBeVisible();
  await expect(page.getByText("00:00")).toBeVisible();
  await expect(page.getByText(/RecorderControls scaffold/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "开始录制" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "暂停录制" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "继续录制" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "停止录制" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "运行代码" })).toBeEnabled();

  await page.getByRole("button", { name: /Dark|Light/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", /light|dark/);
  expect(runtimeErrors.filter((message) => /monaco|worker/i.test(message))).toEqual([]);
});

test("missing replay id shows an explicit load error", async ({ page }) => {
  await page.goto("/replay/missing-recording", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/加载失败/)).toBeVisible();
  await expect(page.getByText(/incomplete-package/)).toBeVisible();
});
