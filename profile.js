/* =========================================================
   WRITTEN IN THE STARS - PROFILE PAGE
   1. The stars (questions + positions)
   2. Which stars connect
   3. Saving and loading
   4. Drawing the constellation
   5. Opening a star / answering
   6. Finishing
   7. Background twinkles
   ========================================================= */

const $ = id => document.getElementById(id);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Helpers for checkbox groups
const checkedValues = name => [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value);
const setChecked = (name, values) => document.querySelectorAll(`input[name="${name}"]`)
  .forEach(i => { i.checked = (values || []).includes(i.value); });


/* ---------- 1. THE STARS ---------- */
// Each star = one question. x/y place it in the drawing (600 wide, 400 tall).
// labelAbove: true puts the star's name above it instead of below.
// fields: the inputs shown. fill: puts saved answers back. collect: reads + checks the answer.
const STARS = [
  {
    id: "name", label: "Name", x: 80, y: 255,
    question: "What should we call you?",
    fields: `<label class="field">First name or nickname
               <input id="f-name" type="text" maxlength="20" autocomplete="given-name"></label>`,
    fill: v => { $("f-name").value = v || ""; },
    collect() {
      const v = $("f-name").value.trim();
      return v ? { value: v, short: v } : { error: "Type your name to light this star." };
    }
  },
  {
    id: "age", label: "Age", x: 185, y: 140,
    question: "How old are you?",
    fields: `<label class="field">Age
               <input id="f-age" type="number" min="18" max="99" inputmode="numeric"></label>
             <p class="hint">Written in the Stars is for people 18 and older.</p>`,
    fill: v => { $("f-age").value = v || ""; },
    collect() {
      const n = Number($("f-age").value);
      if (!n) return { error: "Enter your age." };
      if (n < 18) return { error: "You need to be 18 or older to join." };
      if (n > 99) return { error: "Enter an age between 18 and 99." };
      return { value: n, short: String(n) };
    }
  },
  {
    id: "birthDate", label: "Birthday", x: 300, y: 215,
    question: "When were you born?",
    fields: `<label class="field">Birth date
               <input id="f-date" type="date"></label>
             <p class="hint">This reveals your sun sign.</p>`,
    fill: v => { $("f-date").value = v || ""; },
    collect() {
      const v = $("f-date").value;
      if (!v) return { error: "Pick your birth date." };
      if (new Date(v) > new Date()) return { error: "That date is in the future. Check the year." };
      const [, m, d] = v.split("-");
      return { value: v, short: `${MONTHS[Number(m) - 1]} ${Number(d)}` };
    }
  },
  {
    id: "birthTime", label: "Birth time", x: 405, y: 95, labelAbove: true,
    question: "What time were you born?",
    fields: `<label class="field">Birth time
               <input id="f-time" type="time"></label>
             <label class="check"><input id="f-time-unknown" type="checkbox"> I don't know my birth time</label>
             <p class="hint">Your birth time reveals your rising sign. It's often on your birth certificate, or a parent might know.</p>`,
    init() {
      const box = $("f-time-unknown");
      box.addEventListener("change", () => { $("f-time").disabled = box.checked; });
    },
    fill: v => {
      const unknown = v === "unknown";
      $("f-time-unknown").checked = unknown;
      $("f-time").disabled = unknown;
      $("f-time").value = unknown ? "" : (v || "");
    },
    collect() {
      if ($("f-time-unknown").checked) return { value: "unknown", short: "Time unknown" };
      const v = $("f-time").value;
      if (!v) return { error: "Enter your birth time, or check that you don't know it." };
      const [h, m] = v.split(":").map(Number);
      return { value: v, short: `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}` };
    }
  },
  {
    id: "birthCity", label: "Birthplace", x: 525, y: 180,
    question: "Where were you born?",
    fields: `<label class="field">City
               <input id="f-city" type="text" placeholder="e.g. Buffalo, New York" autocomplete="off"></label>
             <p class="hint">Your birthplace helps place your moon and rising signs.</p>`,
    fill: v => { $("f-city").value = v || ""; },
    collect() {
      const v = $("f-city").value.trim();
      if (!v) return { error: "Type the city you were born in." };
      return { value: v, short: v.split(",")[0] };
    }
  },
  {
    id: "looking", label: "Looking for", x: 450, y: 318,
    question: "What are you looking for?",
    fields: `<fieldset class="choices">
               <legend>I'm here for</legend>
               <label class="chip"><input type="checkbox" name="looking" value="friends"> Friends</label>
               <label class="chip"><input type="checkbox" name="looking" value="romance"> Romance</label>
             </fieldset>
             <div id="romance-extra" class="romance-extra" hidden>
               <label class="field">I am
                 <select id="f-gender">
                   <option value="">Choose one</option>
                   <option value="woman">A woman</option>
                   <option value="man">A man</option>
                   <option value="nonbinary">Nonbinary</option>
                 </select>
               </label>
               <fieldset class="choices">
                 <legend>Interested in</legend>
                 <label class="chip"><input type="checkbox" name="interested" value="woman"> Women</label>
                 <label class="chip"><input type="checkbox" name="interested" value="man"> Men</label>
                 <label class="chip"><input type="checkbox" name="interested" value="nonbinary"> Nonbinary people</label>
               </fieldset>
             </div>`,
    init() {
      // Only show the romance questions when Romance is picked
      const romance = document.querySelector('input[name="looking"][value="romance"]');
      romance.addEventListener("change", () => { $("romance-extra").hidden = !romance.checked; });
    },
    fill: v => {
      v = v || { lookingFor: [], gender: "", interestedIn: [] };
      setChecked("looking", v.lookingFor);
      setChecked("interested", v.interestedIn);
      $("f-gender").value = v.gender || "";
      $("romance-extra").hidden = !v.lookingFor.includes("romance");
    },
    collect() {
      const lookingFor = checkedValues("looking");
      if (lookingFor.length === 0) return { error: "Choose Friends, Romance, or both." };
      const romance = lookingFor.includes("romance");
      const gender = $("f-gender").value;
      const interestedIn = checkedValues("interested");
      if (romance && (!gender || interestedIn.length === 0)) {
        return { error: "For romance, choose your gender and who you're interested in." };
      }
      const short = lookingFor.length === 2 ? "Friends & romance" : (romance ? "Romance" : "Friends");
      return {
        value: { lookingFor, gender: romance ? gender : "", interestedIn: romance ? interestedIn : [] },
        short
      };
    }
  }
];


/* ---------- 2. WHICH STARS CONNECT ---------- */
const LINKS = [
  ["name", "age"],
  ["age", "birthDate"],
  ["birthDate", "birthTime"],
  ["birthTime", "birthCity"],
  ["birthCity", "looking"],
  ["looking", "birthDate"]
];


/* ---------- 3. SAVING AND LOADING ---------- */
// answers looks like: { name: { value: "Joanna", short: "Joanna" }, ... }
let answers = {};
try { answers = JSON.parse(localStorage.getItem("wits-profile-draft")) || {}; } catch (e) { answers = {}; }

function saveDraft() {
  try { localStorage.setItem("wits-profile-draft", JSON.stringify(answers)); } catch (e) {}
}


/* ---------- 4. DRAWING THE CONSTELLATION ---------- */
const NS = "http://www.w3.org/2000/svg";
const svg = $("constellation");
const findStar = id => STARS.find(s => s.id === id);

function svgEl(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  parent.append(el);
  return el;
}

// Lines: a dotted guide + a glowing line on top that "draws" when both stars are lit
LINKS.forEach(([a, b]) => {
  const A = findStar(a), B = findStar(b);
  const pos = { x1: A.x, y1: A.y, x2: B.x, y2: B.y };
  svgEl("line", { class: "link-base", ...pos }, $("links"));
  const glow = svgEl("line", { class: "link-glow", ...pos }, $("links"));
  const length = Math.hypot(B.x - A.x, B.y - A.y);
  glow.style.strokeDasharray = length;
  glow.style.strokeDashoffset = length;
  glow.dataset.a = a;
  glow.dataset.b = b;
  glow.dataset.length = length;
});

// Stars
STARS.forEach((s, i) => {
  const g = svgEl("g", { class: "star", tabindex: "0", role: "button" }, $("stars"));
  svgEl("circle", { class: "hit", cx: s.x, cy: s.y, r: 30 }, g);
  const body = svgEl("g", { class: "body" }, g);
  svgEl("circle", { class: "halo", cx: s.x, cy: s.y, r: 16 }, body);
  svgEl("circle", { class: "ring", cx: s.x, cy: s.y, r: 13 }, body);
  svgEl("circle", { class: "core", cx: s.x, cy: s.y, r: 6 }, body);
  s.labelEl = svgEl("text", { class: "star-label", x: s.x, y: s.labelAbove ? s.y - 26 : s.y + 36 }, g);
  s.el = g;

  g.addEventListener("click", () => openStar(i));
  g.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openStar(i); }
  });
});

// Updates every star, line, and the progress text to match the answers
function refresh() {
  let lit = 0;
  STARS.forEach(s => {
    const answer = answers[s.id];
    if (answer) lit++;
    s.el.classList.toggle("lit", !!answer);
    const text = answer ? answer.short : s.label;
    s.labelEl.textContent = text.length > 16 ? text.slice(0, 15) + "…" : text;
    s.el.setAttribute("aria-label", answer
      ? `${s.label}: ${answer.short}. Select to change.`
      : `${s.label}, not filled in yet`);
  });

  document.querySelectorAll(".link-glow").forEach(line => {
    const on = answers[line.dataset.a] && answers[line.dataset.b];
    line.style.strokeDashoffset = on ? 0 : line.dataset.length;
  });

  const complete = lit === STARS.length;
  $("progress").textContent = `${lit} of ${STARS.length} stars lit`;
  svg.classList.toggle("complete", complete);
  $("subtitle").textContent = complete
    ? "Your constellation is complete. Click any star to change an answer."
    : "Every star holds a piece of you. Light all six to step into the sky.";
  return complete;
}


/* ---------- 5. OPENING A STAR / ANSWERING ---------- */
let current = -1;

function openStar(i) {
  current = i;
  const s = STARS[i];
  STARS.forEach((t, j) => t.el.classList.toggle("active", j === i));

  $("panel-step").textContent = `Star ${i + 1} of ${STARS.length}`;
  $("panel-question").textContent = s.question;
  $("panel-fields").innerHTML = s.fields;
  $("panel-error").textContent = "";
  if (s.init) s.init();
  s.fill(answers[s.id] ? answers[s.id].value : undefined);

  $("intro").hidden = true;
  $("done").hidden = true;
  $("panel").hidden = false;
  const first = $("panel-fields").querySelector("input:not(:disabled), select");
  if (first) first.focus();
}

function closePanel() {
  const star = STARS[current];
  current = -1;
  STARS.forEach(t => t.el.classList.remove("active"));
  $("panel").hidden = true;
  const complete = refresh();
  $("done").hidden = !complete;
  $("intro").hidden = complete;
  if (star) star.el.focus();
}

$("star-form").addEventListener("submit", e => {
  e.preventDefault();
  const s = STARS[current];
  const result = s.collect();
  if (result.error) { $("panel-error").textContent = result.error; return; }

  answers[s.id] = { value: result.value, short: result.short };
  saveDraft();
  refresh();

  // Jump to the next star that isn't lit yet, or finish
  const next = STARS.findIndex(t => !answers[t.id]);
  if (next >= 0) openStar(next);
  else closePanel();
});

$("close-panel").addEventListener("click", closePanel);
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("panel").hidden) closePanel();
});


/* ---------- 6. FINISHING ---------- */
$("enter-sky").addEventListener("click", () => {
  const looking = answers.looking.value;
  // The final profile, in one simple object for the rest of the site to use
  const profile = {
    name: answers.name.value,
    age: answers.age.value,
    birthDate: answers.birthDate.value,
    birthTime: answers.birthTime.value === "unknown" ? "" : answers.birthTime.value,
    birthCity: answers.birthCity.value,
    lookingFor: looking.lookingFor,
    gender: looking.gender,
    interestedIn: looking.interestedIn
  };
  try { localStorage.setItem("wits-profile", JSON.stringify(profile)); } catch (e) {}
  $("saved-msg").textContent = "Your constellation is saved.";

  // TEAM: when the sky page exists, uncomment the next line (and change the file name if needed)
  // window.location.href = "sky.html";
});


/* ---------- 7. BACKGROUND TWINKLES ---------- */
for (let i = 0; i < 170; i++) {
  const dot = document.createElement("span");
  const size = Math.random() < 0.85 ? 1.5 : 2.5;
  dot.className = "twinkle" + (Math.random() < 0.18 ? " pink" : "");
  dot.style.width = dot.style.height = size + "px";
  dot.style.left = Math.random() * 100 + "%";
  dot.style.top = Math.random() * 100 + "%";
  dot.style.animationDelay = (Math.random() * 3.5).toFixed(2) + "s";
  $("sky-bg").append(dot);
}


/* ---------- START ---------- */
const startComplete = refresh();
$("done").hidden = !startComplete;
$("intro").hidden = startComplete;
