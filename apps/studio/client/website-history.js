const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== void 0) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const reasons = { manual: "บันทึกเอง", template: "ก่อนเปลี่ยน Template", default: "ก่อนกลับ Default", restore: "ก่อนเรียกคืน", saved: "บันทึก" };
const date = (value) => new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
export function mountWebsiteHistory({ api, flush, onRestored, onError }) {
  async function checkpoint(name = "", reason = "manual") {
    const expected = await flush();
    return api("/profile/versions", { method: "POST", body: JSON.stringify({ expected, name, reason }) });
  }
  async function open() {
    const dialog = el("dialog", void 0, "website-history-dialog"), heading = el("div", void 0, "dialog-heading"), intro = el("div");
    intro.append(el("h2", "เวอร์ชันเว็บไซต์"), el("p", "รูป ข้อความ เลย์เอาต์ และการตั้งค่าเว็บไซต์"));
    const close = el("button", "ปิด", "button subtle");
    close.onclick = () => dialog.close();
    heading.append(intro, close);
    const create = el("form", void 0, "website-version-create"), name = el("input"), label = el("label", "ชื่อเวอร์ชัน"), save = el("button", "บันทึกเวอร์ชัน", "button");
    name.maxLength = 100;
    name.placeholder = "เช่น ก่อนเปลี่ยนหน้าแรก";
    name.setAttribute("aria-label", "ชื่อเวอร์ชัน");
    label.append(name);
    save.type = "submit";
    create.append(label, save);
    const layout = el("div", void 0, "website-history-layout"), list = el("div", void 0, "website-version-list"), preview = el("div", void 0, "website-version-preview"), meta = el("div", void 0, "website-version-meta"), title = el("strong"), time = el("span"), pages = el("div", void 0, "designer-segment"), frame = el("iframe"), foot = el("div", void 0, "dialog-footer"), status = el("p", "เลือกเวอร์ชันเพื่อดูตัวอย่าง", "website-version-status"), restore = el("button", "เรียกคืนเวอร์ชันนี้", "button primary");
    let entries = [], selected = "", page = "about", busy = false;
    status.setAttribute("role", "status");
    frame.title = "ตัวอย่างเวอร์ชันเว็บไซต์";
    meta.append(title, time, pages);
    preview.append(meta, frame);
    layout.append(list, preview);
    restore.disabled = true;
    foot.append(status, restore);
    dialog.append(heading, create, layout, foot);
    document.body.append(dialog);
    dialog.onclose = () => dialog.remove();
    dialog.showModal();
    for (const [key, text] of [["about", "About"], ["work", "Work"], ["contact", "Contact"]]) {
      const b = el("button", text, "designer-button");
      b.type = "button";
      b.dataset.page = key;
      b.onclick = () => {
        page = key;
        updatePreview();
      };
      pages.append(b);
    }
    function updatePreview() {
      const entry = entries.find((e) => e.id === selected);
      if (!entry) return;
      title.textContent = entry.name || reasons[entry.reason];
      time.textContent = date(entry.createdAt);
      pages.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.page === page)));
      frame.src = "/preview/website/" + encodeURIComponent(selected) + "/" + page + "/";
      restore.disabled = busy;
      status.textContent = "เก็บเวอร์ชันปัจจุบันให้อัตโนมัติก่อนเรียกคืน";
    }
    async function refresh(preferred) {
      entries = await api("/profile/versions");
      list.replaceChildren();
      if (!entries.length) list.append(el("p", "ยังไม่มีเวอร์ชัน"));
      for (const entry of entries) {
        const b = el("button", void 0, "website-version-item");
        b.type = "button";
        b.dataset.version = entry.id;
        b.append(el("strong", entry.name || reasons[entry.reason]), el("time", date(entry.createdAt)), el("small", reasons[entry.reason] || "บันทึก"));
        b.onclick = () => {
          selected = entry.id;
          list.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === b)));
          updatePreview();
        };
        b.setAttribute("aria-label", (entry.name || reasons[entry.reason]) + " · " + date(entry.createdAt));
        list.append(b);
      }
      selected = preferred || entries[0]?.id || "";
      list.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item.dataset.version === selected)));
      updatePreview();
    }
    create.onsubmit = async (event) => {
      event.preventDefault();
      if (busy) return;
      busy = true;
      save.disabled = true;
      try {
        const entry = await checkpoint(name.value.trim() || "เวอร์ชันที่บันทึก", "manual");
        name.value = "";
        await refresh(entry.id);
        status.textContent = "บันทึกเวอร์ชันแล้ว";
      } catch (error) {
        status.textContent = error.message;
        onError(error);
      } finally {
        busy = false;
        save.disabled = false;
        restore.disabled = !selected;
      }
    };
    restore.onclick = async () => {
      if (busy || !selected) return;
      busy = true;
      restore.disabled = true;
      save.disabled = true;
      status.textContent = "กำลังเรียกคืน…";
      try {
        const expected = await flush(), result = await api("/profile/restore", { method: "POST", body: JSON.stringify({ version: selected, expected }) });
        onRestored(result.profile);
        dialog.close();
      } catch (error) {
        status.textContent = error.message;
        onError(error);
      } finally {
        busy = false;
        restore.disabled = false;
        save.disabled = false;
      }
    };
    try {
      await refresh();
    } catch (error) {
      onError(error);
      status.textContent = error.message;
    }
  }
  return { open, checkpoint };
}
