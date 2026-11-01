import { designMotionFrames, designMotionTiming } from "./design-motion.ts";
export function animateCanvasNode(node) {
  const effect = node.dataset.canvasMotion, frames = designMotionFrames(effect);
  if (!frames.length || matchMedia("(prefers-reduced-motion:reduce)").matches) return () => {
  };
  const target = node.querySelector(":scope > .canvas-content") || node, options = designMotionTiming(Number(node.dataset.motionDuration), Number(node.dataset.motionDelay));
  let animations = [], restore = () => {
  };
  const text = target.querySelector(".canvas-text");
  if (effect === "stagger" && text && !text.isContentEditable) {
    const source = text.textContent, fragment = document.createDocumentFragment();
    let index = 0;
    source.split(/(\s+)/).forEach((word) => {
      if (!word) return;
      if (/^\s+$/.test(word)) {
        fragment.append(document.createTextNode(word));
        return;
      }
      const span = document.createElement("span");
      span.className = "canvas-motion-word";
      span.textContent = word;
      fragment.append(span);
      index++;
    });
    text.replaceChildren(fragment);
    animations = [...text.querySelectorAll(".canvas-motion-word")].map((word, i) => word.animate(frames, { ...options, delay: options.delay + Math.min(i * 35, 600) }));
    restore = () => {
      if (text.textContent === source && !text.isContentEditable) text.replaceChildren(document.createTextNode(source));
    };
  } else animations = [target.animate(frames, options)];
  node.dataset.motionPlaying = "true";
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    animations.forEach((animation) => animation.cancel());
    restore();
    delete node.dataset.motionPlaying;
  };
  Promise.all(animations.map((animation) => animation.finished)).then(finish).catch(() => {
  });
  return finish;
}
export function startCanvasMotion(root = document) {
  const reduced = matchMedia("(prefers-reduced-motion:reduce)"), cleanups = [];
  if (reduced.matches || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) {
      cleanups.push(animateCanvasNode(entry.target));
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  root.querySelectorAll('[data-canvas-motion]:not([data-canvas-motion="none"])').forEach((node) => observer.observe(node));
  reduced.addEventListener("change", () => {
    observer.disconnect();
    cleanups.forEach((cleanup) => cleanup());
  }, { once: true });
}
