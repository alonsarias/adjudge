export function isAdLibraryUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const path = url.pathname.toLowerCase();
    return (
      (host === "facebook.com" || host.endsWith(".facebook.com")) &&
      path.includes("/ads/library")
    );
  } catch {
    return false;
  }
}
