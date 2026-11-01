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
2. Select text for quick formatting, or use the sticky toolbar for headings, emphasis, quotes, colors, highlights, fonts, sizes, alignment, lists and links. More options include code, superscript/subscript and find/replace. Table controls appear inside a table, with row/column menus and a direct delete-table button. The visual **+** palette groups tools by media, text, layout and templates. Its table tile opens a visual size picker. Code blocks provide a language selector, automatic syntax colors and exact-text copying in both Studio and the website.
3. Upload, paste or drop JPG, PNG or WebP images, up to 10 MB each and 16 per upload. Drag a bottom corner to resize an image; drag the divider to resize an image-and-text layout. Captions edit below each image. Use **+ ข้อความข้างรูป** beneath an existing image to add side text; drag the divider or use **สลับด้าน** to adjust the layout. Media controls move, duplicate or remove a block. Images are decoded and stored as WebP.
4. Draft edits save automatically. **บันทึก** or Ctrl+S saves the project file and updates the local website. **ดูหน้าเว็บ ↗** opens the current saved draft separately. Project visibility is next to the writing tabs; other metadata is under **ตัวเลือกเพิ่มเติม**. Edit the whole website under **หน้าเว็บไซต์**.
5. Open **เผยแพร่** and click **Push**. Current document, profile and other automatic drafts are saved before preparing the complete publication snapshot. Hidden work stays local.

Paste a YouTube or direct MP4/WebM URL into a normal paragraph to embed it after the paragraph. Existing paragraph text is preserved; a selected media block receives the video immediately after it. The video URL field also updates a playable, framed preview immediately. The video player has no repeated caption or source link beneath it. Accessible titles are under its **…** menu.

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


## ออกแบบหน้าเว็บจาก Studio

ไปที่ **หน้าเว็บไซต์ → ออกแบบ** เพื่อแก้ About/หน้าแรก, Work และ Contact บนพื้นที่ออกแบบโดยตรง

- เลือก **Template**: Editorial, Spotlight, Gallery, Statement, Bento, Panorama, Profile หรือ Quiet แล้วแก้ต่อได้ทุกองค์ประกอบ การเปลี่ยนแบบย้อนกลับได้ด้วยปุ่มย้อนกลับ
- เพิ่มข้อความ รูป ปุ่ม รูปทรง และส่วนผลงาน เลือกเลเยอร์แล้วลากจัดวางหรือจับมุมเพื่อปรับขนาด รูปรักษาสัดส่วนขณะลากมุม (กด Alt เพื่อปรับกรอบอิสระ)
- ดับเบิลคลิกข้อความเพื่อพิมพ์ ใช้แผงด้านข้างปรับฟอนต์ สี น้ำหนัก ระยะบรรทัด และตำแหน่ง หรือใช้ลูกศรบนแป้นพิมพ์ขยับทีละ 1 หน่วย (Shift ทีละ 10)
- **เลย์เอาต์** เพิ่มส่วนสำเร็จรูป เช่น รูปข้างข้อความ หัวเรื่อง คำพูด และแกลเลอรีผลงาน แต่ละส่วนเรียงลำดับ ทำสำเนา ลบ และเปลี่ยนสีพื้นได้
- เลือกปุ่มแล้วตั้ง **กดแล้วไปที่** เป็นหน้าภายใน ผลงาน อีเมล ส่วนในหน้า หรือลิงก์ภายนอก พร้อมเลือกรูปแบบเส้นขอบ/พื้นทึบ สี มุมโค้ง และพฤติกรรมเมื่อชี้
- **Motion** มี Fade, Slide, Zoom และ Stagger ทีละคำ ปรับเวลา/หน่วงและกดเล่นเพื่อตรวจได้ เอฟเฟกต์เริ่มเมื่อเลื่อนถึงองค์ประกอบบนเว็บ และเคารพการตั้งค่าลดการเคลื่อนไหวของอุปกรณ์
- มุมมองมือถือจัดองค์ประกอบตามลำดับเลเยอร์อัตโนมัติ รูปและข้อความไม่ใช้พิกัดตายตัวบนจอเล็ก สามารถซ่อนองค์ประกอบเฉพาะมือถือได้
- เปิด **ใช้บนเว็บ** เพื่อใช้แบบนี้ (การเริ่มแก้จะเปิดให้) ปิดเพื่อกลับไปใช้หน้าแบบเดิม โดยแบบที่ออกแบบยังเก็บไว้ เมนูและท้ายเว็บแก้ได้จาก **ตั้งค่าเว็บไซต์**

ร่างเก็บอัตโนมัติ ใช้ **บันทึก** และ **Push** ชุดเดิมเพื่อส่งทั้งข้อความ ภาพ เลย์เอาต์ ปุ่ม และ motion ขึ้นเว็บไซต์ การเปิดแท็บออกแบบเพียงอย่างเดียวไม่เปลี่ยนหน้าเว็บเดิม รูปที่ใช้งานในแบบที่เปิดใช้จะรวมอยู่ในรายการเผยแพร่ และส่วนผลงานใช้ลำดับ/การซ่อนเดียวกับแท็บผลงาน


## Templates, Default และเวอร์ชัน

**Template** มี 8 แบบ ค้นหา/กรองหมวด ดูตัวอย่างทั้งหน้า แล้วกดใช้ได้ ปุ่ม **Default** กลับรูปแบบเว็บไซต์เดิมของหน้าที่เลือก โดยเก็บเวอร์ชันก่อนเปลี่ยนให้เสมอ การเปลี่ยน Template และกลับ Default เรียกคืนได้จากปุ่ม **เวอร์ชัน**

**เวอร์ชัน** แสดงข้อมูลเว็บไซต์ที่เคยบันทึกและจุดคืนค่าอัตโนมัติ ตั้งชื่อบันทึกเวอร์ชันเองได้ ดู About/Work/Contact ก่อนเรียกคืนได้ การเรียกคืนเก็บงานปัจจุบันรวมร่างอัตโนมัติเป็นเวอร์ชันก่อนเรียกคืน และบันทึกเป็นเวอร์ชันใหม่เสมอ ประวัตินี้ครอบคลุมโปรไฟล์ รูป เลย์เอาต์ ปุ่ม motion และการตั้งค่าเว็บไซต์ ประวัติเนื้อหาแต่ละผลงานยังอยู่ในเมนูประวัติของผลงานนั้น ใช้ Push หลังเรียกคืนเพื่ออัปเดตเว็บออนไลน์

**+ เพิ่ม Template** รองรับวางเว็บอ้างอิงแล้วคัดลอกคำสั่งสำหรับ AI ดาวน์โหลด Schema/ตัวอย่าง และนำเข้า JSON พร้อมตรวจและดูตัวอย่างก่อนเพิ่มเข้าคลัง ไฟล์ที่เพิ่มจะอยู่ในหมวด **ของฉัน** ไม่ต้องแก้โปรแกรมหรือเริ่ม Studio ใหม่ ดูขั้นตอนสำหรับ AI ที่ [AI-TEMPLATES.md](AI-TEMPLATES.md)

ปุ่มมีแบบสำเร็จรูป พื้นทึบ เส้นขอบ แคปซูล วงกลม ไอคอน ข้อความ สีอ่อน และไล่สี ปรับไอคอนซ้าย/ขวา เงา สีเมื่อชี้ และสีไหลผ่านได้ รองรับลิงก์หน้าเว็บ ผลงาน อีเมล โทรศัพท์ และดาวน์โหลดไฟล์ภายในเว็บไซต์


## ธีมเต็มรูปแบบและ AI Agent

Template แต่ละแบบมีธีมต่างกันทั้งสี ฟอนต์หัวเรื่อง/เนื้อหา พื้นหลัง กรอบการ์ด ภาพ และปุ่ม เช่น Paper Editorial, Midnight Studio, Blueprint, Terra, Violet Studio, Evergreen, Atelier และ Swiss ธีมของหน้าที่เลือกติดไปถึงเมนูและท้ายเว็บ สามารถปรับต่อจากแผง **ธีมของหน้านี้** ได้ Default และเวอร์ชันยังใช้ได้เหมือนเดิม

สำหรับ AI Agent บนเครื่อง ส่ง URL พร้อมคำสั่ง “สร้าง Template จากเว็บนี้เข้าคลัง Studio” ได้เลย Agent เริ่มด้วย `template:agent` เพื่อเตรียมงาน ศึกษาเว็บ แก้ไฟล์ ตรวจและนำเข้าเอง แล้วเปิดลิงก์ตัวอย่างให้ผู้ใช้เลือก ใน Studio มีปุ่ม **เตรียมคำสั่งให้ AI Agent** สำหรับสร้างงานและคัดลอกคำสั่งสั้น ๆ ด้วย ดูขั้นตอนใน [AI-TEMPLATES.md](AI-TEMPLATES.md)
