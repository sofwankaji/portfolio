# Sofwan Portfolio Studio

A local document editor and a static public portfolio, connected to `sofwankaji/portfolio` on `main`.

## Open on Windows

Install Node.js 24, Git and GitHub CLI. Sign in once with `gh auth login`, then run `npm install` in this folder. Double-click `Start-Studio.cmd` to start missing services and open Studio.

- Studio: http://127.0.0.1:3001/
- Local website: http://127.0.0.1:4173/
- Online portfolio: https://sofwankaji.github.io/portfolio/

The launcher reuses running services. Startup logs are stored in `.history/studio-runtime.log`.

## Write and publish

1. Add a project. Enter its title, choose a cover and write a long document. Type `/` on an empty line to insert an image, gallery, image-and-text layout, quote or divider at the caret.
2. Captions edit directly beneath images. Images accept JPG, PNG or WebP, up to 10 MB each and 16 per upload. They are decoded, oriented, resized and stored as WebP. Paste or drop images into the document.
3. Draft edits are saved automatically. Save or Ctrl+S writes the project file and updates the local website. Optional project information and the Draft/Published setting are in the additional-options tab.
4. Use **โปรไฟล์และหน้าแรก** for a portrait, crop position and introduction.
5. Open **เผยแพร่บน GitHub**. Review the destination and file changes, then click **Push ไป GitHub**. The current document and profile are saved first if they have changes.

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
