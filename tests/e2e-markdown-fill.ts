import type { Locator } from "@playwright/test";

/** Fill @uiw/react-md-editor or plain textarea inside a container (wizard / forms). */
export async function fillMarkdownEditor(root: Locator, text: string): Promise<void> {
  const ta = root.locator("textarea").first();
  if ((await ta.count()) > 0) {
    await ta.fill(text);
    return;
  }
  const rich = root.locator('[contenteditable="true"]').first();
  await rich.click();
  await rich.fill(text);
}
