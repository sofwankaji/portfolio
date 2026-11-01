# Add a Portfolio Studio template from a reference

The user can ask an AI agent to turn a reference website into a reusable template. Templates are validated JSON, not executable code. Adding a template never changes the active website. Studio previews and applies it separately, saving a recovery version first.

1. Inspect the reference website with browsing and screenshots. Identify its spacing, content hierarchy, image treatment and navigation. Use an original interpretation with the owner’s content.
2. Read `packages/shared/template-kit.ts` and `examples/reference-studio.template.json`. Get the complete JSON Schema with `npm run template:schema` or `http://127.0.0.1:3001/api/templates/schema`.
3. Write a version 1 JSON file using existing node types. Use `bindings` to fill text and images from the current owner. Use `projects` nodes for the live collection; never copy the current work list into fixed cards. Image sources must refer to local assets, or use image bindings with `image: null`. A reference URL is attribution metadata; Studio does not fetch or execute the reference site.
4. Use unique section/node IDs and a unique template ID. Coordinates use a 1200-unit design width. Keep every node inside its section. Limit: 16 sections, 40 nodes per section, 200 nodes total, 512 KB.
5. Run `npm run template:check -- <file.json>`. Fix all validation errors. Import with `npm run template:import -- <file.json>`, or paste/upload JSON in **Studio → Template → + เพิ่ม Template**.
6. Open the Template library, check desktop and mobile, and verify bindings, button destinations and motion. Imported templates appear under **ของฉัน** without rebuilding or restarting. The user chooses **ใช้ Template** when ready.

Custom templates live in `.history/templates/<id>.json`; they remain local and are excluded from publishing. To share a template, provide its JSON file. The active design is saved in the profile and uses the existing Save/Push workflow. Website versions and recovery checkpoints remain in `.history` and never enter the public export.

Bindings can point to the name, role, intro, portrait, About image, feature image and the supported website copy listed by `TEMPLATE_BINDINGS`. The template importer generates fresh IDs and remaps internal section links when applying a template. Do not include secrets, remote scripts, HTML, CSS, inline event handlers or external image URLs.

The Studio import dialog can prepare an AI prompt from a reference URL and download both the schema and example. This is an interchange workflow for the user's AI tool; it does not send data to an AI provider automatically or require API credentials in the website.
