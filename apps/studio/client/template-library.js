import { pageThemeStyle } from "../../../packages/shared/page-theme.ts";
import { DESIGN_FORMATS, formatDesignPage, renderDesignPage, seedDesignPage } from "../../../packages/shared/page-design-render.ts";
import { templateSchema, instantiateTemplate, templateAiBrief } from "../../../packages/shared/template-kit.ts";
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== void 0) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const button = (text, fn, cls = "button") => {
  const b = el("button", text, cls);
  b.type = "button";
  b.onclick = fn;
  return b;
};
const categories = [["all", "ทั้งหมด"], ["minimal", "Minimal"], ["portfolio", "ผลงาน"], ["profile", "โปรไฟล์"], ["custom", "ของฉัน"]];
export function mountTemplateLibrary({ api, getProfile, getProjects, getPageKey, onApply, onDefault, onError }) {
  async function open(preferredId) {
    const dialog = el("dialog", void 0, "template-library-dialog"), heading = el("div", void 0, "dialog-heading"), copy = el("div");
    copy.append(el("h2", "เลือก Template"));
    heading.append(copy, button("ปิด", () => dialog.close(), "button subtle"));
    const tools = el("div", void 0, "template-library-tools"), search = el("input");
    search.type = "search";
    search.placeholder = "ค้นหา Template";
    search.setAttribute("aria-label", "ค้นหา Template");
    tools.append(search, button("+ เพิ่ม Template", () => openImport(async (t) => {
      await loadCustom();
      category = "custom";
      search.value = "";
      tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.textContent === "ของฉัน")));
      draw();
      await select(t.id);
    })));
    const tabs = el("div", void 0, "template-library-categories"), layout = el("div", void 0, "template-library-layout"), grid = el("div", void 0, "template-library-grid"), detail = el("div", void 0, "template-library-detail"), detailTitle = el("h3"), detailNote = el("p"), preview = el("div", void 0, "template-library-preview"), foot = el("div", void 0, "dialog-footer"), hint = el("p", "เลือกแบบแล้วปรับแต่งต่อได้", "template-library-hint"), apply = button("ใช้ Template", use, "button primary");
    detail.append(detailTitle, detailNote, preview);
    layout.append(grid, detail);
    const fullPreview = button("ดูแบบเต็ม", () => {
      if (!selectedDesign) return;
      const full = el("dialog", void 0, "template-full-dialog"), head = el("div", void 0, "dialog-heading");
      head.append(el("h2", detailTitle.textContent), button("ปิด", () => full.close(), "button subtle"));
      const view = el("div", void 0, "template-full-page"), page = el("div", void 0, "canvas-page is-desktop");
      page.inert = true;
      page.style.setProperty("--site-font", "'" + getProfile().website.theme.font + "'");
      page.innerHTML = renderDesignPage(selectedDesign, getProjects(), false, "desktop");
      const theme = selectedDesign.theme || getProfile().website.theme;
      page.style.cssText += pageThemeStyle(selectedDesign.theme);
      const nav = el("div", void 0, "template-preview-nav");
      nav.style.color = theme.ink;
      nav.style.background = theme.background;
      const links = el("div");
      for (const label of ["Work", "About", "Contact"]) links.append(el("span", label));
      nav.append(el("span", getProfile().name), links);
      page.prepend(nav);
      const footer = el("div", void 0, "template-preview-footer");
      footer.style.background = theme.footer;
      footer.style.color = theme.footerInk;
      footer.append(el("strong", getProfile().website.footerTitle), el("p", getProfile().website.email));
      page.append(footer);
      view.append(page);
      full.append(head, view);
      document.body.append(full);
      full.onclose = () => full.remove();
      full.showModal();
    });
    foot.append(hint, fullPreview, apply);
    dialog.append(heading, tools, tabs, layout, foot);
    document.body.append(dialog);
    dialog.onclose = () => dialog.remove();
    dialog.showModal();
    let category = "all", selected = "default", custom = [], busy = false, selectedDesign = null;
    const key = getPageKey();
    function choices() {
      return [{ id: "default", name: "Default", note: "กลับแบบเว็บไซต์เดิม", category: "minimal", builtin: true }, ...DESIGN_FORMATS.map((t) => ({ ...t, builtin: true })), ...custom.filter((t) => t.pages.includes(key)).map((t) => ({ ...t, note: t.description, builtin: false }))];
    }
    function make(entry, full) {
      if (entry.id === "default") return seedDesignPage(getProfile(), key, () => crypto.randomUUID());
      if (entry.builtin) return formatDesignPage(getProfile(), key, entry.id, () => crypto.randomUUID());
      return instantiateTemplate(full || entry.preview, getProfile(), () => crypto.randomUUID());
    }
    function draw() {
      grid.replaceChildren();
      for (const entry of choices().filter((t) => (category === "all" || category === "custom" && !t.builtin || category === t.category) && (!search.value || [t.name, t.note].join(" ").toLowerCase().includes(search.value.trim().toLowerCase())))) {
        const card = button("", () => select(entry.id), "template-library-card"), thumb = el("div", void 0, "template-card-preview"), page = el("div", void 0, "canvas-page is-desktop");
        thumb.inert = true;
        thumb.setAttribute("aria-hidden", "true");
        const design = make(entry);
        page.innerHTML = renderDesignPage({ ...design, sections: design.sections.slice(0, 1) }, getProjects(), false, "desktop");
        thumb.append(page);
        const palette = el("div", void 0, "template-theme-palette"), theme = design.theme || getProfile().website.theme;
        palette.setAttribute("aria-hidden", "true");
        for (const color of [theme.background, theme.ink, theme.accent, theme.surface]) {
          const swatch = el("i");
          swatch.style.background = color;
          palette.append(swatch);
        }
        card.append(thumb, el("strong", entry.name), el("small", design.theme?.name || "ธีมเว็บไซต์ปัจจุบัน"), palette);
        card.title = entry.note;
        card.setAttribute("aria-label", entry.name);
        card.setAttribute("aria-pressed", String(entry.id === selected));
        grid.append(card);
      }
      if (!grid.children.length) grid.append(el("p", "ไม่พบ Template ลองค้นหาชื่ออื่น"));
      if (![...grid.querySelectorAll("[aria-pressed]")].some((b) => b.getAttribute("aria-pressed") === "true")) {
        selectedDesign = null;
        apply.disabled = true;
        detailTitle.textContent = "เลือก Template";
        detailNote.textContent = "";
        preview.replaceChildren();
      }
    }
    async function select(id) {
      selected = id;
      draw();
      const entry = choices().find((t) => t.id === id);
      if (!entry) return;
      detailTitle.textContent = entry.name;
      detailNote.textContent = entry.note;
      hint.textContent = "เก็บเวอร์ชันก่อนเปลี่ยนให้อัตโนมัติ";
      apply.disabled = true;
      try {
        const full = entry.builtin ? null : await api("/templates/" + entry.id);
        if (selected !== id) return;
        selectedDesign = make(entry, full);
        if (selectedDesign.theme) detailNote.textContent = selectedDesign.theme.name + " · " + selectedDesign.theme.headingFont + " / " + selectedDesign.theme.font;
        const page = el("div", void 0, "canvas-page is-desktop");
        page.inert = true;
        page.style.setProperty("--site-font", "'" + getProfile().website.theme.font + "'");
        page.setAttribute("aria-hidden", "true");
        page.innerHTML = renderDesignPage(selectedDesign, getProjects(), false, "desktop");
        preview.replaceChildren(page);
        apply.textContent = id === "default" ? "กลับ Default" : "ใช้ Template";
        apply.disabled = false;
      } catch (error) {
        onError(error);
        hint.textContent = error.message;
      }
    }
    async function use() {
      if (busy || !selectedDesign) return;
      busy = true;
      apply.disabled = true;
      hint.textContent = "กำลังเก็บเวอร์ชัน…";
      try {
        if (selected === "default") await onDefault();
        else await onApply(selectedDesign, choices().find((t) => t.id === selected).name);
        dialog.close();
      } catch (error) {
        onError(error);
        hint.textContent = error.message;
      } finally {
        busy = false;
        apply.disabled = false;
      }
    }
    for (const [id, label] of categories) {
      const b = button(label, () => {
        category = id;
        tabs.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        draw();
      }, "designer-button");
      b.setAttribute("aria-pressed", String(id === category));
      tabs.append(b);
    }
    search.oninput = draw;
    const refreshTimer = setInterval(async () => {
      if (!dialog.open || document.hidden) return;
      try {
        const next = await api("/templates");
        if (JSON.stringify(next) !== JSON.stringify(custom)) {
          custom = next;
          draw();
          hint.textContent = "มี Template ใหม่ในคลัง";
        }
      } catch {
      }
    }, 3e3);
    dialog.addEventListener("close", () => clearInterval(refreshTimer), { once: true });
    async function loadCustom() {
      custom = await api("/templates");
      draw();
    }
    try {
      await loadCustom();
      await select(typeof preferredId === "string" && choices().some((entry) => entry.id === preferredId) ? preferredId : "default");
    } catch (error) {
      onError(error);
    }
  }
  function openImport(onImported) {
    const dialog = el("dialog", void 0, "template-import-dialog"), heading = el("div", void 0, "dialog-heading");
    heading.append(el("h2", "เพิ่ม Template"), button("ปิด", () => dialog.close(), "button subtle"));
    const body = el("div", void 0, "template-import-body"), refLabel = el("label", "เว็บอ้างอิง"), reference = el("input");
    reference.type = "url";
    reference.placeholder = "https://เว็บไซต์ที่ชอบ";
    reference.setAttribute("aria-label", "เว็บอ้างอิง");
    refLabel.append(reference);
    body.append(refLabel);
    const kit = el("div", void 0, "button-row"), copyPrompt = button("คัดลอกคำสั่งสำหรับ AI", async () => {
      try {
        if (reference.value && !reference.checkValidity()) return reference.reportValidity();
        await navigator.clipboard.writeText(templateAiBrief(reference.value, getPageKey()));
        copyPrompt.textContent = "คัดลอกแล้ว";
      } catch (error) {
        onError(error);
      }
    });
    const agentButton = button("เตรียมคำสั่งให้ AI Agent", async () => {
      if (!reference.value || !/^https?:\/\//i.test(reference.value) || !reference.checkValidity()) {
        reference.setCustomValidity("ใส่ลิงก์เว็บอ้างอิงที่เริ่มด้วย https://");
        reference.reportValidity();
        return;
      }
      reference.setCustomValidity("");
      agentButton.disabled = true;
      try {
        const job = await api("/templates/agent-job", { method: "POST", body: JSON.stringify({ id: "ai-" + crypto.randomUUID().slice(0, 8), name: "Reference Study", reference: reference.value, page: getPageKey(), layout: "editorial", theme: "spotlight" }) });
        await navigator.clipboard.writeText(job.agentPrompt);
        agentButton.textContent = "คัดลอกคำสั่ง Agent แล้ว";
        status.textContent = "วางคำสั่งในแชตของ AI Agent เพื่อให้สร้างและเพิ่มเข้าคลังได้เลย";
      } catch (error) {
        status.textContent = error.message;
      } finally {
        agentButton.disabled = false;
      }
    });
    reference.oninput = () => reference.setCustomValidity("");
    agentButton.classList.add("primary");
    kit.append(agentButton);
    const advanced = el("details", void 0, "template-import-advanced");
    advanced.append(el("summary", "นำเข้าไฟล์หรือใช้ AI ภายนอก"));
    const advancedBody = el("div", void 0, "template-import-advanced-body");
    advancedBody.append(copyPrompt);
    advanced.append(advancedBody);
    for (const [path, label, file] of [["schema", "Schema", "portfolio-template.schema.json"], ["example", "ไฟล์ตัวอย่าง", "portfolio-template.example.json"]]) {
      const link = el("a", label, "button");
      link.href = "/api/templates/" + path;
      link.download = file;
      advancedBody.append(link);
    }
    body.append(kit);
    const pasteLabel = el("label", "ไฟล์ Template จาก AI"), text = el("textarea"), upload = el("input"), status = el("p", "", "template-import-status"), preview = el("div", void 0, "template-import-preview");
    text.rows = 9;
    text.maxLength = 524288;
    text.spellcheck = false;
    text.placeholder = "วาง JSON ที่ AI สร้าง หรือเลือกไฟล์ .json";
    text.setAttribute("aria-label", "JSON Template");
    pasteLabel.append(text);
    upload.type = "file";
    upload.accept = ".json,application/json";
    upload.setAttribute("aria-label", "เลือกไฟล์ Template");
    upload.onchange = async () => {
      try {
        const file = upload.files[0];
        if (!file) return;
        if (file.size > 512 * 1024) throw new Error("Template ต้องไม่เกิน 512 KB");
        text.value = await file.text();
        check();
      } catch (error) {
        status.textContent = error.message;
      }
    };
    advancedBody.append(pasteLabel, upload);
    body.append(advanced, status, preview);
    const foot = el("div", void 0, "dialog-footer"), validate = button("ดูตัวอย่าง", check), importButton = button("เพิ่มเข้าคลัง", async () => {
      const t = check();
      if (!t) return;
      importButton.disabled = true;
      try {
        await api("/templates", { method: "POST", body: JSON.stringify(t) });
        await onImported(t);
        dialog.close();
      } catch (error) {
        status.textContent = error.message;
      } finally {
        importButton.disabled = false;
      }
    }, "button primary");
    importButton.disabled = true;
    foot.hidden = true;
    advanced.addEventListener("toggle", () => { foot.hidden = !advanced.open; });
    foot.append(validate, importButton);
    dialog.append(heading, body, foot);
    document.body.append(dialog);
    dialog.onclose = () => dialog.remove();
    dialog.showModal();
    function check() {
      try {
        const t = templateSchema.parse(JSON.parse(text.value)), page = el("div", void 0, "canvas-page is-desktop");
        page.inert = true;
        page.innerHTML = renderDesignPage(instantiateTemplate(t, getProfile(), () => crypto.randomUUID()), getProjects(), false, "desktop");
        preview.replaceChildren(page);
        status.textContent = t.name + " · " + t.design.sections.length + " ส่วน";
        importButton.disabled = false;
        return t;
      } catch (error) {
        preview.replaceChildren();
        importButton.disabled = true;
        status.textContent = error.issues ? error.issues.map((i) => i.path.join(".") + ": " + i.message).slice(0, 3).join(" · ") : "อ่าน JSON ไม่ได้ ตรวจรูปแบบไฟล์อีกครั้ง";
        return null;
      }
    }
    text.oninput = () => {
      importButton.disabled = true;
      status.textContent = "กดดูตัวอย่างก่อนเพิ่มเข้าคลัง";
    };
  }
  return { open };
}
