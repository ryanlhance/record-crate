// Prefix a public-folder path (e.g. "/covers/x.jpg") with the deploy base path so
// raw <img> tags resolve under GitHub Pages' /record-crate/ subpath. Next prepends
// basePath automatically for <Link>/router and next/image, but NOT for plain <img>.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetPath(path: string): string {
  if (!path || /^https?:\/\//.test(path)) return path;
  return `${BASE_PATH}${path}`;
}
