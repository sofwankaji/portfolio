# Sofwan Portfolio Studio

A local document editor and a static public portfolio, connected to `sofwankaji/portfolio` on `main`.

## Open on Windows

Install Node.js 24, Git and GitHub CLI. Sign in once with `gh auth login`, then run `npm install` in this folder. Double-click `Start-Studio.cmd` to start missing services and open Studio.

- Studio: http://127.0.0.1:3001/
- Local website: http://127.0.0.1:4173/
- Online portfolio: https://sofwankaji.github.io/portfolio/

The launcher reuses running services. Startup logs are stored in `.history/studio-runtime.log`.

## Write and publish

1. Add a project, enter its title and choose a cover. Write directly on the document. Use **+** or type `/` on an empty line to search for images, galleries, side-by-side layouts, video, tables, checklists, callouts or a story outline.
2. Select text for quick formatting, or use the sticky toolbar for headings, emphasis, quotes, colors, highlights, fonts, sizes, alignment, lists and links. More options include code, superscript/subscript and find/replace. Table controls appear inside a table.
3. Upload, paste or drop JPG, PNG or WebP images, up to 10 MB each and 16 per upload. Drag a bottom corner to resize an image; drag the divider to resize an image-and-text layout. Captions edit below each image. Media controls move, duplicate or remove a block. Images are decoded and stored as WebP.
4. Draft edits save automatically. **บันทึก** or Ctrl+S saves the project file and updates the local website. **ดูหน้าเว็บ ↗** opens the current saved draft separately. Project visibility is next to the writing tabs; other metadata is under **ตัวเลือกเพิ่มเติม**. Edit the whole website under **หน้าเว็บไซต์**.
5. Open **เผยแพร่** and click **Push ไป GitHub**. Current document, profile and other automatic drafts are saved before preparing the complete publication snapshot. Hidden work stays local.

The backend validates content, builds the production export, fetches the remote, checks the branch, stages an exact allowlist, commits and pushes. It never force-pushes or merges over newer remote commits. The progress list distinguishes successful GitHub push from successful online deployment. Online success requires the exact commit's Pages workflow to succeed and the live `version.json` to match.

Only saved Published projects, their referenced images and the saved profile are committed by Studio. Draft projects, automatic drafts, unused uploads, media-library metadata, history, environment files and secrets remain local. System-code changes must be committed explicitly before Studio can publish content. Staged files outside the publish plan block publication.

## Commands

```powershell
npm install
npm run dev
npm run test
npm run build
npm run build:public
```

- `dev:web` and `dev:studio` start one local service separately.
- `build` bundles Studio and generates the local website in `apps/web/out`.
- `build:public` generates only the deployable static files in `apps/web/deploy`, adds the `/portfolio` base path, and omits local Studio links.
- `.github/workflows/pages.yml` validates and deploys only `apps/web/deploy`. It does not deploy the editor, backend or repository root.

## Files and recovery

- `content/projects/*.json`: validated saved project files. Git ignores new files until the publish allowlist explicitly includes a Published project.
- `content/profile.json`: saved profile settings.
- `content/assets/`: images; only referenced images enter public commits.
- `content/drafts/`: automatically saved working drafts, ignored by Git.
- `.history/projects/` and `.history/profile/`: previous saved versions.
- `.history/trash/`: recoverable copies of removed projects.
- `.history/publish/latest.json`: the latest publish progress and verified commit.
- `publish.config.json`: the approved repository, branch, Pages path and URL. It contains no credentials.

Use History in Studio to restore previous project versions. Deleting a project keeps a recoverable copy and leaves image originals in the library. Existing repository history and older site files are preserved; the workflow serves only the new export.

## If publication stops

- Authentication: check `gh auth status` and sign in again if needed. Studio uses existing local Git credentials; it never stores tokens in source.
- GitHub has newer commits: synchronize and resolve conflicts explicitly, then retry. Studio will not overwrite remote changes.
- System files have changed: review and commit code changes separately before publishing content.
- Push succeeded but deployment failed: open the workflow link in Studio. The new commit is already on GitHub; online success is not claimed until it is verified.
- Studio restarted mid-publish: the last result is shown as interrupted or unverified. Review the linked commit and retry; no automatic force push occurs.

The editor binds to 127.0.0.1, checks host and origin, and protects mutation APIs with a per-session token. Content writes are atomic and revision-checked. Git commands use fixed executable argument arrays. Never expose the local Studio service publicly.

The public site keeps the Porcelain design, English content and IBM Plex Sans. Studio uses Thai labels with Noto Sans Thai.

Studio opens on the Projects tab with cover-image cards. Click a card to write its story, or use the + tile or Add project button to create a blank document. The back button returns to the gallery.

Use **Push ทั้งพอร์ต** to collect saved changes and current automatic drafts across every project, then publish one complete snapshot: additions, edits, order, visibility, and removals. Named new projects are included automatically. **ซ่อนจากเว็บ** explicitly keeps a project local; unnamed projects also stay local. Hidden or deleted projects and unused uploads are removed from the public snapshot. Drag cards to reorder, or use the menu’s move buttons. Deleted work is recoverable in **ถังพัก**. Image blocks have size/alignment controls; split layouts have adjustable image proportions and side selection. Video blocks accept HTTPS links, embed validated YouTube links with the privacy-enhanced player, and support direct MP4/WebM links. Push remains available while idle; a repeated push with no changes verifies the approved remote and reports that GitHub is current without inventing a new deployment result. The local website on port 4173 renders current automatic project/profile drafts in a separate preview folder and refreshes open preview pages automatically. Production exports still use saved, visible projects only.
