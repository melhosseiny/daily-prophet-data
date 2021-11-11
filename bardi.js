import "https://unpkg.com/commonmark@0.30.0/dist/commonmark.js";
import { Transform } from "./transform.js";

//const ASSET_HOST = "http://localhost:4507";
const ASSET_HOST = "https://famous-trout-70.deno.dev";

const reader = new commonmark.Parser();
const writer = new commonmark.HtmlRenderer();

import jscheck from "https://raw.githubusercontent.com/melhosseiny/icarus/main/jscheck.js";

const jsc = jscheck();

console.log(Deno.args);

const [command, target] = [Deno.args[0], Deno.args[1]];
const slug = target ? target.endsWith(".md") ? target.replace(".md", '') : target : undefined;

const MAX_NOTES = 100;
const TOKEN_PER_TITLE = 5;
const TOKEN_PER_P = 100;
const P_PER_NOTE = 5;
const IMG_PER_NOTE = 3;
const TAG_PER_NOTE = 1;
const IMG_EXT = "png";
const title = () => Array(TOKEN_PER_TITLE).fill().map(i => jsc.string(jsc.integer(1, 8), jsc.character("aeiou"))()).join(' ');
const tokens = () => Array(TOKEN_PER_P).fill().map(i => jsc.string()());
const ps = Array(P_PER_NOTE).fill().map(i => tokens().join(' '));
const imgs = () => Array(IMG_PER_NOTE).fill().map(i => `kodim${(jsc.integer(1,18)()).toString().padStart(2, '0')}.${IMG_EXT}`);
const img_tags = () => imgs().map(img => `![](img/${img})`);
const tags = () => Array(TAG_PER_NOTE).fill().map(i => jsc.wun_of(["education", "environment", "immigration", "politics", "technology"])());
console.log(img_tags);
const text = (a, b) => `# ${title()}\n\n<wd-tags>${tags().map(t => `#${t}`).join(' ')}</wd-tags>\n\n${img_tags().join('\n\n')}\n\n${ps.join('\n\n')}`;
let index = [];

const transform = Transform();

const parse_markdown = function(markdown) {
  let parsed = reader.parse(markdown);
  var walker = parsed.walker();
  let event, node;
  let name, tags, img;
  let imgCount = 0;

  while ((event = walker.next())) {
    node = event.node;

    if (event.entering) {
      // console.log('imgCount', imgCount);
      const loading = imgCount > 0 ? "lazy" : "auto";
      switch (node.type) {
        case "heading":
          if (name === undefined) {
            name = node._firstChild.literal;
            console.log(node.type, node._firstChild.literal);
          }
          break;
        case "html_inline":
          if (node.literal === "<wd-tags>") {
            tags = node.next.literal.split(' ').map(tag => tag.substring(1));
            console.log(tags);
          }
          console.log(node.type, node.literal);
          break;
        case 'html_block':
          if (node._htmlBlockType !== 2) {
            if (node.literal.indexOf('img') !== -1) {
              transform.imgInHtmlBlock(node, loading, ASSET_HOST);
            } else if (node.literal.indexOf('video') !== -1) {
              transform.videoInHtmlBlock(node, loading, ASSET_HOST);
            }
            imgCount++;
          }
          break;
        case 'image':
          transform.imgNode(node, loading, ASSET_HOST);
          if (imgCount === 0) {
            const src_index = node.literal.indexOf("src=");
            const alt_index = node.literal.indexOf("\" alt");
            img = node.literal.substring(src_index + 5, alt_index);
          }
          imgCount++;
          break;
      }
    }
  }

  return [parsed, name, img, tags];
}

const find_note_in_index_by_id = async (slug) => {
  const index = JSON.parse(await Deno.readTextFile("index.json"));
  const note_meta = index.find(note => note.id === slug);
  const note_index = index.findIndex(note => note.id === slug);
  return [note_meta, note_index];
}

const index_note = async (slug, text) => {
  const [parsed, name, img, tags] = parse_markdown(text);
  await Deno.writeTextFile(`${slug}.html`, writer.render(parsed));

  index = JSON.parse(Deno.readTextFileSync("index.json"));

  const note = {
    id: slug,
    name,
    img,
    time: new Date(jsc.integer(0, new Date().getTime())()),
    tags
  }
  console.log(note);
  index.push(note);
  Deno.writeTextFileSync("index.json", JSON.stringify(index));
}

const remove_notes = () => {
  for (const entry of Deno.readDirSync('.')) {
    if (entry.name.endsWith(".md")) {
      //console.log(entry);
      Deno.removeSync(`./${entry.name}`);
    }
  }
}

const generate_and_index_notes = (n = 100) => {
  for (let i = 0; i < n; i++) {
    const content = text(i, i);
    const write = Deno.writeTextFileSync(`./note-${i}.md`, content);
    index_note(`note-${i}`, content);
  }
}

switch (command) {
  // index note-23.md a b c
  case "index":
    break;
  // remove note-27.md
  case "remove":
    index = JSON.parse(await Deno.readTextFile("index.json"));
    let [note_meta, note_index] = await find_note_in_index_by_id(slug);
    index.splice(note_index, 1);
    await Deno.remove(`./${slug}.md`);
    await Deno.writeTextFile("index.json", JSON.stringify(index));
    break;
  // gen 100
  case "gen":
    Deno.writeTextFileSync("index.json", JSON.stringify(index));
    remove_notes();
    generate_and_index_notes(target);
    break;
  case "sort":
    index = JSON.parse(await Deno.readTextFile("index.json"));
    index.sort((a, b) => new Date(b.time) - new Date(a.time));
    await Deno.writeTextFile("index.json", JSON.stringify(index));
}
