// UI Moods · Block renderer for app reference screens.
//
// An app screen is declared as data: an ordered list of blocks, each with a
// `type` and type-specific props. This module turns that data into HTML.
//
// The renderer never emits a color, radius, shadow or font of its own — it
// only references var(--mood-*) custom properties, so any screen inherits the
// full visual language of whichever mood it is rendered with.

import { icon, escapeAttr } from "./icons.mjs";

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/* ------------------------------------------------------------ helpers */

// Tones are semantic, never literal colors: the stylesheet maps each tone
// name onto var(--mood-colors-*) so a screen keeps the mood's palette.
const TONES = ["ok", "warn", "danger", "accent", "up", "down"];

function toneClass(tone) {
  return tone && TONES.includes(tone) ? ` ${tone}` : "";
}

function toneAttr(tone) {
  return tone && TONES.includes(tone) ? ` ${tone}` : "";
}

/* -------------------------------------------------------------- blocks */

const BLOCKS = {
  /* --- app chrome --- */

  statusbar: (b) => {
    const time = esc(b.time ?? "9:41");
    const right = [
      `<span class="sb-icons">${icon("signal")}${icon("wifi")}${icon("battery")}</span>`,
    ].join("");
    return `<div class="statusbar"><span>${time}</span>${right}</div>`;
  },

  navbar: (b) => {
    const left = b.back
      ? `<span class="nav-icon">${icon("chevronLeft")}</span>`
      : b.icon
        ? `<span class="nav-icon">${icon(b.icon)}</span>`
        : "";
    const sub = b.subtitle ? `<span class="nav-sub">${esc(b.subtitle)}</span>` : "";
    const action = b.action
      ? `<span class="nav-action${b.actionGhost ? " ghost" : ""}">${esc(b.action)}</span>`
      : "";
    return (
      `<div class="navbar">${left}` +
      `<span class="nav-title">${esc(b.title ?? "")}${sub}</span>${action}</div>`
    );
  },

  tabbar: (b) => {
    const items = (b.items ?? [])
      .map((it) => {
        const badge = it.badge ? `<span class="tab-badge">${esc(it.badge)}</span>` : "";
        return (
          `<span class="tab${it.active ? " active" : ""}">` +
          `${icon(it.icon ?? "circle")}${badge}` +
          `<span class="tab-label">${esc(it.label ?? "")}</span></span>`
        );
      })
      .join("");
    return `<div class="tabbar">${items}</div>`;
  },

  /* --- headings --- */

  header: (b) => {
    const meta = (b.meta ?? [])
      .map((m) => `<span class="badge${toneAttr(m.tone)}">${esc(m.label)}</span>`)
      .join("");
    return (
      `<div class="hdr-large"><span class="hdr-title">${esc(b.title ?? "")}</span>` +
      (b.subtitle ? `<span class="hdr-sub">${esc(b.subtitle)}</span>` : "") +
      (meta ? `<span class="hdr-meta">${meta}</span>` : "") +
      `</div>`
    );
  },

  sectionHead: (b) =>
    `<div class="section-head"><span class="sh-title">${esc(b.title ?? "")}</span>` +
    (b.action ? `<span class="sh-action">${esc(b.action)}</span>` : "") +
    `</div>`,

  /* --- content --- */

  card: (b) => {
    const media = b.media
      ? `<div class="card-media">${b.mediaTag ? `<span class="cm-tag">${esc(b.mediaTag)}</span>` : ""}</div>`
      : "";
    const badge = b.badge
      ? `<span class="badge${toneAttr(b.badgeTone)}">${esc(b.badge)}</span>`
      : "";
    const title = b.title ? `<span class="card-title">${esc(b.title)}</span>` : "";
    const sub = b.sub ? `<span class="card-sub">${esc(b.sub)}</span>` : "";
    const body = b.body ? `<span class="card-sub">${esc(b.body)}</span>` : "";
    const inner = title || sub || badge || body
      ? `<div class="card-body">${title}${sub}${body}${badge}</div>`
      : "";
    const foot = b.price || b.actions
      ? `<div class="card-foot">` +
        (b.price ? `<span class="card-price">${esc(b.price)}</span>` : "") +
        (b.actions
          ? `<span class="card-actions">${b.actions
              .map(
                (a) =>
                  `<span class="btn${a.primary ? " primary" : ""}">${esc(a.label)}</span>`,
              )
              .join("")}</span>`
          : "") +
        `</div>`
      : "";
    return (
      `<div class="card${b.flat ? " flat" : ""}${b.tint ? " tint" : ""}">${media}${inner}${foot}</div>`
    );
  },

  list: (b) => {
    const items = (b.items ?? [])
      .map((it) => {
        const lead = it.icon
          ? `<span class="li-icon">${icon(it.icon)}</span>`
          : it.avatar
            ? `<span class="avatar sm">${esc(it.avatar)}</span>`
            : "";
        const body =
          `<span class="li-body">` +
          `<span class="li-title">${esc(it.title ?? "")}</span>` +
          (it.sub ? `<span class="li-sub">${esc(it.sub)}</span>` : "") +
          `</span>`;
        const trail =
          it.value || it.chev || it.badge
            ? `<span class="li-trail">` +
              (it.badge ? `<span class="badge${toneAttr(it.badgeTone)}">${esc(it.badge)}</span>` : "") +
              (it.value ? `<span class="li-value${toneClass(it.valueTone)}">${esc(it.value)}</span>` : "") +
              (it.chev ? `<span class="li-chev">${icon("chevronRight")}</span>` : "") +
              `</span>`
            : "";
        return `<div class="li">${lead}${body}${trail}</div>`;
      })
      .join("");
    return `<div class="list">${items}</div>`;
  },

  statGrid: (b) => {
    const cells = (b.items ?? [])
      .map(
        (it) =>
          `<div class="stat">` +
          `<span class="stat-label">${esc(it.label ?? "")}</span>` +
          `<span class="stat-value">${esc(it.value ?? "")}</span>` +
          (it.delta
            ? `<span class="stat-delta${toneClass(it.deltaTone)}">${esc(it.delta)}</span>`
            : "") +
          `</div>`,
      )
      .join("");
    return `<div class="stat-grid${b.cols === 3 ? " cols-3" : ""}">${cells}</div>`;
  },

  bars: (b) => {
    const max = Math.max(...(b.items ?? []).map((i) => Number(i.value) || 0), 1);
    const cols = (b.items ?? [])
      .map(
        (it) =>
          `<div class="col${it.alt ? " alt" : ""}">` +
          `<i style="height:${Math.round(((Number(it.value) || 0) / max) * 100)}%"></i>` +
          `<em>${esc(it.label ?? "")}</em></div>`,
      )
      .join("");
    const legend = b.legend
      ? `<div class="chart-legend">${b.legend
          .map(
            (l) =>
              `<span class="lg${l.alt ? " alt" : toneClass(l.tone)}"><i></i>${esc(l.label)}</span>`,
          )
          .join("")}</div>`
      : "";
    return (
      `<div class="chart-card">` +
      `<div><div class="chart-title">${esc(b.title ?? "")}</div>` +
      (b.sub ? `<div class="chart-sub">${esc(b.sub)}</div>` : "") + `</div>` +
      `<div class="chart-bars">${cols}</div>${legend}</div>`
    );
  },

  donut: (b) => {
    const R = 34;
    const C = 2 * Math.PI * R;
    const total = (b.segments ?? []).reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
    const tones = { ok: "var(--mood-colors-ok)", warn: "var(--mood-colors-warn)", danger: "var(--mood-colors-danger)" };
    let offset = 0;
    const arcs = (b.segments ?? [])
      .map((s) => {
        const frac = (Number(s.value) || 0) / total;
        const dash = `${(frac * C).toFixed(2)} ${(C - frac * C).toFixed(2)}`;
        const color = s.tone && tones[s.tone] ? tones[s.tone] : "var(--mood-colors-accent)";
        const seg = `<circle cx="40" cy="40" r="${R}" fill="none" stroke="${color}" stroke-width="12" stroke-dasharray="${dash}" stroke-dashoffset="${(-offset * C).toFixed(2)}" transform="rotate(-90 40 40)"/>`;
        offset += frac;
        return seg;
      })
      .join("");
    const legend = (b.segments ?? [])
      .map(
        (s) =>
          `<span class="dl"><span>${esc(s.label ?? "")}</span><b>${esc(String(s.value ?? ""))}</b></span>`,
      )
      .join("");
    return (
      `<div class="chart-card">` +
      `<div><div class="chart-title">${esc(b.title ?? "")}</div>` +
      (b.sub ? `<div class="chart-sub">${esc(b.sub)}</div>` : "") + `</div>` +
      `<div class="chart-donut"><svg class="donut" width="80" height="80" viewBox="0 0 80 80">${arcs}</svg>` +
      `<span class="dlegend">${legend}</span></div></div>`
    );
  },

  progress: (b) =>
    `<div class="card flat tint" style="display:flex;flex-direction:column;gap:8px">` +
    `<div class="progress-row"><span>${esc(b.label ?? "")}</span><b>${esc(b.value ?? "")}</b></div>` +
    `<div class="progress${toneClass(b.tone)}"><i style="width:${Math.max(0, Math.min(100, Number(b.pct) || 0))}%"></i></div>` +
    `</div>`,

  /* --- forms --- */

  // Container block: groups nested blocks into a form flow.
  form: (b) => `<div class="form">${renderBlocks(b.blocks ?? [])}</div>`,

  // `type` selects the block; `input` selects the HTML input kind.
  field: (b) => {
    const cls = b.state ? ` ${b.state}` : "";
    if (b.input === "textarea") {
      return (
        `<div class="field"><label>${esc(b.label ?? "")}</label>` +
        `<textarea class="input${cls}" rows="${b.rows ?? 4}" placeholder="${escapeAttr(b.placeholder ?? "")}">${esc(b.value ?? "")}</textarea>` +
        (b.help ? `<span class="help${b.state === "err" ? " err" : ""}">${esc(b.help)}</span>` : "") +
        `</div>`
      );
    }
    if (b.input === "select") {
      const opts = (b.options ?? [])
        .map((o) => `<option${o === b.value ? " selected" : ""}>${esc(o)}</option>`)
        .join("");
      return (
        `<div class="field"><label>${esc(b.label ?? "")}</label>` +
        `<select class="input">${opts}</select>` +
        (b.help ? `<span class="help">${esc(b.help)}</span>` : "") +
        `</div>`
      );
    }
    return (
      `<div class="field"><label>${esc(b.label ?? "")}</label>` +
      `<input class="input${cls}" type="${esc(b.input ?? "text")}" placeholder="${escapeAttr(b.placeholder ?? "")}" value="${escapeAttr(b.value ?? "")}"${b.readonly ? " readonly" : ""}>` +
      (b.help ? `<span class="help${b.state === "err" ? " err" : ""}">${esc(b.help)}</span>` : "") +
      `</div>`
    );
  },

  formGroup: (b) => {
    const rows = (b.rows ?? [])
      .map((r) => {
        const lead = r.icon ? `<span class="li-icon">${icon(r.icon)}</span>` : "";
        let trail = "";
        if (r.type === "switch") {
          trail = `<span class="switch${r.on ? " on" : ""}"><i></i></span>`;
        } else if (r.type === "checkbox") {
          trail = `<span class="checkbox${r.checked ? " checked" : ""}">${r.checked ? icon("check") : ""}</span>`;
        } else if (r.type === "radio") {
          trail = `<span class="radio${r.checked ? " checked" : ""}"><i></i></span>`;
        } else if (r.type === "qty") {
          trail = `<span class="qty"><button type="button">−</button><span>${esc(r.value ?? "1")}</span><button type="button">+</button></span>`;
        } else if (r.value) {
          trail = `<span class="fr-hint">${esc(r.value)}</span>`;
        }
        return (
          `<div class="form-row">${lead}` +
          `<span class="fr-label">${esc(r.label ?? "")}</span>` +
          (r.hint ? `<span class="fr-hint">${esc(r.hint)}</span>` : "") +
          `${trail}</div>`
        );
      })
      .join("");
    return (
      `<div class="form-group">` +
      (b.label ? `<div class="fg-label">${esc(b.label)}</div>` : "") +
      `${rows}</div>`
    );
  },

  search: (b) =>
    `<div class="search">${icon("search")}<span>${esc(b.placeholder ?? "搜索")}</span></div>`,

  chips: (b) =>
    `<div class="chips">${(b.items ?? [])
      .map((it) => `<span class="chip${it.active ? " active" : ""}">${esc(it.label ?? "")}</span>`)
      .join("")}</div>`,

  segmented: (b) =>
    `<div class="segmented">${(b.items ?? [])
      .map((it) => `<span class="seg${it.active ? " active" : ""}">${esc(it.label ?? "")}</span>`)
      .join("")}</div>`,

  tabs: (b) =>
    `<div class="tabs">${(b.items ?? [])
      .map((it) => `<span class="tab${it.active ? " active" : ""}">${esc(it.label ?? "")}</span>`)
      .join("")}</div>`,

  filterbar: (b) =>
    `<div class="filterbar">${icon(b.icon ?? "filter")}<span>${esc(b.label ?? "")}</span>` +
    (b.value ? `<span class="fb-val">${esc(b.value)}</span>` : "") + `</div>`,

  /* --- promotion --- */

  banner: (b) =>
    `<div class="banner"><span class="bn-title">${esc(b.title ?? "")}</span>` +
    (b.sub ? `<span class="bn-sub">${esc(b.sub)}</span>` : "") +
    (b.cta ? `<span class="bn-cta">${esc(b.cta)}</span>` : "") + `</div>`,

  promo: (b) =>
    `<div class="promo"><span class="pr-icon">${icon(b.icon ?? "bolt")}</span>` +
    `<span class="pr-body"><span class="pr-title">${esc(b.title ?? "")}</span>` +
    (b.sub ? `<span class="pr-sub">${esc(b.sub)}</span>` : "") + `</span></div>`,

  notice: (b) =>
    `<div class="notice${toneClass(b.tone)}"><span class="n-mark">${esc(b.mark ?? "INFO")}</span>` +
    `<span>${esc(b.text ?? "")}</span></div>`,

  /* --- media --- */

  mediaGrid: (b) =>
    `<div class="media-grid${b.cols === 3 ? " cols-3" : ""}">${(b.items ?? [])
      .map(
        (it) =>
          `<div class="media-cell"><div class="media-thumb">${icon(it.icon ?? "image")}</div>` +
          `<span class="media-cap">${esc(it.title ?? "")}</span>` +
          (it.sub ? `<span class="media-sub">${esc(it.sub)}</span>` : "") + `</div>`,
      )
      .join("")}</div>`,

  carousel: (b) =>
    `<div class="carousel">${(b.items ?? [])
      .map(
        (it) =>
          `<div class="slide"><div class="card"><div class="card-media">` +
          (it.tag ? `<span class="cm-tag">${esc(it.tag)}</span>` : "") +
          `</div><div class="card-body"><span class="card-title">${esc(it.title ?? "")}</span>` +
          `<span class="card-sub">${esc(it.sub ?? "")}</span></div></div></div>`,
      )
      .join("")}</div>`,

  /* --- people --- */

  avatars: (b) =>
    `<div class="avatar-group">${(b.items ?? [])
      .map((it) => `<span class="avatar sm">${esc(it.initials ?? it.label ?? "")}</span>`)
      .join("")}</div>`,

  rating: (b) => {
    const full = Math.round(Number(b.value) || 0);
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="${i < full ? "" : "off"}">${icon("star")}</span>`,
    ).join("");
    return (
      `<span class="rating">${stars}</span>` +
      (b.count ? `<span class="rating-text">(${esc(b.count)})</span>` : "")
    );
  },

  profile: (b) =>
    `<div class="profile-head"><span class="avatar lg">${esc(b.initials ?? "")}</span>` +
    `<span class="pf-body">` +
    `<span class="pf-name">${esc(b.name ?? "")}</span>` +
    `<span class="pf-meta">${esc(b.meta ?? "")}</span>` +
    (b.tags
      ? `<span class="pf-tags">${b.tags
          .map((t) => `<span class="badge">${esc(t)}</span>`)
          .join("")}</span>`
      : "") +
    `</span></div>`,

  /* --- flows --- */

  timeline: (b) =>
    `<div class="timeline">${(b.items ?? [])
      .map(
        (it, i) =>
          `<div class="tl-item"><span class="tl-rail">` +
          `<span class="tl-dot${it.state ? " " + it.state : ""}"></span>` +
          (i < b.items.length - 1 ? `<span class="tl-line"></span>` : "") +
          `</span><span class="tl-body"><span class="tl-title">${esc(it.title ?? "")}</span>` +
          (it.sub ? `<span class="tl-sub">${esc(it.sub)}</span>` : "") +
          (it.time ? `<span class="tl-time">${esc(it.time)}</span>` : "") +
          `</span></div>`,
      )
      .join("")}</div>`,

  steps: (b) =>
    `<div class="steps">${(b.items ?? [])
      .map(
        (it) =>
          `<span class="step${it.state ? " " + it.state : ""}">` +
          `<span class="s-dot">${it.state === "done" ? icon("check") : esc(it.n ?? "")}</span>` +
          `<span class="s-label">${esc(it.label ?? "")}</span></span>`,
      )
      .join("")}</div>`,

  kanban: (b) =>
    `<div class="kanban">${(b.columns ?? [])
      .map(
        (col) =>
          `<div class="kb-col"><div class="kb-head">${esc(col.head ?? "")}</div>` +
          (col.cards ?? [])
            .map(
              (c) =>
                `<div class="kb-card"><div class="kb-title">${esc(c.title ?? "")}</div>` +
                (c.meta ? `<div class="kb-meta">${esc(c.meta)}</div>` : "") + `</div>`,
            )
            .join("") +
          `</div>`,
      )
      .join("")}</div>`,

  tree: (b) =>
    `<div class="tree">${(b.items ?? [])
      .map(
        (it) =>
          `<div class="tr">${icon(it.icon ?? "file")}` +
          `<span class="tr-name">${esc(it.name ?? "")}</span>` +
          (it.meta ? `<span class="tr-meta">${esc(it.meta)}</span>` : "") + `</div>`,
      )
      .join("")}</div>`,

  chat: (b) =>
    `<div class="chat-list">${(b.messages ?? [])
      .map(
        (m) =>
          `<div class="bubble${m.out ? " out" : ""}">${esc(m.text ?? "")}` +
          (m.time ? `<div class="b-time">${esc(m.time)}</div>` : "") + `</div>`,
      )
      .join("")}</div>`,

  code: (b) =>
    `<div class="code">${(b.lines ?? [])
      .map((l) => {
        const cls =
          l.kind === "key" ? "c-key" : l.kind === "str" ? "c-str" : l.kind === "cmt" ? "c-cmt" : "";
        return `<div class="${cls}">${esc(l.text ?? "")}</div>`;
      })
      .join("")}</div>`,

  order: (b) =>
    `<div class="order-card">` +
    `<div class="order-head"><span class="oh-title">${esc(b.title ?? "")}</span>` +
    (b.status ? `<span class="badge${toneAttr(b.statusTone)}">${esc(b.status)}</span>` : "") +
    `</div><div class="order-body">` +
    (b.body ?? []).map((line) => `<div class="kv"><span class="k-label">${esc(line.label ?? "")}</span><span class="k-value">${esc(line.value ?? "")}</span></div>`).join("") +
    `</div>` +
    (b.foot
      ? `<div class="order-foot"><span>${esc(b.foot.text ?? "")}</span>` +
        (b.foot.action ? `<span class="nav-action">${esc(b.foot.action)}</span>` : "") + `</div>`
      : "") +
    `</div>`,

  prices: (b) =>
    `<div class="card flat tint">${(b.items ?? [])
      .map(
        (it) =>
          `<div class="price-row${it.total ? " total" : ""}"><span${it.muted ? " class=\"pr-muted\"" : ""}>${esc(it.label ?? "")}</span>` +
          `<span class="pr-value">${esc(it.value ?? "")}</span></div>`,
      )
      .join("")}</div>`,

  kv: (b) =>
    (b.items ?? [])
      .map(
        (it) =>
          `<div class="kv"><span class="k-label">${esc(it.label ?? "")}</span><span class="k-value">${esc(it.value ?? "")}</span></div>`,
      )
      .join(""),

  /* --- feedback --- */

  empty: (b) =>
    `<div class="empty"><span class="e-icon">${icon(b.icon ?? "inbox")}</span>` +
    `<span class="e-title">${esc(b.title ?? "")}</span>` +
    (b.sub ? `<span class="e-sub">${esc(b.sub)}</span>` : "") + `</div>`,

  skeleton: (b) =>
    `<div class="skeleton-row">` +
    Array.from({ length: b.rows ?? 3 }, (_, i) =>
      `<div class="skeleton${i === b.rows - 1 ? " w60" : i % 2 ? " w80" : " w40"}"></div>`,
    ).join("") +
    `</div>`,

  toast: (b) =>
    `<div class="toast">${icon(b.icon ?? "check")}<span>${esc(b.text ?? "")}</span></div>`,

  fab: (b) => `<div class="fab">${icon(b.icon ?? "plus")}</div>`,

  sheet: (b) =>
    `<div class="sheet"><div class="sh-handle"></div>` +
    (b.title ? `<div class="sh-title">${esc(b.title)}</div>` : "") +
    (b.items ?? [])
      .map(
        (it) =>
          `<div class="sh-item${it.danger ? " danger" : ""}">${icon(it.icon ?? "chevronRight")}` +
          `<span>${esc(it.label ?? "")}</span></div>`,
      )
      .join("") +
    `</div>`,

  /* --- misc --- */

  map: (b) =>
    `<div class="map">${icon(b.icon ?? "location")}` +
    (b.pin ? `<span class="map-pin">${icon("location")}</span>` : "") +
    (b.label ? `<span style="position:absolute;bottom:10px;left:12px;font-size:var(--mood-typography-label-size)">${esc(b.label)}</span>` : "") +
    `</div>`,

  calendar: (b) =>
    `<div class="cal-strip">${(b.days ?? [])
      .map(
        (d) =>
          `<span class="cal-day${d.active ? " active" : ""}">${esc(d.label ?? "")}` +
          `<span class="cd-num">${esc(String(d.n ?? ""))}</span>` +
          (d.dot ? `<span class="cd-dot"></span>` : "") + `</span>`,
      )
      .join("")}</div>`,

  slider: (b) =>
    `<div class="slider"><div class="sl-track">` +
    `<span class="sl-fill" style="width:${Math.max(0, Math.min(100, Number(b.pct) || 0))}%"></span>` +
    `<span class="sl-knob" style="left:${Math.max(0, Math.min(100, Number(b.pct) || 0))}%"></span>` +
    `</div><div class="sl-ends"><span>${esc(b.min ?? "")}</span><span>${esc(b.max ?? "")}</span></div></div>`,

  scoreRing: (b) =>
    `<div class="score-ring"><svg width="58" height="58" viewBox="0 0 58 58">` +
    `<circle cx="29" cy="29" r="24" fill="none" stroke="var(--mood-colors-border)" stroke-width="7"/>` +
    `<circle cx="29" cy="29" r="24" fill="none" stroke="var(--mood-colors-accent)" stroke-width="7" stroke-linecap="round" ` +
    `stroke-dasharray="${(2 * Math.PI * 24 * (Number(b.pct) || 0)) / 100} ${2 * Math.PI * 24}" transform="rotate(-90 29 29)"/>` +
    `</svg><span class="score-ring-body">` +
    `<span class="sr-num">${esc(b.value ?? "")}</span>` +
    `<span class="sr-label">${esc(b.label ?? "")}</span></span></div>`,

  footer: (b) =>
    `<div class="m-footer"><div class="f-brand">${icon("layers")}${esc(b.brand ?? "")}</div>` +
    `<div class="f-links">${(b.links ?? [])
      .map((l) => `<span>${esc(l)}</span>`)
      .join("")}</div>` +
    (b.copy ? `<div class="f-copy">${esc(b.copy)}</div>` : "") + `</div>`,

  spacer: (b) => `<div style="height:${Number(b.h) || 8}px"></div>`,
};

/* -------------------------------------------------------------- render */

/**
 * Render a list of block descriptors to HTML.
 * @param {Array<object>} blocks
 */
export function renderBlocks(blocks) {
  return (blocks ?? [])
    .map((b) => {
      const fn = BLOCKS[b.type];
      if (!fn) {
        throw new Error(`unknown block type "${b.type}"`);
      }
      return fn(b);
    })
    .join("\n");
}

export const BLOCK_TYPES = Object.keys(BLOCKS);
