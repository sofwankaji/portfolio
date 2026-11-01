# Portfolio Studio

The public portfolio preview is generated into `apps/web/out`. Production exports in `apps/web/deploy` include the GitHub Pages base path and omit all local Studio links. The local Studio runs on 127.0.0.1:3001 and edits validated JSON and image assets. Its APIs must never be copied into the public export.

TypeScript services live in server/. Shared schemas, sanitization and page rendering live in packages/shared/. The Studio is a locally bundled client using Tiptap for rich text. Do not expose secrets, execute user-supplied commands, accept arbitrary file paths, or stage files without the user's explicit Publish action. Publishing may stage only the validated published-content plan. Initial source commits are prepared explicitly during implementation.

The approved GitHub destination is sofwankaji/portfolio on main. Use fixed argument arrays for Git and GitHub CLI. Never force-push or overwrite remote commits. A successful push and an online deployment are separate states; confirm deployment only when the exact commit's workflow succeeds and the live version.json matches. Draft projects, automatic drafts, unreferenced uploads and local history stay outside public commits.

Preserve imported Sofwan Kaji content and the Porcelain design. Public content is English. Studio navigation is Thai with Noto Sans Thai; English typography is IBM Plex Sans. Uploads must be decoded and re-encoded before storage. Content writes are atomic, revision-checked and keep recoverable versions. Drafts are excluded from public exports.

Run npm run test and npm run build after relevant changes. Verify save/reload, image captions, block order and project detail navigation in a browser. Existing prototype files are preserved in the original conversation workspace.

## Reference-based AI templates

When asked to add a template from a website reference, follow AI-TEMPLATES.md and the version 1 JSON schema in packages/shared/template-kit.ts. Validate and import the JSON through the template tool; no application code changes are needed for a new custom template. Preview it in Studio and preserve the current website until the user applies it.
