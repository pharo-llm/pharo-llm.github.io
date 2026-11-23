/* Pharo-LLM platform — shared layout + page renderers. Data source: /data/models.json
   (written automatically by the pharo-one release pipeline). */
(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const page = document.body.dataset.page || "";

  /* ------------------------------------------------------------ theme */
  const root = document.documentElement;
  const saved = localStorage.getItem("theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.dataset.theme = saved;

  /* ------------------------------------------------------------ header / footer */
  const NAV = [
    ["Models", "/models.html", ["models", "model"]],
    ["Compare", "/compare.html", ["compare"]],
    ["Docs", "/docs/", ["docs"]],
    ["Research", "/docs/technical-report.html", ["research"]],
    ["Projects", "/#projects", ["projects"]],
  ];
  function header() {
    const el = document.createElement("header");
    el.className = "header";
    el.innerHTML = `
      <div class="header__inner">
        <a class="brand" href="/"><img src="/logo.png" alt="" /><span>Pharo-LLM</span><span class="brand__sub">Platform</span></a>
        <nav class="nav" id="nav">
          ${NAV.map(([t, h, ids]) => `<a href="${h}" class="${ids.includes(page) || (page.startsWith("docs") && ids.includes("docs") && page !== "research") ? "active" : ""}">${t}</a>`).join("")}
        </nav>
        <div class="header__right">
          <a class="icon-btn" href="https://github.com/pharo-llm" aria-label="GitHub" target="_blank" rel="noopener"><i class="fa-brands fa-github"></i></a>
          <a class="icon-btn" href="https://huggingface.co/pharo-llm" aria-label="Hugging Face" target="_blank" rel="noopener">🤗</a>
          <a class="icon-btn" href="https://discord.gg/QewZMZa" aria-label="Discord" target="_blank" rel="noopener"><i class="fa-brands fa-discord"></i></a>
          <button class="icon-btn" id="themeBtn" aria-label="Toggle theme"></button>
          <button class="icon-btn menu-btn" id="menuBtn" aria-label="Menu"><i class="fa-solid fa-bars"></i></button>
        </div>
      </div>`;
    document.body.prepend(el);
    const tb = $("#themeBtn");
    const icon = () => (tb.innerHTML = root.dataset.theme === "dark" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>');
    icon();
    tb.onclick = () => { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; localStorage.setItem("theme", root.dataset.theme); icon(); };
    $("#menuBtn").onclick = () => $("#nav").classList.toggle("open");
  }
  function footer() {
    if (page.startsWith("docs") || page === "research") return;
    const el = document.createElement("footer");
    el.className = "footer";
    el.innerHTML = `
      <div class="container footer__inner">
        <div><div class="brand"><img src="/logo.png" alt="" /><span>Pharo-LLM</span></div>
          <p style="margin-top:10px">Open models and tools for LLMs in Pharo.</p>
          <p>© ${new Date().getFullYear()} Pharo-LLM · <a style="display:inline" href="/LICENSE">MIT License</a></p></div>
        <div><h5>Models</h5><a href="/models.html">All models</a><a href="/compare.html">Compare</a><a href="/docs/models.html">Naming & versions</a><a href="/docs/changelog.html">Changelog</a></div>
        <div><h5>Developers</h5><a href="/docs/">Documentation</a><a href="/docs/quickstart.html">Quickstart</a><a href="/docs/pharoeval.html">PharoEval</a><a href="/docs/technical-report.html">Technical report</a></div>
        <div><h5>Community</h5><a href="https://github.com/pharo-llm">GitHub</a><a href="https://huggingface.co/pharo-llm">Hugging Face</a><a href="https://discord.gg/QewZMZa">Discord</a><a href="/privacy.html">Privacy & Terms</a></div>
      </div>`;
    document.body.append(el);
  }

  /* ------------------------------------------------------------ data */
  let _data;
  async function data() {
    if (!_data) {
      const r = await fetch("/data/models.json", { cache: "no-cache" });
      _data = await r.json();
    }
    return _data;
  }
  const initials = (m) => (m.tier === "legacy" ? "v0" : ({ nano: "N", mini: "M", flagship: "1", max: "X" }[m.tier] || "P") + (m.tier === "flagship" ? ".0" : ""));
  const icon = (m, lg) => `<div class="model-icon ${lg ? "model-icon--lg" : ""} tier-${esc(m.tier)}">${esc(initials(m))}</div>`;
  const dots = (n, max = 5, cls = "") => n == null ? '<span class="faint">—</span>'
    : `<span class="rating ${cls}" title="${n} / ${max}">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</span>`;
  const statusBadge = (m) => ({
    available: '<span class="badge badge--ok">Available</span>',
    preview: '<span class="badge badge--accent">Preview</span>',
    planned: '<span class="badge">Coming soon</span>',
    deprecated: '<span class="badge badge--warn">Deprecated</span>',
  }[m.status] || "");
  const pct = (v) => (v == null ? "—" : `${Number(v).toFixed(1)}%`);
  const fmtK = (n) => (n == null ? "—" : n >= 1000 ? `${Math.round(n / 1024)}K` : String(n));
  const pass1 = (m) => m.benchmarks?.pharoeval?.["pass@1"];
  const quantTag = (m, q) => [m.version, m.tier === "flagship" ? null : m.tier, q.toLowerCase()].filter(Boolean).join("-");
  const defaultTag = (m) => (m.ollama_tags || [])[1] || (m.ollama_tags || [])[0];

  /* ------------------------------------------------------------ code blocks */
  function highlight(code, lang) {
    let h = esc(code);
    if (lang === "smalltalk") {
      h = h.replace(/(&quot;[^]*?&quot;)/g, '<span class="tok-c">$1</span>')
           .replace(/(&#39;(?:[^&]|&(?!#39;))*?&#39;)/g, '<span class="tok-s">$1</span>')
           .replace(/\b(self|super|nil|true|false|thisContext)\b/g, '<span class="tok-k">$1</span>')
           .replace(/(#[A-Za-z_][\w:]*)/g, '<span class="tok-n">$1</span>');
    } else if (lang === "bash") {
      h = h.replace(/(^|\n)(#[^\n]*)/g, '$1<span class="tok-c">$2</span>')
           .replace(/\b(ollama|pip|huggingface-cli|llama-cli|llama-server|curl|python|git|pharo-one|uv)\b/g, '<span class="tok-k">$1</span>');
    } else if (lang === "python") {
      h = h.replace(/(#[^\n]*)/g, '<span class="tok-c">$1</span>')
           .replace(/(&quot;[^\n]*?&quot;)/g, '<span class="tok-s">$1</span>')
           .replace(/\b(from|import|def|return|for|in|with|as|print)\b/g, '<span class="tok-k">$1</span>');
    }
    return h;
  }
  function codeBlock(code, lang = "bash", label) {
    return `<div class="code"><div class="code__head"><span>${esc(label || lang)}</span><button class="copy-btn" data-copy>Copy</button></div><pre><code data-lang="${lang}">${highlight(code.trim(), lang)}</code></pre></div>`;
  }
  function tabs(items) {
    const id = "t" + Math.random().toString(36).slice(2, 8);
    return `<div class="tabs" id="${id}"><div class="tabs__bar">${items.map((t, i) => `<button class="${i ? "" : "active"}" data-tab="${i}">${esc(t.label)}</button>`).join("")}</div>
      ${items.map((t, i) => `<div data-panel="${i}" ${i ? "hidden" : ""}>${codeBlock(t.code, t.lang, t.file || t.lang)}</div>`).join("")}</div>`;
  }
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-copy]");
    if (c) {
      navigator.clipboard.writeText(c.closest(".code").querySelector("pre").innerText);
      c.textContent = "Copied"; setTimeout(() => (c.textContent = "Copy"), 1200);
    }
    const t = e.target.closest("[data-tab]");
    if (t) {
      const box = t.closest(".tabs");
      $$("[data-tab]", box).forEach((b) => b.classList.toggle("active", b === t));
      $$("[data-panel]", box).forEach((p) => (p.hidden = p.dataset.panel !== t.dataset.tab));
    }
  });
  // Upgrade static <pre data-lang> blocks written in HTML pages.
  function upgradeStaticCode() {
    $$("pre[data-lang]").forEach((pre) => {
      const wrap = document.createElement("div");
      wrap.innerHTML = codeBlock(pre.textContent, pre.dataset.lang, pre.dataset.label);
      pre.replaceWith(wrap.firstChild);
    });
  }

  function quickstartTabs(m) {
    const tag = m ? `${m.links?.ollama?.split("ollama.com/")[1] || "pharo-llm/pharo-coder"}:${defaultTag(m) || "mini"}` : "pharo-llm/pharo-coder:mini";
    const hf = m?.links?.hf_instruct?.split("huggingface.co/")[1] || "pharo-llm/Pharo-Coder-1.0-Mini-7B-Instruct";
    const gguf = m?.links?.hf_gguf?.split("huggingface.co/")[1] || hf + "-GGUF";
    return tabs([
      { label: "Ollama", lang: "bash", code: `ollama run ${tag} "Write a Pharo class Stack with push:, pop and isEmpty"` },
      { label: "OpenAI-compatible API", lang: "bash", code: `# Ollama serves an OpenAI-compatible API on localhost:11434\ncurl http://localhost:11434/v1/chat/completions \\\n  -H "Content-Type: application/json" \\\n  -d '{"model": "${tag}", "messages": [{"role": "user", "content": "Add Integer >> isPerfectNumber"}]}'` },
      { label: "Transformers", lang: "python", file: "python", code: `from transformers import AutoModelForCausalLM, AutoTokenizer\n\nmodel_id = "${hf}"\ntok = AutoTokenizer.from_pretrained(model_id)\nmodel = AutoModelForCausalLM.from_pretrained(model_id, dtype="auto", device_map="auto")\n\nmessages = [{"role": "user", "content": "Write a Pharo class BankAccount"}]\ninputs = tok.apply_chat_template(messages, add_generation_prompt=True, return_tensors="pt").to(model.device)\nout = model.generate(inputs, max_new_tokens=1024)\nprint(tok.decode(out[0][inputs.shape[1]:], skip_special_tokens=True))` },
      { label: "llama.cpp", lang: "bash", code: `llama-server -hf ${gguf}:Q4_K_M --ctx-size 8192\n# then use http://localhost:8080/v1/chat/completions` },
      { label: "Pharo", lang: "smalltalk", file: "Playground", code: `| body response |\nbody := STONJSON toString: (Dictionary new\n\tat: 'model' put: '${tag}';\n\tat: 'stream' put: false;\n\tat: 'messages' put: { Dictionary new at: 'role' put: 'user'; at: 'content' put: 'Write Integer >> isPerfectNumber'; yourself };\n\tyourself).\nresponse := ZnClient new\n\turl: 'http://localhost:11434/api/chat';\n\tentity: (ZnEntity with: body type: ZnMimeType applicationJson);\n\ttimeout: 120;\n\tpost.\n(((STONJSON fromString: response) at: 'message') at: 'content') inspect` },
    ]);
  }

  /* ------------------------------------------------------------ model card (catalog) */
  function modelCard(m) {
    return `<a class="card" href="/model.html?id=${encodeURIComponent(m.id)}">
      <div class="card__top">${icon(m)}${statusBadge(m)}</div>
      <h3>${esc(m.display)}</h3>
      <p>${esc(m.description)}</p>
      <div class="card__meta">
        <span title="Intelligence">Intelligence ${dots(m.ratings?.intelligence)}</span>
        <span title="Speed">Speed ${dots(m.ratings?.speed, 5, "rating--speed")}</span>
        <span>${esc(m.size || "")}</span>
        <span>${fmtK(m.context_window)} context</span>
      </div></a>`;
  }

  /* ------------------------------------------------------------ pages */
  async function pageHome() {
    const d = await data();
    $("#featured").innerHTML = d.models.filter((m) => m.family === "Pharo-Coder" && m.status !== "deprecated").slice(0, 4).map(modelCard).join("");
    $("#quickstart").innerHTML = quickstartTabs(d.models.find((m) => m.id === d.default_model));
  }

  async function pageModels() {
    const d = await data();
    const tiers = [["all", "All"], ["available", "Available"], ["nano", "Nano"], ["mini", "Mini"], ["flagship", "Flagship"], ["max", "Max"], ["deprecated", "Deprecated"]];
    let filter = new URLSearchParams(location.search).get("filter") || "all";
    const chips = $("#filters");
    const grid = $("#catalog");
    function render() {
      chips.innerHTML = tiers.map(([k, t]) => `<button class="chip ${k === filter ? "active" : ""}" data-f="${k}">${t}</button>`).join("");
      const list = d.models.filter((m) => filter === "all" ? m.status !== "deprecated" : filter === "available" || filter === "deprecated" ? m.status === filter : m.tier === filter);
      grid.innerHTML = list.map(modelCard).join("") || '<div class="empty">No models in this category yet.</div>';
      $("#rows").innerHTML = d.models.map((m) => `<tr>
        <td><a class="link" href="/model.html?id=${encodeURIComponent(m.id)}"><code>${esc(m.id)}</code></a></td>
        <td>${statusBadge(m)}</td><td>${esc(m.size || "—")}</td><td class="num">${fmtK(m.context_window)}</td>
        <td class="num">${pct(pass1(m))}</td><td>${(m.snapshots || []).map((s) => `<code>${esc(s.id)}</code>`).join("<br>") || "—"}</td></tr>`).join("");
    }
    chips.onclick = (e) => { const b = e.target.closest("[data-f]"); if (b) { filter = b.dataset.f; render(); } };
    render();
  }

  async function pageModel() {
    const d = await data();
    const id = new URLSearchParams(location.search).get("id") || d.default_model;
    const m = d.models.find((x) => x.id === id) || d.models.find((x) => (x.snapshots || []).some((s) => s.id === id));
    const el = $("#model");
    if (!m) { el.innerHTML = `<div class="empty">Unknown model <code>${esc(id)}</code>. <a class="link" href="/models.html">See all models</a>.</div>`; return; }
    document.title = `${m.display} — Pharo-LLM`;
    const pe = m.benchmarks?.pharoeval || {};
    const cats = Object.entries(pe.by_category || {});
    const ollamaRepo = m.links?.ollama?.split("ollama.com/")[1];
    el.innerHTML = `
      <a class="link" href="/models.html" style="font-size:14px">← All models</a>
      <div class="model-hero" style="margin-top:18px">${icon(m, true)}
        <div class="model-hero__main"><h1>${esc(m.display)}</h1><p class="muted" style="font-size:16px;max-width:680px">${esc(m.description)}</p>
          <div class="chips">${statusBadge(m)}${m.base_model ? `<span class="badge">Base: ${esc(m.base_model)}</span>` : ""}<span class="badge">${esc(m.license || "")}</span></div></div>
        <div class="model-hero__actions">
          <a class="btn" href="/compare.html?model=${encodeURIComponent(m.id)}">Compare</a>
          ${m.links?.hf_instruct ? `<a class="btn" href="${esc(m.links.hf_instruct)}" target="_blank" rel="noopener">🤗 Hugging Face</a>` : ""}
          ${ollamaRepo ? `<a class="btn btn--primary" href="${esc(m.links.ollama)}" target="_blank" rel="noopener">Ollama</a>` : ""}
        </div></div>
      <div class="spec-grid">
        <div class="spec"><div class="spec__label">Intelligence</div><div class="spec__value">${dots(m.ratings?.intelligence)}</div></div>
        <div class="spec"><div class="spec__label">Speed</div><div class="spec__value">${dots(m.ratings?.speed, 5, "rating--speed")}</div></div>
        <div class="spec"><div class="spec__label">PharoEval pass@1</div><div class="spec__value">${pct(pe["pass@1"])}</div></div>
        <div class="spec"><div class="spec__label">Parameters</div><div class="spec__value">${esc(m.size || "—")}</div></div>
        <div class="spec"><div class="spec__label">Context window</div><div class="spec__value">${(m.context_window || 0).toLocaleString()} tokens</div></div>
        <div class="spec"><div class="spec__label">Max output</div><div class="spec__value">${(m.max_output || 0).toLocaleString()} tokens</div></div>
        <div class="spec"><div class="spec__label">Input / Output</div><div class="spec__value">Text / Text, Code</div></div>
        <div class="spec"><div class="spec__label">Released</div><div class="spec__value">${esc(m.release_date || "—")}</div></div>
      </div>
      <h2>Get started</h2>
      ${m.status === "available" || m.status === "deprecated" ? quickstartTabs(m) : `<div class="callout callout--accent"><strong>Coming soon</strong>This model is being trained by the automated release pipeline. Its page fills in automatically when it ships — the commands below will work then.</div>${quickstartTabs(m)}`}
      <h2>PharoEval results</h2>
      ${pe["pass@1"] == null ? '<div class="empty">Benchmarks are published together with the model.</div>' : `
        <p class="muted">Execution-based: every answer is installed in a fresh Pharo image and must pass all unit tests. Greedy decoding. <a class="link" href="/docs/pharoeval.html">About PharoEval</a></p>
        <div class="bars tier-${esc(m.tier)}">${cats.map(([c, v]) => `<div class="bar"><span>${esc(c)}</span><div class="bar__track"><div class="bar__fill" style="width:${v || 0}%"></div></div><span class="num">${pct(v)}</span></div>`).join("")}</div>
        ${Object.keys(m.benchmarks?.baselines || {}).length ? `<h3>Compared with</h3><div class="table-wrap"><table><thead><tr><th>Model</th><th class="num">pass@1</th><th class="num">Compiles</th></tr></thead><tbody>
          <tr><td><strong>${esc(m.display)}</strong></td><td class="num best">${pct(pe["pass@1"])}</td><td class="num">${pct(pe.compile_rate)}</td></tr>
          ${Object.entries(m.benchmarks.baselines).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${pct(v["pass@1"])}</td><td class="num">${pct(v.compile_rate)}</td></tr>`).join("")}
          </tbody></table></div>` : ""}`}
      <h2>Snapshots</h2>
      <p class="muted">Snapshots pin a dated version of the model. The alias <code>${esc(m.id)}</code> always points to the latest snapshot.</p>
      <div class="table-wrap"><table><thead><tr><th>Snapshot</th><th>Released</th></tr></thead><tbody>
        ${(m.snapshots || []).map((s) => `<tr><td><code>${esc(s.id)}</code></td><td>${esc(s.date)}</td></tr>`).join("") || '<tr><td colspan="2" class="muted">No snapshot released yet.</td></tr>'}</tbody></table></div>
      <h2>Downloads</h2>
      <div class="table-wrap"><table><thead><tr><th>Format</th><th>Where</th><th class="num">Size</th></tr></thead><tbody>
        <tr><td>Safetensors (bf16)</td><td>${m.links?.hf_instruct ? `<a class="link" href="${esc(m.links.hf_instruct)}">${esc(m.links.hf_instruct.split("co/")[1])}</a>` : "—"}</td><td class="num">—</td></tr>
        ${(m.quantizations || []).map((q) => `<tr><td>GGUF ${esc(q.name)} ${q.default ? '<span class="badge">default</span>' : ""}</td><td>${ollamaRepo ? `<code>ollama pull ${esc(ollamaRepo)}:${esc(quantTag(m, q.name))}</code>` : "—"}</td><td class="num">${q.size_gb ? q.size_gb + " GB" : "—"}</td></tr>`).join("")}
        ${m.links?.hf_gguf ? `<tr><td>All GGUF files</td><td><a class="link" href="${esc(m.links.hf_gguf)}">${esc(m.links.hf_gguf.split("co/")[1])}</a></td><td class="num">—</td></tr>` : ""}
      </tbody></table></div>
      ${m.ollama_tags?.length ? `<h3>Ollama tags</h3><p>${m.ollama_tags.map((t) => `<code>${esc(ollamaRepo)}:${esc(t)}</code>`).join(" ")}</p>` : ""}`;
  }

  async function pageCompare() {
    const d = await data();
    const q = new URLSearchParams(location.search);
    const picked = q.getAll("model");
    const ids = d.models.map((m) => m.id);
    const defaults = [picked[0] || d.default_model, picked[1] || ids.find((x) => x !== (picked[0] || d.default_model)), picked[2] || ""];
    const sel = $$("#pickers select");
    sel.forEach((s, i) => {
      s.innerHTML = (i === 2 ? '<option value="">— none —</option>' : "") + d.models.map((m) => `<option value="${esc(m.id)}">${esc(m.display)}</option>`).join("");
      s.value = defaults[i] || "";
      s.onchange = render;
    });
    const rows = [
      ["Status", (m) => statusBadge(m)],
      ["Intelligence", (m) => dots(m.ratings?.intelligence)],
      ["Speed", (m) => dots(m.ratings?.speed, 5, "rating--speed")],
      ["PharoEval pass@1", (m) => pct(pass1(m)), (m) => pass1(m)],
      ["Compile rate", (m) => pct(m.benchmarks?.pharoeval?.compile_rate), (m) => m.benchmarks?.pharoeval?.compile_rate],
      ["Easy / Medium / Hard", (m) => { const b = m.benchmarks?.pharoeval?.by_difficulty || {}; return `${pct(b.easy)} / ${pct(b.medium)} / ${pct(b.hard)}`; }],
      ["Parameters", (m) => esc(m.size || "—")],
      ["Context window", (m) => `${(m.context_window || 0).toLocaleString()} tokens`],
      ["Max output", (m) => `${(m.max_output || 0).toLocaleString()} tokens`],
      ["Base model", (m) => esc(m.base_model || "—")],
      ["Quantizations", (m) => (m.quantizations || []).map((x) => esc(x.name)).join(", ") || "—"],
      ["Latest snapshot", (m) => (m.snapshots?.[0] ? `<code>${esc(m.snapshots[0].id)}</code>` : "—")],
      ["License", (m) => esc(m.license || "—")],
    ];
    function render() {
      const models = sel.map((s) => d.models.find((m) => m.id === s.value)).filter(Boolean);
      const p = new URLSearchParams(); models.forEach((m) => p.append("model", m.id)); history.replaceState(null, "", "?" + p);
      const cats = [...new Set(models.flatMap((m) => Object.keys(m.benchmarks?.pharoeval?.by_category || {})))];
      const best = (fn) => { const v = models.map(fn).filter((x) => x != null); return v.length ? Math.max(...v) : null; };
      const tr = ([label, f, num]) => { const b = num ? best(num) : null; return `<tr><td>${label}</td>${models.map((m) => `<td class="${num && b != null && num(m) === b && models.length > 1 ? "best" : ""}">${f(m)}</td>`).join("")}</tr>`; };
      $("#compare").innerHTML = `<div class="table-wrap"><table class="compare-table"><thead><tr><th></th>${models.map((m) => `<th><a class="link" href="/model.html?id=${encodeURIComponent(m.id)}">${esc(m.display)}</a></th>`).join("")}</tr></thead><tbody>
        ${rows.map(tr).join("")}
        ${cats.length ? `<tr><th colspan="${models.length + 1}">PharoEval by category (pass@1)</th></tr>` + cats.map((c) => tr([c, (m) => pct(m.benchmarks?.pharoeval?.by_category?.[c]), (m) => m.benchmarks?.pharoeval?.by_category?.[c]])).join("") : ""}
      </tbody></table></div>`;
    }
    render();
  }

  /* ------------------------------------------------------------ docs */
  const DOCS = [
    ["Get started", [["Overview", "/docs/"], ["Quickstart", "/docs/quickstart.html"], ["Models", "/docs/models.html"]]],
    ["Use the models", [["Ollama", "/docs/ollama.html"], ["Transformers & vLLM", "/docs/transformers.html"], ["llama.cpp & GGUF", "/docs/llama-cpp.html"], ["Inside Pharo", "/docs/pharo.html"], ["Prompting guide", "/docs/prompting.html"]]],
    ["Research", [["Technical report", "/docs/technical-report.html"], ["PharoEval benchmark", "/docs/pharoeval.html"], ["Training pipeline", "/docs/training.html"]]],
    ["Resources", [["Changelog", "/docs/changelog.html"], ["Privacy & Terms", "/privacy.html"]]],
  ];
  function docsLayout() {
    const main = $(".docs__main");
    if (!main) return;
    const here = location.pathname.replace(/index\.html$/, "");
    const flat = DOCS.flatMap(([, items]) => items);
    $(".docs__side").innerHTML = DOCS.map(([sec, items]) => `<h4>${sec}</h4>` + items.map(([t, h]) => `<a href="${h}" class="${h === here ? "active" : ""}">${t}</a>`).join("")).join("");
    const heads = $$("h2, h3", main);
    heads.forEach((h) => {
      if (!h.id) h.id = h.textContent.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
      h.insertAdjacentHTML("beforeend", `<a class="anchor" href="#${h.id}">#</a>`);
    });
    $(".docs__toc").innerHTML = heads.length ? "<h5>On this page</h5>" + heads.map((h) => `<a class="${h.tagName === "H3" ? "sub" : ""}" href="#${h.id}">${esc(h.firstChild.textContent)}</a>`).join("") : "";
    const i = flat.findIndex(([, h]) => h === here);
    if (i >= 0) {
      const prev = flat[i - 1], next = flat[i + 1];
      main.insertAdjacentHTML("beforeend", `<div class="docs-next">${prev ? `<a href="${prev[1]}"><span>Previous</span>${prev[0]}</a>` : "<span></span>"}${next ? `<a href="${next[1]}" style="text-align:right"><span>Next</span>${next[0]}</a>` : ""}</div>`);
    }
  }

  // Tables filled from models.json on docs pages: <div data-models-table></div>, <div data-eval-table></div>
  async function docsData() {
    const need = $$("[data-models-table], [data-eval-table], [data-quickstart], [data-changelog]");
    if (!need.length) return;
    const d = await data();
    $$("[data-quickstart]").forEach((el) => (el.innerHTML = quickstartTabs(d.models.find((m) => m.id === d.default_model))));
    $$("[data-models-table]").forEach((el) => (el.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Model ID</th><th>Tier</th><th>Size</th><th>Base model</th><th>Status</th></tr></thead><tbody>
      ${d.models.map((m) => `<tr><td><a class="link" href="/model.html?id=${encodeURIComponent(m.id)}"><code>${esc(m.id)}</code></a></td><td>${esc(m.tier)}</td><td>${esc(m.size)}</td><td>${esc(m.base_model || "—")}</td><td>${statusBadge(m)}</td></tr>`).join("")}</tbody></table></div>`));
    $$("[data-eval-table]").forEach((el) => {
      const rows = d.models.filter((m) => pass1(m) != null);
      el.innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>Model</th><th class="num">Overall</th><th class="num">Easy</th><th class="num">Medium</th><th class="num">Hard</th><th class="num">Compiles</th></tr></thead><tbody>
        ${rows.map((m) => { const pe = m.benchmarks.pharoeval, b = pe.by_difficulty || {}; return `<tr><td>${esc(m.display)}</td><td class="num">${pct(pe["pass@1"])}</td><td class="num">${pct(b.easy)}</td><td class="num">${pct(b.medium)}</td><td class="num">${pct(b.hard)}</td><td class="num">${pct(pe.compile_rate)}</td></tr>`; }).join("")}
        </tbody></table></div>` : '<div class="empty">Results are added automatically when a model is released.</div>';
    });
    $$("[data-changelog]").forEach((el) => {
      const snaps = d.models.flatMap((m) => (m.snapshots || []).map((s) => ({ ...s, m }))).sort((a, b) => b.date.localeCompare(a.date));
      el.innerHTML = snaps.length ? snaps.map((s) => `<h3>${esc(s.date)}</h3><p>Released <a class="link" href="/model.html?id=${encodeURIComponent(s.m.id)}">${esc(s.m.display)}</a> as snapshot <code>${esc(s.id)}</code>${pass1(s.m) != null ? ` — PharoEval pass@1 ${pct(pass1(s.m))}` : ""}.</p>`).join("") : '<div class="empty">No releases yet.</div>';
    });
  }

  /* ------------------------------------------------------------ boot */
  header();
  footer();
  upgradeStaticCode();
  docsLayout();
  const routes = { home: pageHome, models: pageModels, model: pageModel, compare: pageCompare };
  (routes[page] ? routes[page]() : Promise.resolve()).then(docsData).catch((e) => console.error(e));
})();
