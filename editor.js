// Interactive.js for Bus Duty Lead
// Allows dragging buses and saving positions to GitHub

// Your repo info
const OWNER = "andrewposner-byte";   // GitHub username
const REPO = "Bus-Duty-Map";         // Repository name
const FILE_PATH = "map-state-midday.json"; // JSON filename
const BRANCH = "main";               // Branch name

// ⚠️ Replace with your GitHub Personal Access Token (classic, repo scope)
const TOKEN = "YOUR_GITHUB_TOKEN_HERE";

// GitHub API URLs
const RAW_URL = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${FILE_PATH}`;
const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;

let buses = [];
let dragTarget = null, dragBusId = null, offsetX = 0, offsetY = 0;

// ------------------ RENDER ------------------
function renderBuses() {
  const busMap = document.getElementById("busMap");
  if (!busMap) return;
  document.querySelectorAll(".bus").forEach(el => el.remove());

  buses.forEach(bus => {
    const g = document.createElementNS("http://www.w3.org/2000/svg","g");
    g.setAttribute("class","bus");
    g.setAttribute("transform",`translate(${bus.x},${bus.y})`);
    g.dataset.id = bus.id;

    const body = document.createElementNS("http://www.w3.org/2000/svg","rect");
    body.setAttribute("x",0); body.setAttribute("y",10);
    body.setAttribute("width",120); body.setAttribute("height",40);
    body.setAttribute("rx",8); body.setAttribute("ry",8);
    body.setAttribute("fill","#FFD600"); body.setAttribute("stroke","black");

    const wheel1 = document.createElementNS("http://www.w3.org/2000/svg","circle");
    wheel1.setAttribute("cx",25); wheel1.setAttribute("cy",55); wheel1.setAttribute("r",8); wheel1.setAttribute("fill","black");
    const wheel2 = document.createElementNS("http://www.w3.org/2000/svg","circle");
    wheel2.setAttribute("cx",95); wheel2.setAttribute("cy",55); wheel2.setAttribute("r",8); wheel2.setAttribute("fill","black");

    const text = document.createElementNS("http://www.w3.org/2000/svg","text");
    text.setAttribute("x",60); text.setAttribute("y",38);
    text.setAttribute("font-size","28");
    text.setAttribute("font-weight","bold"); 
    text.setAttribute("text-anchor","middle");
    text.textContent = bus.id;

    g.appendChild(body); g.appendChild(wheel1); g.appendChild(wheel2); g.appendChild(text);
    busMap.appendChild(g);

    // Drag listeners
    g.addEventListener("mousedown", startDrag);
    g.addEventListener("touchstart", startDrag);
  });
}

// ------------------ LOAD ------------------
async function loadBuses() {
  try {
    const res = await fetch(RAW_URL + "?_=" + Date.now(), { cache:"no-store" });
    const data = await res.json();
    buses = Array.isArray(data) ? data : data.buses || [];
    renderBuses();
  } catch(e) { console.error("Load error:", e); }
}

// ------------------ SAVE ------------------
async function saveBuses() {
  try {
    // 1. Get the latest file SHA (GitHub requires it for updates)
    const res = await fetch(API_URL, {
      headers: { Authorization: `token ${TOKEN}` }
    });
    const fileData = await res.json();
    const sha = fileData.sha;

    // 2. Encode and send updated content
    const updatedContent = btoa(JSON.stringify({ buses }, null, 2));

    await fetch(API_URL, {
      method: "PUT",
      headers: {
        Authorization: `token ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Update bus positions",
        content: updatedContent,
        sha: sha,
        branch: BRANCH
      })
    });

    console.log("✅ Buses saved to GitHub");

  } catch(e) { console.error("Save error:", e); }
}

// ------------------ DRAG HANDLERS ------------------
function startDrag(evt) {
  evt.preventDefault();
  const pt = getPoint(evt);
  dragTarget = evt.currentTarget;
  dragBusId = dragTarget.dataset.id;
  const transform = dragTarget.getAttribute("transform");
  const [x,y] = transform.match(/[-\d.]+/g).map(Number);
  offsetX = pt.x - x;
  offsetY = pt.y - y;
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", endDrag);
  document.addEventListener("touchmove", drag);
  document.addEventListener("touchend", endDrag);
}

function drag(evt) {
  if (!dragTarget) return;
  const pt = getPoint(evt);
  const x = pt.x - offsetX, y = pt.y - offsetY;
  dragTarget.setAttribute("transform",`translate(${x},${y})`);
}

function endDrag(evt) {
  if (!dragTarget) return;
  const transform = dragTarget.getAttribute("transform");
  const [x,y] = transform.match(/[-\d.]+/g).map(Number);

  const bus = buses.find(b => b.id === dragBusId);
  if (bus) { bus.x = x; bus.y = y; }

  dragTarget = null; dragBusId = null;
  saveBuses();

  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", endDrag);
  document.removeEventListener("touchmove", drag);
  document.removeEventListener("touchend", endDrag);
}

// ------------------ HELPERS ------------------
function getPoint(evt) {
  if (evt.touches) evt = evt.touches[0];
  const svg = document.getElementById("busMap");
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

// ------------------ INIT ------------------
loadBuses();
