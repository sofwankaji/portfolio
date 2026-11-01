import { PAGE_THEMES, getPageTheme, applyPageTheme, pageThemeStyle, pageThemeSchema } from "../../../packages/shared/page-theme.ts";
import { mountTemplateLibrary } from "./template-library.js";
import { BUTTON_PRESETS, applyButtonPreset, BUTTON_ICONS } from "../../../packages/shared/design-buttons.ts";
import { designNodeSchema, designSectionSchema, designPageSchema, fitDesignNode, designLink, clamp } from "../../../packages/shared/page-design.ts";
import { seedDesignPage, renderDesignSection, renderDesignNode, designNodeStyle } from "../../../packages/shared/page-design-render.ts";
import { animateCanvasNode } from "../../../packages/shared/canvas-motion.js";
const node = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== void 0) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const copy = (v) => JSON.parse(JSON.stringify(v));
const icons = { text: "M4 5h16M12 5v15M8 20h8", image: "M3 3h18v18H3zM3 17l6-6 5 5 4-7 3 8M8 7h.01", button: "M3 7h18v10H3zM8 12h8", shape: "M5 5h14v14H5z", projects: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z", layout: "M3 3h18v18H3zM3 10h18M12 10v11", undo: "M9 5 3 11l6 6M3 11h10c5 0 7 3 7 8", redo: "m15 5 6 6-6 6M21 11h-10c-5 0-7 3-7 8", up: "m6 14 6-6 6 6", down: "m6 10 6 6 6-6", trash: "M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7", copy: "M8 8h13v13H8zM16 8V3H3v13h5", lock: "M6 10h12v11H6zM8 10V6a4 4 0 0 1 8 0v4", eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6", desktop: "M2 3h20v14H2zM8 22h8M12 17v5", mobile: "M7 2h10v20H7zM11 18h2", align: "M3 3v18M7 6h14M7 12h9M7 18h14" };
const svg = (key) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[key] || icons.layout}"/></svg>`;
const names = { text: "ข้อความ", image: "รูปภาพ", button: "ปุ่ม", shape: "รูปทรง", projects: "ผลงาน" };
export function mountPageDesigner({ element, getProfile, getProjects, chooseMedia, uploadFiles, onChange, onError, openSettings, api, checkpoint, openHistory }) {
  let pageKey = "about", sectionId = "", selectedId = "", device = "desktop", zoom = "fit", scale = 1, seeds = {}, past = [], future = [], editing = false, gesture = null, stopPlayback = () => {
  };
  const read = () => getProfile()?.website.designer;
  const page = () => {
    const p = read()?.[pageKey];
    return p?.sections.length ? p : seeds[pageKey] || (seeds[pageKey] = seedDesignPage(getProfile(), pageKey, () => crypto.randomUUID()));
  };
  const section = () => page().sections.find((s) => s.id === sectionId) || page().sections[0];
  const selected = () => section()?.nodes.find((n) => n.id === selectedId);
  const button = (text, fn, icon, cls = "designer-button") => {
    const b = node("button", void 0, cls);
    b.type = "button";
    if (icon) b.innerHTML = svg(icon);
    if (text) b.append(node("span", text));
    b.setAttribute("aria-label", text);
    b.title = text;
    b.onclick = fn;
    return b;
  };
  const iconButton = (label, fn, icon) => button(label, fn, icon, "designer-button designer-icon");
  const snapshot = () => {
    past.push(copy(read()));
    if (past.length > 60) past.shift();
    future = [];
  };
  const activate = () => {
    if (!read()[pageKey].sections.length) read()[pageKey] = copy(page());
    read()[pageKey].enabled = true;
  };
  const changed = () => {
    onChange();
    updateHistory();
  };
  function mutate(fn, { paint = true } = {}) {
    snapshot();
    activate();
    try {
      fn();
      const valid = designPageSchema.safeParse(read()[pageKey]);
      if (!valid.success) throw new Error(valid.error.issues[0].message);
      changed();
      if (paint) render();
    } catch (error) {
      getProfile().website.designer = past.pop();
      render();
      onError(error);
    }
  }
  const root = node("div", void 0, "page-designer"), toolbar = node("div", void 0, "designer-toolbar"), body = node("div", void 0, "designer-body"), rail = node("aside", void 0, "designer-rail"), workspace = node("div", void 0, "designer-workspace"), inspector = node("aside", void 0, "designer-inspector"), stage = node("div", void 0, "designer-stage"), shell = node("div", void 0, "designer-scale-shell"), artboard = node("div", void 0, "designer-artboard"), footer = node("div", void 0, "designer-status");
  inspector.setAttribute("aria-label", "ปรับแต่งองค์ประกอบ");
  rail.setAttribute("aria-label", "ส่วนและเลเยอร์");
  stage.setAttribute("aria-label", "พื้นที่ออกแบบเว็บไซต์");
  shell.append(artboard);
  stage.append(shell);
  workspace.append(stage, footer);
  body.append(rail, workspace, inspector);
  root.append(toolbar, body);
  element.append(root);
  const pageSelect = node("select");
  pageSelect.setAttribute("aria-label", "หน้าที่ออกแบบ");
  [["about", "About / หน้าแรก"], ["work", "Work"], ["contact", "Contact"]].forEach(([v, label]) => {
    const o = node("option", label);
    o.value = v;
    pageSelect.append(o);
  });
  pageSelect.onchange = () => {
    pageKey = pageSelect.value;
    sectionId = "";
    selectedId = "";
    render();
  };
  const undo = iconButton("ย้อนกลับ", () => history(-1), "undo"), redo = iconButton("ทำซ้ำ", () => history(1), "redo");
  const modes = node("div", void 0, "designer-segment");
  for (const [value, label] of [["desktop", "คอมพิวเตอร์"], ["mobile", "มือถือ"]]) {
    const b = iconButton(label, () => {
      device = value;
      render();
    }, value);
    b.dataset.device = value;
    modes.append(b);
  }
  const zoomSelect = node("select");
  zoomSelect.setAttribute("aria-label", "ซูมพื้นที่ออกแบบ");
  [["fit", "พอดีจอ"], [".5", "50%"], [".75", "75%"], ["1", "100%"]].forEach(([v, label]) => {
    const o = node("option", label);
    o.value = v;
    zoomSelect.append(o);
  });
  zoomSelect.onchange = () => {
    zoom = zoomSelect.value;
    resize();
  };
  const enabled = node("label", void 0, "designer-enabled"), toggle = node("input");
  toggle.type = "checkbox";
  toggle.setAttribute("aria-label", "ใช้แบบที่ออกแบบบนเว็บไซต์");
  toggle.onchange = () => {
    if (toggle.checked) mutate(() => {
    });
    else {
      snapshot();
      read()[pageKey].enabled = false;
      changed();
      render();
    }
  };
  enabled.append(toggle, node("span", "ใช้บนเว็บ"));
  toolbar.append(pageSelect, button("Template", showFormats, "layout"), button("Default", () => resetDefault().catch(onError)), button("เวอร์ชัน", openHistory), undo, redo, modes, zoomSelect, enabled);
  function updateHistory() {
    undo.disabled = !past.length;
    redo.disabled = !future.length;
  }
  function history(direction) {
    const source = direction < 0 ? past : future, target = direction < 0 ? future : past;
    if (!source.length) return;
    target.push(copy(read()));
    getProfile().website.designer = source.pop();
    seeds = {};
    selectedId = "";
    onChange();
    render();
  }
  const frameLabel = node("div", void 0, "designer-frame-label"), layerList = node("div", void 0, "designer-layer-list"), sectionList = node("div", void 0, "designer-section-list");
  function renderRail() {
    rail.replaceChildren();
    const add = node("div", void 0, "designer-add-grid");
    for (const type of ["text", "image", "button", "shape", "projects"]) add.append(button(names[type], () => addElement(type), type, "designer-add-tile"));
    add.append(button("เลย์เอาต์", showLayouts, "layout", "designer-add-tile"));
    rail.append(add, node("h3", "ส่วนของหน้า"), sectionList);
    sectionList.replaceChildren();
    page().sections.forEach((s, i) => {
      const b = button(s.name || "Section " + (i + 1), () => {
        sectionId = s.id;
        selectedId = "";
        render();
      }, "layout", "designer-section-button");
      b.setAttribute("aria-pressed", String(s.id === section().id));
      sectionList.append(b);
    });
    rail.append(button("เพิ่มส่วน", () => addSection("blank"), "layout"), node("h3", "เลเยอร์"), layerList);
    renderLayers();
  }
  function renderLayers() {
    layerList.replaceChildren();
    [...section().nodes].reverse().forEach((n) => {
      const row = node("div", void 0, "designer-layer-row"), b = button(n.name || n.text.slice(0, 30) || names[n.type], () => select(n.id), n.type, "designer-layer-button");
      b.setAttribute("aria-pressed", String(n.id === selectedId));
      if (n.locked || n.hidden) b.append(node("small", n.hidden ? "ซ่อน" : "ล็อก"));
      row.append(b);
      layerList.append(row);
    });
  }
  function select(id) {
    if (editing) return;
    selectedId = id;
    renderLayers();
    paintSelection();
    renderInspector();
  }
  function paintSelection() {
    artboard.querySelectorAll(".canvas-node").forEach((box) => {
      const active = box.dataset.nodeId === selectedId;
      box.classList.toggle("designer-selected", active);
      box.querySelectorAll(".designer-handle").forEach((h) => h.remove());
      if (active && device === "desktop" && !selected()?.locked) {
        for (const corner of ["nw", "ne", "sw", "se"]) {
          const h = node("button", void 0, "designer-handle handle-" + corner);
          h.type = "button";
          h.dataset.resize = corner;
          h.setAttribute("aria-label", "ลากปรับขนาด " + corner);
          h.tabIndex = -1;
          box.append(h);
        }
      }
    });
  }
  function renderCanvas() {
    stopPlayback();
    artboard.replaceChildren();
    const s = section();
    frameLabel.replaceChildren(node("span", s.name), node("span", device === "mobile" ? "390" : "1200"));
    artboard.append(frameLabel);
    const p = node("div", void 0, "canvas-page " + (device === "mobile" ? "is-mobile" : "is-desktop"));
    p.style.setProperty("--site-font", "'" + getProfile().website.theme.font + "'");
    if (page().theme) {
      const t = page().theme;
      p.style.cssText += pageThemeStyle(t);
      p.dataset.theme = t.id;
      p.dataset.pattern = t.pattern;
      p.dataset.cardStyle = t.cardStyle;
      p.dataset.imageTreatment = t.imageTreatment;
    }
    p.innerHTML = renderDesignSection(s, getProjects(), true);
    artboard.append(p);
    artboard.style.width = (device === "mobile" ? 390 : 1200) + "px";
    p.querySelectorAll(".canvas-node").forEach((box) => {
      box.tabIndex = 0;
      box.setAttribute("role", "group");
      const n = s.nodes.find((n2) => n2.id === box.dataset.nodeId);
      box.setAttribute("aria-label", (n.name || names[n.type]) + ": " + n.text.slice(0, 100));
    });
    paintSelection();
    resize();
  }
  function repaintNode(n) {
    const box = artboard.querySelector(`[data-node-id="${n.id}"]`);
    if (!box) return;
    stopPlayback();
    box.dataset.canvasMotion = n.motion;
    box.dataset.motionDuration = n.motionDuration;
    box.dataset.motionDelay = n.motionDelay;
    box.setAttribute("style", designNodeStyle(n, section().nodes.indexOf(n)));
    box.innerHTML = '<div class="canvas-content">' + renderDesignNode(n, getProjects(), true) + "</div>";
    box.classList.toggle("canvas-node-round", n.type === "button" && n.width === n.height && n.radius >= n.width / 2);
    box.classList.toggle("canvas-mobile-hidden", n.mobileHidden);
    box.classList.toggle("canvas-node-hidden", n.hidden);
    paintSelection();
    resize();
  }
  function resize() {
    if (!element.isConnected || element.hidden || !getProfile()) return;
    const width = device === "mobile" ? 390 : 1200, available = Math.max(180, stage.clientWidth - 48);
    scale = zoom === "fit" ? Math.min(1, available / width) : Number(zoom);
    artboard.style.transform = `scale(${scale})`;
    shell.style.width = width * scale + "px";
    shell.style.height = artboard.offsetHeight * scale + "px";
    footer.textContent = `${Math.round(scale * 100)}% · ${device === "mobile" ? "มือถือจัดเรียงอัตโนมัติ" : "ลากเพื่อจัดวาง · ดับเบิลคลิกเพื่อพิมพ์"}`;
  }
  const observer = new ResizeObserver(() => resize());
  observer.observe(stage);
  observer.observe(artboard);
  function field(parent, label, value, apply, { type = "text", options, min, max, step, multiline = false } = {}) {
    const wrap = node("label", label), input = node(options ? "select" : multiline ? "textarea" : "input");
    if (options) options.forEach((item) => {
      const [v, title] = Array.isArray(item) ? item : [item, item], o = node("option", title);
      o.value = v;
      input.append(o);
    });
    else {
      if (!multiline) input.type = type;
      if (multiline) {
        input.rows = 4;
        input.maxLength = 8e3;
      }
      if (min !== void 0) input.min = min;
      if (max !== void 0) input.max = max;
      if (step !== void 0) input.step = step;
    }
    input.setAttribute("aria-label", label);
    if (input.tagName === "INPUT" && type === "text") input.maxLength = label === "ชื่อเลเยอร์" || label === "ชื่อส่วน" ? 120 : label === "คำอธิบายรูป" ? 500 : 2e3;
    input.value = value;
    let started = false;
    input.onfocus = () => started = false;
    input.oninput = () => {
      if (type === "number" && (input.value === "" || !input.checkValidity())) return;
      let v = type === "number" ? Number(input.value) : input.value;
      if (!started) {
        snapshot();
        activate();
        started = true;
      }
      apply(v);
      changed();
    };
    input.onchange = () => {
      started = false;
      renderLayers();
    };
    wrap.append(input);
    parent.append(wrap);
    return input;
  }
  function checkbox(parent, label, value, apply) {
    const wrap = node("label", void 0, "designer-check"), input = node("input");
    input.type = "checkbox";
    input.checked = value;
    input.onchange = () => mutate(() => apply(input.checked));
    wrap.append(input, node("span", label));
    parent.append(wrap);
  }
  function group(title) {
    const g = node("div", void 0, "designer-property-group");
    g.append(node("h3", title));
    inspector.append(g);
    return g;
  }
  function updateNode(key, value) {
    const n = selected();
    if (!n) return;
    n[key] = value;
    fitDesignNode(n, section().height);
    repaintNode(n);
  }
  function renderInspector() {
    inspector.replaceChildren();
    const n = selected(), s = section();
    if (!n) {
      const themeGroup = group("ธีมของหน้านี้"), currentTheme = page().theme;
      field(themeGroup, "ชุดสีและตัวอักษร", currentTheme?.id || "website", (value) => {
        const theme = value === "website" ? pageThemeSchema.parse({ ...getProfile().website.theme, id: "website", name: "Website", headingFont: getProfile().website.theme.font }) : getPageTheme(value);
        applyPageTheme(read()[pageKey], theme, currentTheme || getProfile().website.theme);
        renderCanvas();
        queueMicrotask(renderInspector);
      }, { options: [["website", "ตามเว็บไซต์"], ...Object.values(PAGE_THEMES).map((theme) => [theme.id, theme.name]), ...currentTheme && !PAGE_THEMES[currentTheme.id] && currentTheme.id !== "website" ? [[currentTheme.id, currentTheme.name]] : []] });
      if (currentTheme) {
        const details = node("details", void 0, "designer-theme-details"), fields = node("div", void 0, "designer-property-grid");
        details.append(node("summary", "ปรับธีม"), fields);
        themeGroup.append(details);
        for (const [key, label] of [["background", "พื้นหน้า"], ["ink", "ตัวอักษร"], ["accent", "สีหลัก"], ["surface", "พื้นรอง"], ["footer", "พื้นท้ายเว็บ"], ["footerInk", "ตัวอักษรท้ายเว็บ"]]) field(fields, label, currentTheme[key], (value) => {
          const old = copy(page().theme), theme = { ...old, [key]: value };
          applyPageTheme(read()[pageKey], theme, old);
          renderCanvas();
        }, { type: "color" });
        field(details, "ฟอนต์หัวเรื่อง", currentTheme.headingFont, (value) => {
          const old = copy(page().theme);
          applyPageTheme(read()[pageKey], { ...old, headingFont: value }, old);
          renderCanvas();
        }, { options: ["IBM Plex Sans", "Manrope", "Inter", "Georgia"] });
        field(details, "ฟอนต์เนื้อหา", currentTheme.font, (value) => {
          const old = copy(page().theme);
          applyPageTheme(read()[pageKey], { ...old, font: value }, old);
          renderCanvas();
        }, { options: ["IBM Plex Sans", "Manrope", "Inter"] });
      }
      const g = group("ส่วนของหน้า");
      field(g, "ชื่อส่วน", s.name, (v) => section().name = v);
      field(g, "สีพื้น", s.background, (v) => {
        section().background = v;
        renderCanvas();
      }, { type: "color" });
      field(g, "ความสูง", s.height, (v) => {
        section().height = v;
        section().nodes.forEach((n2) => fitDesignNode(n2, v));
        renderCanvas();
      }, { type: "number", min: 240, max: 2400 });
      const actions2 = node("div", void 0, "designer-property-actions"), at = page().sections.indexOf(s);
      const up = iconButton("เลื่อนส่วนขึ้น", () => moveSection(-1), "up"), down = iconButton("เลื่อนส่วนลง", () => moveSection(1), "down");
      up.disabled = at === 0;
      down.disabled = at === page().sections.length - 1;
      actions2.append(up, down, iconButton("ทำสำเนาส่วน", duplicateSection, "copy"), iconButton("ลบส่วนนี้", deleteSection, "trash"));
      g.append(actions2);
      const p = group("หน้านี้");
      checkbox(p, "แสดงเมนูด้านบน", !page().hideHeader, (v) => read()[pageKey].hideHeader = !v);
      checkbox(p, "แสดงท้ายเว็บไซต์", !page().hideFooter, (v) => read()[pageKey].hideFooter = !v);
      p.append(button("แก้เมนู สี และท้ายเว็บ", openSettings, "layout"));
      return;
    }
    const title = group(names[n.type]);
    field(title, "ชื่อเลเยอร์", n.name, (v) => selected().name = v);
    const actions = node("div", void 0, "designer-property-actions");
    actions.append(iconButton("ทำสำเนา", duplicateNode, "copy"), iconButton(n.locked ? "ปลดล็อก" : "ล็อกตำแหน่ง", () => mutate(() => selected().locked = !n.locked), "lock"), iconButton(n.hidden ? "แสดง" : "ซ่อน", () => mutate(() => selected().hidden = !n.hidden), "eye"), iconButton("ลบองค์ประกอบ", deleteNode, "trash"));
    title.append(actions);
    if (n.type === "text" || n.type === "button") {
      const g = group("ข้อความ");
      field(g, "เนื้อหา", n.text, (v) => updateNode("text", v), { multiline: true });
      const grid2 = node("div", void 0, "designer-property-grid");
      g.append(grid2);
      field(grid2, "ขนาด", n.fontSize, (v) => updateNode("fontSize", v), { type: "number", min: 12, max: 180 });
      field(grid2, "สี", n.color, (v) => updateNode("color", v), { type: "color" });
      field(g, "ฟอนต์", n.font, (v) => updateNode("font", v), { options: [["inherit", "ตามเว็บไซต์"], "IBM Plex Sans", "Manrope", "Inter", "Georgia"] });
      field(g, "น้ำหนัก", n.weight, (v) => updateNode("weight", v), { options: [["300", "บาง"], ["400", "ปกติ"], ["500", "กลาง"], ["600", "หนา"], ["700", "หนามาก"]] });
      checkbox(g, "ตัวเอียง", n.italic, (v) => selected().italic = v);
      field(g, "จัดข้อความ", n.align, (v) => updateNode("align", v), { options: [["left", "ซ้าย"], ["center", "กลาง"], ["right", "ขวา"]] });
      if (n.type === "text") {
        g.append(button("ปรับกรอบพอดีข้อความ", () => {
          const box = artboard.querySelector(".designer-selected .canvas-text");
          if (!box) return;
          const height = Math.ceil(box.getBoundingClientRect().height / scale);
          mutate(() => {
            const n2 = selected();
            section().height = Math.max(section().height, Math.min(2400, n2.y + height + 40));
            n2.height = Math.min(height, 2400 - n2.y);
            fitDesignNode(n2, section().height);
          });
        }));
        field(g, "หัวข้อ", n.tag, (v) => updateNode("tag", v), { options: [["p", "ข้อความ"], ["h1", "หัวเรื่องหลัก"], ["h2", "หัวข้อ"], ["h3", "หัวข้อย่อย"]] });
        field(g, "ระยะบรรทัด", n.lineHeight, (v) => updateNode("lineHeight", v), { type: "number", min: 1, max: 2.5, step: 0.05 });
      }
    }
    if (n.type === "image") {
      const g = group("รูปภาพ");
      if (n.image) {
        const img = node("img", void 0, "designer-image-thumb");
        img.src = n.image.src;
        img.alt = n.image.alt;
        g.append(img);
      }
      g.append(button("เลือก / อัปโหลดรูป", () => chooseMedia(false, (assets) => mutate(() => selected().image = { src: assets[0].src, alt: assets[0].alt || "" })), "image"));
      if (n.image) field(g, "คำอธิบายรูป", n.image.alt, (v) => {
        selected().image.alt = v;
        repaintNode(selected());
      });
      field(g, "การวางภาพ", n.fit, (v) => updateNode("fit", v), { options: [["cover", "เต็มกรอบ"], ["contain", "เห็นภาพครบ"]] });
      const grid2 = node("div", void 0, "designer-property-grid");
      g.append(grid2);
      for (const [key, label] of [["focalX", "จุดโฟกัส X"], ["focalY", "จุดโฟกัส Y"]]) field(grid2, label, n[key], (v) => updateNode(key, v), { type: "number", min: 0, max: 100 });
    }
    if (n.type === "button") {
      const g = group("กดแล้วไปที่"), destinations = [["/", "หน้าแรก"], ["/about/", "About"], ["/portfolio/", "Work / ผลงานทั้งหมด"], ["/contact/", "Contact"], ["mailto:" + getProfile().website.email, "อีเมล"], ["/Sofwan-Kaji-Resume.pdf", "ดาวน์โหลด Resume"], ...getProfile().website.phone ? [["tel:" + getProfile().website.phone.replace(/[^+\d]/g, ""), "โทรศัพท์"]] : [], ...getProjects().filter((p) => p.status === "published").map((p) => ["/portfolio/" + p.slug + "/", p.title]), ...page().sections.map((s2) => ["#design-" + s2.id, "ส่วน: " + s2.name])];
      const picker = node("select");
      picker.setAttribute("aria-label", "เลือกหน้าปลายทาง");
      for (const [href2, label] of [...destinations, ["custom", "ลิงก์อื่น…"]]) {
        const o = node("option", label);
        o.value = href2;
        picker.append(o);
      }
      picker.value = destinations.some(([href2]) => href2 === n.href) ? n.href : "custom";
      picker.onchange = () => {
        if (picker.value !== "custom") mutate(() => {
          selected().href = picker.value;
          selected().download = picker.value === "/Sofwan-Kaji-Resume.pdf";
        });
      };
      g.append(picker);
      const previewHref = (href2) => href2.startsWith("/") ? "http://127.0.0.1:4173" + href2 : href2.startsWith("#") ? "http://127.0.0.1:4173/" + (pageKey === "about" ? "" : pageKey === "work" ? "portfolio/" : "contact/") + href2 : href2;
      const input = field(g, "ลิงก์", n.href, (v) => {
        const result = designLink.safeParse(v);
        input.setCustomValidity(result.success ? "" : "ใช้ https://, mailto:, tel: หรือ /");
        if (result.success) {
          updateNode("href", v);
          test.href = previewHref(v || "/");
        }
      });
      checkbox(g, "เปิดแท็บใหม่", n.newTab, (v) => selected().newTab = v);
      if (n.href.startsWith("/")) checkbox(g, "ดาวน์โหลดไฟล์", n.download, (v) => selected().download = v);
      const test = node("a", "ทดสอบปลายทาง", "designer-destination-test");
      const href = n.href || "/";
      test.href = previewHref(href);
      test.target = "_blank";
      test.rel = "noopener noreferrer";
      g.append(test);
      const presets = group("เลือกแบบปุ่ม"), presetGrid = node("div", void 0, "designer-button-presets");
      presets.append(presetGrid);
      for (const preset of BUTTON_PRESETS) {
        const b = button(preset.name, () => mutate(() => {
          applyButtonPreset(selected(), preset.id, getProfile().website.theme.accent, getProfile().website.theme.ink);
          fitDesignNode(selected(), section().height);
        }), null, "designer-button-preset"), sample = node("span", preset.id === "icon" ? "↗" : preset.id === "circle" ? "↗" : "Button", "button-preset-sample preset-" + preset.id);
        sample.setAttribute("aria-hidden", "true");
        if (preset.id === "icon" || preset.id === "circle") sample.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="' + BUTTON_ICONS.diagonal + '"/></svg>';
        b.prepend(sample);
        presetGrid.append(b);
      }
      const style = group("รูปแบบปุ่ม");
      field(style, "แบบปุ่ม", n.buttonStyle, (v) => {
        selected().color = ["solid", "gradient"].includes(v) ? "#ffffff" : getProfile().website.theme.ink;
        updateNode("buttonStyle", v);
        queueMicrotask(renderInspector);
      }, { options: [["solid", "พื้นทึบ"], ["outline", "เส้นขอบ"], ["text", "ข้อความ"], ["soft", "สีอ่อน"], ["gradient", "ไล่สี"]] });
      field(style, "เมื่อชี้ปุ่ม", n.hover, (v) => updateNode("hover", v), { options: [["none", "นิ่ง"], ["lift", "ลอยขึ้น"], ["scale", "ขยายเบา ๆ"], ["fill", "เปลี่ยนสี"], ["wipe", "สีไหลผ่าน"]] });
      field(style, "สีเมื่อชี้", n.hoverBackground, (v) => updateNode("hoverBackground", v), { type: "color" });
      field(style, "สีข้อความเมื่อชี้", n.hoverColor, (v) => updateNode("hoverColor", v), { type: "color" });
      field(style, "ความหนาขอบ", n.borderWidth, (v) => updateNode("borderWidth", v), { type: "number", min: 0, max: 8 });
      field(style, "ไอคอน", n.buttonIcon, (v) => updateNode("buttonIcon", v), { options: [["none", "ไม่มี"], ["arrow", "ลูกศรขวา"], ["diagonal", "ลูกศรเฉียง"], ["download", "ดาวน์โหลด"], ["mail", "อีเมล"], ["play", "เล่น"], ["chevron", "ถัดไป"]] });
      field(style, "ตำแหน่งไอคอน", n.iconPosition, (v) => updateNode("iconPosition", v), { options: [["left", "ซ้าย"], ["right", "ขวา"]] });
      checkbox(style, "แสดงเฉพาะไอคอน", n.iconOnly, (v) => {
        selected().iconOnly = v;
        if (v && selected().buttonIcon === "none") selected().buttonIcon = "diagonal";
      });
      checkbox(style, "เงาปุ่ม", n.shadow, (v) => selected().shadow = v);
    }
    if (n.type === "projects") {
      const g = group("ผลงานจาก Studio");
      field(g, "จำนวนคอลัมน์", n.columns, (v) => {
        selected().columns = Number(v);
        renderCanvas();
      }, { options: [["1", "1"], ["2", "2"], ["3", "3"]] });
      field(g, "จำนวนผลงาน", n.limit, (v) => {
        selected().limit = v;
        renderCanvas();
      }, { type: "number", min: 1, max: 30 });
      g.append(node("p", "ใช้ภาพปก ชื่อ และลำดับล่าสุดจากแท็บผลงาน", "designer-hint"));
    }
    const motion = group("Motion");
    field(motion, "เอฟเฟกต์", n.motion, (v) => {
      updateNode("motion", v);
      playMotion();
      queueMicrotask(renderInspector);
    }, { options: [["none", "ไม่มี"], ["fade", "Fade · ค่อย ๆ ปรากฏ"], ["rise", "Slide · เลื่อนขึ้น"], ["left", "Slide · จากซ้าย"], ["right", "Slide · จากขวา"], ["zoom", "Zoom · ขยายเข้า"], ["stagger", "Stagger · ทีละคำ"]] });
    if (n.motion !== "none") {
      const timing = node("div", void 0, "designer-property-grid");
      motion.append(timing);
      field(timing, "เวลา (วินาที)", n.motionDuration, (v) => updateNode("motionDuration", v), { type: "number", min: 0.2, max: 2.5, step: 0.1 });
      field(timing, "หน่วง (วินาที)", n.motionDelay, (v) => updateNode("motionDelay", v), { type: "number", min: 0, max: 2, step: 0.1 });
    }
    motion.append(button("เล่น motion", playMotion));
    const geometry = group("จัดวาง"), grid = node("div", void 0, "designer-property-grid");
    geometry.append(grid);
    for (const [key, label, min, max] of [["x", "X", 0, 1176], ["y", "Y", 0, 2376], ["width", "กว้าง", 24, 1200], ["height", "สูง", 24, 2400]]) {
      const input = field(grid, label, n[key], (v) => updateNode(key, v), { type: "number", min, max });
      input.disabled = n.locked;
      input.addEventListener("change", () => input.value = selected()?.[key] ?? "");
    }
    const aligns = node("div", void 0, "designer-property-actions");
    for (const [v, label] of [["left", "ชิดซ้าย"], ["center", "กึ่งกลาง"], ["right", "ชิดขวา"]]) {
      const alignButton = button(label, () => mutate(() => {
        const n2 = selected();
        n2.x = v === "left" ? 40 : v === "right" ? 1160 - n2.width : (1200 - n2.width) / 2;
        fitDesignNode(n2, section().height);
      }));
      alignButton.disabled = n.locked;
      aligns.append(alignButton);
    }
    geometry.append(aligns);
    const layer = node("div", void 0, "designer-property-actions");
    layer.append(button("ไปด้านหน้า", () => moveNode(1), "up"), button("ไปด้านหลัง", () => moveNode(-1), "down"));
    geometry.append(layer);
    if (page().sections.length > 1) {
      const move = node("select");
      move.setAttribute("aria-label", "ย้ายไปส่วนอื่น");
      const prompt = node("option", "ย้ายไปส่วนอื่น");
      prompt.value = "";
      move.append(prompt);
      page().sections.filter((s2) => s2.id !== section().id).forEach((s2) => {
        const o = node("option", s2.name);
        o.value = s2.id;
        move.append(o);
      });
      move.onchange = () => {
        if (!move.value) return;
        mutate(() => {
          const target = read()[pageKey].sections.find((s2) => s2.id === move.value);
          if (target.nodes.length >= 40) throw new Error("ส่วนปลายทางมีครบ 40 องค์ประกอบแล้ว");
          const n2 = selected();
          section().nodes = section().nodes.filter((x) => x.id !== n2.id);
          fitDesignNode(n2, target.height);
          target.nodes.push(n2);
          sectionId = target.id;
        });
      };
      geometry.append(move);
    }
    const appearance = group("รูปแบบ");
    if (["shape", "button", "image"].includes(n.type)) {
      field(appearance, "สีพื้น", n.background, (v) => updateNode("background", v), { type: "color" });
      field(appearance, "มุมโค้ง", n.radius, (v) => updateNode("radius", v), { type: "number", min: 0, max: 600 });
    }
    field(appearance, "ความทึบ", n.opacity, (v) => updateNode("opacity", v), { type: "number", min: 0.05, max: 1, step: 0.05 });
    checkbox(appearance, "ซ่อนบนมือถือ", n.mobileHidden, (v) => selected().mobileHidden = v);
  }
  function playMotion() {
    stopPlayback();
    const box = artboard.querySelector(".designer-selected");
    if (box) stopPlayback = animateCanvasNode(box);
  }
  const templateLibrary = mountTemplateLibrary({ api, getProfile, getProjects, getPageKey: () => pageKey, onError, onApply: async (design, name) => {
    await checkpoint("ก่อนใช้ " + name, "template");
    mutate(() => {
      read()[pageKey] = design;
      read()[pageKey].enabled = true;
      sectionId = "";
      selectedId = "";
    });
  }, onDefault: resetDefault });
  function showFormats(id) {
    return templateLibrary.open(typeof id === "string" ? id : void 0);
  }
  async function resetDefault() {
    await checkpoint("ก่อนกลับ Default · " + pageKey, "default");
    mutate(() => {
      read()[pageKey] = designPageSchema.parse({});
      delete seeds[pageKey];
      sectionId = "";
      selectedId = "";
    });
  }
  function addElement(type) {
    if (section().nodes.length >= 40) return onError(new Error("ส่วนนี้มีครบ 40 องค์ประกอบแล้ว"));
    const insert = (asset) => mutate(() => {
      const s = section(), n = designNodeSchema.parse({ id: crypto.randomUUID(), type, name: names[type], align: type === "button" ? "center" : "left", x: 80, y: Math.min(100 + s.nodes.length * 20, s.height - 240), width: type === "button" ? 300 : type === "projects" ? 1040 : 480, height: type === "image" ? 340 : type === "projects" ? 480 : 120, text: type === "text" ? "Write something meaningful." : type === "button" ? "Get in touch" : "", image: asset ? { src: asset.src, alt: asset.alt || "" } : null, fontSize: type === "text" ? 40 : 22, color: type === "button" ? "#ffffff" : getProfile().website.theme.ink, background: type === "button" ? getProfile().website.theme.accent : getProfile().website.theme.surface, radius: type === "button" ? 80 : 0, mobileHidden: type === "shape" });
      if (n.y + n.height > s.height) s.height = Math.min(2400, n.y + n.height + 80);
      fitDesignNode(n, s.height);
      s.nodes.push(n);
      selectedId = n.id;
    });
    if (type === "image") chooseMedia(false, (assets) => insert(assets[0]));
    else insert();
  }
  function duplicateNode() {
    if (!selected() || section().nodes.length >= 40) return;
    mutate(() => {
      const n = copy(selected());
      n.id = crypto.randomUUID();
      n.name = (n.name || names[n.type]) + " copy";
      n.x += 24;
      n.y += 24;
      fitDesignNode(n, section().height);
      section().nodes.push(n);
      selectedId = n.id;
    });
  }
  function deleteNode() {
    if (!selected()) return;
    mutate(() => {
      section().nodes = section().nodes.filter((n) => n.id !== selectedId);
      selectedId = "";
    });
  }
  function moveNode(delta) {
    mutate(() => {
      const list = section().nodes, i = list.findIndex((n) => n.id === selectedId), to = clamp(i + delta, 0, list.length - 1);
      [list[i], list[to]] = [list[to], list[i]];
    });
  }
  function moveSection(delta) {
    mutate(() => {
      const list = read()[pageKey].sections, i = list.findIndex((s) => s.id === sectionId), to = clamp(i + delta, 0, list.length - 1);
      [list[i], list[to]] = [list[to], list[i]];
    });
  }
  function duplicateSection() {
    if (page().sections.length >= 16) return;
    mutate(() => {
      const s = copy(section());
      s.id = crypto.randomUUID();
      s.name += " copy";
      s.nodes.forEach((n) => n.id = crypto.randomUUID());
      read()[pageKey].sections.splice(read()[pageKey].sections.indexOf(section()) + 1, 0, s);
      sectionId = s.id;
      selectedId = "";
    });
  }
  function deleteSection() {
    if (page().sections.length === 1) {
      mutate(() => {
        section().nodes = [];
        selectedId = "";
      });
      return;
    }
    mutate(() => {
      read()[pageKey].sections = read()[pageKey].sections.filter((s) => s.id !== section().id);
      sectionId = "";
      selectedId = "";
    });
  }
  function addSection(template) {
    if (page().sections.length >= 16) return onError(new Error("ใช้ได้สูงสุด 16 ส่วนต่อหน้า"));
    mutate(() => {
      const theme = getProfile().website.theme, id = () => crypto.randomUUID(), n = (type, attrs) => designNodeSchema.parse({ id: id(), type, x: 80, y: 80, width: 1040, height: 140, color: theme.ink, background: theme.surface, lineHeight: attrs.tag && attrs.tag !== "p" ? 1.12 : 1.4, align: type === "button" ? "center" : "left", ...attrs });
      let nodes = [], height = 720, name = "Blank";
      if (template === "split") {
        name = "Image & text";
        nodes = [n("image", { width: 480, height: 560 }), n("text", { text: "A new perspective.", tag: "h2", fontSize: 58, x: 640, y: 140, width: 480, height: 200 }), n("text", { text: "Tell the story behind your work.", fontSize: 24, x: 640, y: 400, width: 480, height: 170 })];
      }
      if (template === "hero") {
        name = "Statement";
        height = 560;
        nodes = [n("text", { text: "Ideas made meaningful.", fontSize: 100, tag: "h1", height: 330 }), n("button", { text: "Explore my work", href: "/portfolio/", fontSize: 22, y: 420, width: 300, height: 70, background: theme.accent, color: "#ffffff", radius: 80 })];
      }
      if (template === "gallery") {
        name = "Selected work";
        height = 1300;
        nodes = [n("text", { text: "Selected work.", fontSize: 52, tag: "h2", height: 100 }), n("projects", { y: 240, height: 980 })];
      }
      if (template === "quote") {
        name = "Quote";
        height = 560;
        nodes = [n("text", { text: "“Good questions lead to meaningful answers.”", fontSize: 62, tag: "h2", y: 120, height: 320, align: "center" })];
      }
      const s = designSectionSchema.parse({ id: id(), name, height, background: theme.background, nodes });
      read()[pageKey].sections.push(s);
      sectionId = s.id;
      selectedId = "";
    });
  }
  function showLayouts() {
    const dialog = node("dialog", void 0, "designer-layout-dialog"), heading = node("div", void 0, "dialog-heading");
    heading.append(node("h2", "เพิ่มเลย์เอาต์"), button("ปิด", () => dialog.close()));
    const grid = node("div", void 0, "designer-layout-options");
    for (const [key, label, desc] of [["hero", "หัวเรื่องใหญ่", "Aa"], ["split", "รูป + ข้อความ", "▧ Aa"], ["gallery", "ผลงาน", "▧ ▧"], ["quote", "คำพูด", "“ Aa ”"], ["blank", "พื้นที่ว่าง", "+"]]) {
      const b = button(label, () => {
        dialog.close();
        addSection(key);
      }, null, "designer-layout-card");
      const thumb = node("div", desc, "designer-layout-thumb template-" + key);
      b.prepend(thumb);
      grid.append(b);
    }
    dialog.append(heading, grid);
    document.body.append(dialog);
    dialog.onclose = () => dialog.remove();
    dialog.showModal();
  }
  artboard.addEventListener("click", (event) => {
    if (event.target.closest("a")) event.preventDefault();
    if (event.target.closest(".designer-handle")) return;
    const box = event.target.closest("[data-node-id]");
    if (!editing) select(box?.dataset.nodeId || "");
  });
  artboard.addEventListener("dblclick", (event) => {
    const box = event.target.closest("[data-node-id]"), n = section().nodes.find((n2) => n2.id === box?.dataset.nodeId), text = box?.querySelector("[data-editable-text]");
    if (!n || n.locked) return;
    if (n.type === "image") {
      selectedId = n.id;
      chooseMedia(false, (assets) => mutate(() => selected().image = { src: assets[0].src, alt: assets[0].alt || "" }));
      return;
    }
    if (!text) return;
    event.preventDefault();
    snapshot();
    activate();
    selectedId = n.id;
    editing = true;
    text.contentEditable = "plaintext-only";
    text.setAttribute("role", "textbox");
    text.setAttribute("aria-label", "แก้ข้อความบนหน้าเว็บ");
    text.focus();
    const current = selected();
    text.oninput = () => {
      current.text = text.innerText.slice(0, 8e3);
      changed();
    };
    text.onblur = () => {
      editing = false;
      text.removeAttribute("contenteditable");
      text.removeAttribute("role");
      text.removeAttribute("aria-label");
      renderLayers();
      const input = inspector.querySelector("textarea");
      if (input) input.value = current.text;
      box.setAttribute("aria-label", (current.name || names[current.type]) + ": " + current.text.slice(0, 100));
      resize();
    };
  });
  artboard.addEventListener("pointerdown", (event) => {
    if (device !== "desktop" || editing || event.button !== 0) return;
    const box = event.target.closest("[data-node-id]");
    if (!box) return;
    const n = section().nodes.find((n2) => n2.id === box.dataset.nodeId);
    if (!n || n.locked) return;
    select(n.id);
    stopPlayback();
    gesture = { id: n.id, start: copy(n), px: event.clientX, py: event.clientY, corner: event.target.dataset.resize || "", dirty: false };
    box.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  artboard.addEventListener("pointermove", (event) => {
    if (!gesture) return;
    const dx = (event.clientX - gesture.px) / scale, dy = (event.clientY - gesture.py) / scale;
    if (!gesture.dirty && Math.hypot(dx, dy) < 3) return;
    if (!gesture.dirty) {
      snapshot();
      activate();
      gesture.dirty = true;
    }
    const n = selected(), a = gesture.start, c = gesture.corner, snap = (v) => event.altKey ? Math.round(v) : Math.round(v / 8) * 8;
    if (!n) return;
    if (c) {
      const right = a.x + a.width, bottom = a.y + a.height;
      let x = c.includes("w") ? clamp(snap(a.x + dx), 0, right - 24) : a.x, y = c.includes("n") ? clamp(snap(a.y + dy), 0, bottom - 24) : a.y, w = c.includes("w") ? right - x : clamp(snap(a.width + dx), 24, 1200 - a.x), h = c.includes("n") ? bottom - y : clamp(snap(a.height + dy), 24, section().height - a.y);
      if (event.shiftKey || n.type === "image" && !event.altKey) {
        h = w * a.height / a.width;
      }
      Object.assign(n, { x, y, width: w, height: h });
    } else {
      n.x = snap(a.x + dx);
      n.y = snap(a.y + dy);
      if (Math.abs(n.x + n.width / 2 - 600) < 8) n.x = (1200 - n.width) / 2;
    }
    fitDesignNode(n, section().height);
    const box = artboard.querySelector(`[data-node-id="${n.id}"]`);
    box.setAttribute("style", designNodeStyle(n, section().nodes.indexOf(n)));
    box.classList.add("designer-dragging");
    artboard.classList.toggle("designer-center-guide", Math.abs(n.x + n.width / 2 - 600) < 1);
  });
  function finishGesture(cancel = false) {
    if (!gesture) return;
    const g = gesture;
    gesture = null;
    artboard.classList.remove("designer-center-guide");
    if (g.dirty) {
      if (cancel) {
        getProfile().website.designer = past.pop();
        onChange();
      } else changed();
      render();
    }
  }
  artboard.addEventListener("pointerup", () => finishGesture());
  artboard.addEventListener("pointercancel", () => finishGesture(true));
  artboard.addEventListener("keydown", (event) => {
    if (event.target.isContentEditable || event.target.matches("input,textarea,select")) return;
    const n = selected();
    if (event.key === "Escape") {
      select("");
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
      event.preventDefault();
      duplicateNode();
      return;
    }
    if (!n || n.locked) return;
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteNode();
      return;
    }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) && device === "desktop") {
      event.preventDefault();
      mutate(() => {
        const n2 = selected(), delta = event.shiftKey ? 10 : 1;
        n2.x += event.key === "ArrowLeft" ? -delta : event.key === "ArrowRight" ? delta : 0;
        n2.y += event.key === "ArrowUp" ? -delta : event.key === "ArrowDown" ? delta : 0;
        fitDesignNode(n2, section().height);
      });
      artboard.querySelector(`[data-node-id="${selectedId}"]`)?.focus();
    }
  });
  root.addEventListener("keydown", (event) => {
    if (editing || event.target.matches("input,textarea,select")) return;
    if ((event.ctrlKey || event.metaKey) && ["z", "y"].includes(event.key.toLowerCase())) {
      event.preventDefault();
      history(event.shiftKey || event.key.toLowerCase() === "y" ? 1 : -1);
    }
  });
  stage.addEventListener("dragover", (e) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      stage.classList.add("designer-drop-active");
    }
  });
  stage.addEventListener("dragleave", () => stage.classList.remove("designer-drop-active"));
  stage.addEventListener("drop", async (e) => {
    e.preventDefault();
    stage.classList.remove("designer-drop-active");
    try {
      const assets = await uploadFiles(Array.from(e.dataTransfer.files).slice(0, 1));
      if (!assets.length) return;
      mutate(() => {
        const s = section(), bounds = artboard.querySelector(".canvas-section-inner").getBoundingClientRect(), n = designNodeSchema.parse({ id: crypto.randomUUID(), type: "image", name: "รูปภาพ", image: { src: assets[0].src, alt: assets[0].alt || "" }, x: device === "mobile" ? 80 : (e.clientX - bounds.left) / scale, y: device === "mobile" ? 80 : (e.clientY - bounds.top) / scale, width: 480, height: 340 });
        fitDesignNode(n, s.height);
        s.nodes.push(n);
        selectedId = n.id;
      });
    } catch (error) {
      onError(error);
    }
  });
  function render() {
    if (!getProfile()) return;
    const s = section();
    sectionId = s.id;
    if (!s.nodes.some((n) => n.id === selectedId)) selectedId = "";
    pageSelect.value = pageKey;
    toggle.checked = !!read()[pageKey].enabled;
    root.classList.toggle("designer-mobile-mode", device === "mobile");
    modes.querySelectorAll("[data-device]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.device === device)));
    renderRail();
    renderCanvas();
    renderInspector();
    updateHistory();
  }
  return { render, resize, openTemplate(id, key) {
    if (["about", "work", "contact"].includes(key)) pageKey = key;
    sectionId = "";
    selectedId = "";
    render();
    return templateLibrary.open(id);
  }, reset() {
    seeds = {};
    past = [];
    future = [];
    sectionId = "";
    selectedId = "";
    stopPlayback();
  } };
}
