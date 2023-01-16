import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { content_type } from "media_types";

const PORT = 4507;

const PATHNAME_PREFIX = "/melhosseiny/daily-prophet-data/main";

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
      //response_body = await Deno.readFile(`.${pathname}`)
      response_body = (await fetch(url, {
        headers: {
          "Authorization": `token ${Deno.env.get("GITHUB_ACCESS_TOKEN")}`,
        },
      })).body;
    } catch (e) {
      console.log(e);
    }
  }

  return new Response(response_body, {
    status: 200,
    headers: new Headers({
      "content-type": content_type(pathname),
      "access-control-allow-origin": "*",
      "cache-control": "no-cache"
    })
  });
}, { port: PORT });
