import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

const SRC = path.resolve("src");
const OUT = path.join(SRC, "styles", "light-theme.css");
const PREFIX = 'html[data-theme="light"]';

const KEEP_DARK = /overlay|stories-hero|events-hero|events-featured|event-banner|featured-story|read-featured|featured-save|story-image-top|story-card-number|story-category|story-bookmark|hero-glow|fh-maintenance|player|lightbox|video|leaflet|swiper-button|image-top|on-image|character-card-info|char-card-overlay/i;

const COLOR_PROPS = /^(color|background|background-color|background-image|border|border-(top|right|bottom|left)(-color)?|border-color|outline|outline-color|box-shadow|text-shadow|fill|stroke|caret-color|accent-color|--.*)$/;

const BG_LONGHANDS = /^(-webkit-)?background-(clip|size|position|repeat|origin|attachment|blend-mode)$|^-webkit-text-fill-color$/;

const GLOBAL_ORDER = [
  "styles/global/variables.css",
  "styles/global/global.css",
  "styles/global/animations.css",
  "styles/theme.css",
  "styles/orange-ui.css",
  "styles/features.css",
  "index.css",
];

function listCss(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listCss(full);
    return entry.name.endsWith(".css") ? [full] : [];
  });
}

const NAMED = { white: [255, 255, 255], black: [0, 0, 0] };
const COLOR_RE = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|rgba?\([^)]*\)|\b(?:white|black)\b/gi;

function parseColor(token) {
  const t = token.toLowerCase();
  if (NAMED[t]) return [...NAMED[t], 1];
  if (t.startsWith("#")) {
    let h = t.slice(1);
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  const parts = t.replace(/rgba?\(|\)/g, "").split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.slice(0, 3).some((p) => p.includes("var"))) return null;
  const [r, g, b] = parts.slice(0, 3).map(Number);
  const a = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : Number(parts[3]);
  return [r, g, b, a].some(Number.isNaN) ? null : [r, g, b, a];
}

function toHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function fromHsl([h, s, l]) {
  if (s === 0) return [l, l, l].map((v) => Math.round(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}

function format([r, g, b, a]) {
  if (a >= 1) return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  return `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})`;
}

function isBrand(rgba) {
  const [, s, l] = toHsl(rgba);
  return s >= 0.35 && l >= 0.25 && l <= 0.8;
}

function flip(rgba, isShadow, isText) {
  const [h, s, l] = toHsl(rgba);
  const a = rgba[3];
  if (isShadow) {
    return l < 0.5 ? [...rgba.slice(0, 3), a * 0.35] : [0, 0, 0, a * 0.5];
  }
  if (isBrand(rgba)) return isText && l > 0.62 ? [...fromHsl([h, s, 0.45]), a] : rgba;
  const nl = l < 0.25 ? Math.min(1, 1 - (l - 0.045) * 0.55) : 1 - l;
  return [...fromHsl([h, s, nl]), a];
}

function mapValue(value, isShadow, isText) {
  return value.replace(COLOR_RE, (token) => {
    const rgba = parseColor(token);
    return rgba ? format(flip(rgba, isShadow, isText)) : token;
  });
}

const BRAND_BG = /var\(--(orange|accent|cyan|pink|blue|gradient-primary|input-focus)\)|linear-gradient\([^)]*(#ff|#38d5)/i;

function hasBrandBackground(rule) {
  let brand = false;
  rule.walkDecls(/^background(-color)?$/, (d) => {
    const colors = d.value.match(COLOR_RE) || [];
    const solid = colors.some((c) => {
      const rgba = parseColor(c);
      return rgba && rgba[3] >= 0.6 && isBrand(rgba);
    });
    if (BRAND_BG.test(d.value) || solid) brand = true;
  });
  return brand;
}

function prefixSelector(sel) {
  const s = sel.trim();
  if (/^(:root|html)\b/.test(s)) return s.replace(/^(:root|html)/, PREFIX);
  return `${PREFIX} ${s}`;
}

const files = listCss(SRC)
  .filter((f) => f !== OUT)
  .map((f) => path.relative(SRC, f).split(path.sep).join("/"))
  .sort((a, b) => {
    const ia = GLOBAL_ORDER.indexOf(a), ib = GLOBAL_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });

const out = postcss.root();
let count = 0;

for (const file of files) {
  const root = postcss.parse(fs.readFileSync(path.join(SRC, file), "utf8"), { from: file });
  root.walkRules((rule) => {
    if (rule.parent.type === "atrule" && /keyframes/i.test(rule.parent.name)) return;
    const own = rule.selectors.filter((s) => !/data-theme/.test(s));
    if (!own.length) return;
    const keepText = hasBrandBackground(rule);

    const groups = [own.filter((s) => !KEEP_DARK.test(s)), own.filter((s) => KEEP_DARK.test(s))];
    const copies = groups.map((sels, i) => {
      if (!sels.length) return null;
      const keepDark = i === 1;
      const copy = postcss.rule({ selectors: sels.map(prefixSelector) });
      let resetsBackground = false;
      rule.each((d) => {
        if (d.type !== "decl") return;
        if (resetsBackground && BG_LONGHANDS.test(d.prop)) {
          copy.append(postcss.decl({ prop: d.prop, value: d.value, important: d.important }));
          return;
        }
        if (!COLOR_PROPS.test(d.prop)) return;
        if (d.prop === "background") resetsBackground = true;
        const skip = keepDark || (keepText && d.prop === "color");
        const isText = d.prop === "color" || /^--.*(text|light)/.test(d.prop);
        const value = skip ? d.value : mapValue(d.value, /shadow/.test(d.prop), isText);
        copy.append(postcss.decl({ prop: d.prop, value, important: d.important }));
      });
      return copy.nodes.length ? copy : null;
    }).filter(Boolean);
    if (!copies.length) return;

    let target = out;
    const chain = [];
    for (let p = rule.parent; p && p.type === "atrule"; p = p.parent) chain.unshift(p);
    for (const at of chain) {
      const wrapper = postcss.atRule({ name: at.name, params: at.params });
      target.append(wrapper);
      target = wrapper;
    }
    copies.forEach((copy) => target.append(copy));
    count += copies.length;
  });
}

fs.writeFileSync(OUT, out.toString() + "\n");
console.log(`light-theme.css: ${count} rules from ${files.length} files`);
