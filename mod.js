import { serve } from "https://deno.land/std@0.115.1/http/server.ts";

const MEDIA_TYPES = {
  ".md": "text/markdown",
  ".html": "text/html",
  ".htm": "text/html",
  ".json": "application/json",
  ".map": "application/json",
  ".txt": "text/plain",
  ".ts": "text/typescript",
  ".tsx": "text/tsx",
  ".js": "application/javascript",
  ".jsx": "text/jsx",
  ".gz": "application/gzip",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".mjs": "application/javascript",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".conf": "text/plain",
  ".list": "textplain",
  ".log": "text/plain",
  ".ini": "text/plain",
  ".vtt": "text/vtt",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
  ".mid": "audio/midi",
  ".midi": "audio/midi",
  ".mp3": "audio/mp3",
  ".mp4a": "audio/mp4",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".spx": "audio/ogg",
  ".opus": "audio/ogg",
  ".wav": "audio/wav",
  ".webm": "video/webm",
  ".aac": "audio/x-aac",
  ".flac": "audio/x-flac",
  ".mp4": "video/mp4",
  ".mp4v": "video/mp4",
  ".mkv": "video/x-matroska",
  ".mov": "video/quicktime",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".tiff": "image/tiff",
  ".psd": "image/vnd.adobe.photoshop",
  ".ico": "image/vnd.microsoft.icon",
  ".webp": "image/webp",
  ".es": "application/ecmascript",
  ".epub": "application/epub+zip",
  ".jar": "application/java-archive",
  ".war": "application/java-archive",
  ".webmanifest": "application/manifest+json",
  ".doc": "application/msword",
  ".dot": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".dotx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  ".cjs": "application/node",
  ".bin": "application/octet-stream",
  ".pkg": "application/octet-stream",
  ".dump": "application/octet-stream",
  ".exe": "application/octet-stream",
  ".deploy": "application/octet-stream",
  ".img": "application/octet-stream",
  ".msi": "application/octet-stream",
  ".pdf": "application/pdf",
  ".pgp": "application/pgp-encrypted",
  ".asc": "application/pgp-signature",
  ".sig": "application/pgp-signature",
  ".ai": "application/postscript",
  ".eps": "application/postscript",
  ".ps": "application/postscript",
  ".rdf": "application/rdf+xml",
  ".rss": "application/rss+xml",
  ".rtf": "application/rtf",
  ".apk": "application/vnd.android.package-archive",
  ".key": "application/vnd.apple.keynote",
  ".numbers": "application/vnd.apple.keynote",
  ".pages": "application/vnd.apple.pages",
  ".geo": "application/vnd.dynageo",
  ".gdoc": "application/vnd.google-apps.document",
  ".gslides": "application/vnd.google-apps.presentation",
  ".gsheet": "application/vnd.google-apps.spreadsheet",
  ".kml": "application/vnd.google-earth.kml+xml",
  ".mkz": "application/vnd.google-earth.kmz",
  ".icc": "application/vnd.iccprofile",
  ".icm": "application/vnd.iccprofile",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xlm": "application/vnd.ms-excel",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pot": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".potx":
    "application/vnd.openxmlformats-officedocument.presentationml.template",
  ".xps": "application/vnd.ms-xpsdocument",
  ".odc": "application/vnd.oasis.opendocument.chart",
  ".odb": "application/vnd.oasis.opendocument.database",
  ".odf": "application/vnd.oasis.opendocument.formula",
  ".odg": "application/vnd.oasis.opendocument.graphics",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".rar": "application/vnd.rar",
  ".unityweb": "application/vnd.unity",
  ".dmg": "application/x-apple-diskimage",
  ".bz": "application/x-bzip",
  ".crx": "application/x-chrome-extension",
  ".deb": "application/x-debian-package",
  ".php": "application/x-httpd-php",
  ".iso": "application/x-iso9660-image",
  ".sh": "application/x-sh",
  ".sql": "application/x-sql",
  ".srt": "application/x-subrip",
  ".xml": "application/xml",
  ".zip": "application/zip",
};

const PATHNAME_PREFIX = "/melhosseiny/daily-prophet-data/main";
const ext = (pathname) => `.${pathname.split(".").pop()}`;
const contentType = (pathname) => MEDIA_TYPES[ext(pathname)];

const find_note_in_index_by_id = (id, index) => {
  const note_meta = index.find(note => note.id === id);
  const note_index = index.findIndex(note => note.id === id);
  return [note_meta, note_index];
}

const paginate = ({
  after: cursor,
  page_size = 20,
  results,
  // can pass in a function to calculate an item's cursor
  get_cursor = () => null
}) => {
  if (page_size < 1) return [];

  if (!cursor) return results.slice(0, page_size);
  const cursor_index = results.findIndex(item => {
    // if an item has a `cursor` on it, use that, otherwise try to generate one
    let item_cursor = item.cursor ? item.cursor : get_cursor(item);
    // if there's still not a cursor, return false by default
    return item_cursor ? cursor === item_cursor : false;
  });

  console.log("paginate", cursor_index, page_size);

  return cursor_index >= 0
    ? cursor_index === results.length - 1 // don't let us overflow
      ? []
      : results.slice(
          cursor_index + 1,
          Math.min(results.length, cursor_index + 1 + page_size),
        )
    : results.slice(0, page_size);
}

const get_cursor = note => note.id;

serve(async (request) => {
  const { pathname, searchParams } = new URL(request.url);
  console.log(request.url);
  console.log(PATHNAME_PREFIX, pathname, import.meta.url);

  let response_body;

  if (pathname.endsWith("index.json")) {
    const page_size = Number(searchParams.get("page_size"));
    const after = searchParams.get("after");
    console.log(page_size, after);
    const indexText = await Deno.readTextFile("index.json");
    const index = JSON.parse(indexText);
    const notes = paginate({ after, page_size, results: index, get_cursor: (note) => note.id });
    const page = {
      notes,
      cursor: notes.length ? get_cursor(notes[notes.length - 1]) : null,
      // if the cursor at the end of the paginated results is the same as the
      // last item in _all_ results, then there are no more results after this
      has_more: notes.length
        ? get_cursor(notes[notes.length - 1]) !== get_cursor(index[index.length - 1])
        : false
    };
    response_body = JSON.stringify(page);
  } else {
    try {
      const url = new URL(PATHNAME_PREFIX + pathname, "https://raw.githubusercontent.com/");
      console.log(url.href);
      const res = await fetch(url, {
        headers: {
          "Authorization": `token ${Deno.env.get("GITHUB_ACCESS_TOKEN")}`,
        },
      });
      response_body = res.body;
    } catch (e) {
      console.log(e);
    }
  }

  return new Response(response_body, {
    status: 200,
    headers: new Headers({
      "content-type": contentType(pathname),
      "access-control-allow-origin": "*",
      "cache-control": "no-cache"
    })
  });
}, { addr: ":4507" });
