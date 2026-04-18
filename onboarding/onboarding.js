/**
 * Carbonlite — Onboarding Logic
 * Single-page welcome. Sets onboardingComplete and closes.
 * No innerHTML — Chrome MV3 CSP compliance.
 */

document.getElementById("btnGotIt").addEventListener("click", () => {
  chrome.storage.local.get("settings", (stored) => {
    const settings = stored.settings || {};
    settings.onboardingComplete = true;
    chrome.storage.local.set({ settings }, () => {
      window.close();
    });
  });
});
