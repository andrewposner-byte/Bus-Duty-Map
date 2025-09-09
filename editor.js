// ------------------ CONFIG ------------------
// Update with your repo details
const REPO_OWNER = "andrewposner-byte";
const REPO_NAME = "Bus-Duty-Map";

let buses = [];
let dragTarget = null, dragBusId = null, offsetX = 0, offsetY = 0;

// ------------------ RENDER ------------------
function renderBuses() {
  const busMap = document.getElementById("busMap");
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
    g.addEventListener("mousedown", e=>startDrag(e,g));
    g.addEventListener("touchstart", e=>startDrag(e.touches[0], g));
    g.addEventListener("contextmenu", e=>{ e.preventDefault(); deleteBus(bus.id); });

    busMap.appendChild(g);
  });
}

// ------------------ BUS CONTROL ------------------
function addBus() {
  const id = document.getElementById("busId").value.trim() || String(buses.length+1);
  buses.push({ id, x:120 + buses.length*40, y:600 });
  renderBuses();
  saveBuses();
}

function startDrag(evt, element) {
  evt.preventDefault();
  dragTarget = element;
  dragBusId = element.dataset.id;
  const transform = element.getAttribute("transform");
  const match = /translate\(([-\d.]+),([-\d.]+)\)/.exec(transform);
  offsetX = (evt.clientX ?? evt.pageX) - parseFloat(match[1]);
  offsetY = (evt.clientY ?? evt.pageY) - parseFloat(match[2]);
  window.addEventListener("mousemove", drag);
  window.addEventListener("mouseup", endDrag);
  window.addEventListener("touchmove", touchDrag, { passive: false });
  window.addEventListener("touchend", endDrag);
}

function drag(evt) {
  if(!dragTarget) return;
  const x = evt.clientX - offsetX;
  const y = evt.clientY - offsetY;
  dragTarget.setAttribute("transform",`translate(${x},${y})`);
}

function touchDrag(evt){
  if(evt.touches.length){
    evt.preventDefault();
    drag(evt.touches[0]);
  }
}

function endDrag(evt){
  if(!dragTarget) return;
  const id = dragTarget.dataset.id;
  const transform = dragTarget.getAttribute("transform");
  const match = /translate\(([-\d.]+),([-\d.]+)\)/.exec(transform);
  const x = parseFloat(match[1]), y = parseFloat(match[2]);
  const bus = buses.find(b=>b.id===id);
  if(bus){ bus.x=x; bus.y=y; saveBuses(); }
  dragTarget=null;
  dragBusId=null;
  window.removeEventListener("mousemove", drag);
  window.removeEventListener("mouseup", endDrag);
  window.removeEventListener("touchmove", touchDrag);
  window.removeEventListener("touchend", endDrag);
}

function deleteBus(id){
  const idx = buses.findIndex(b=>b.id===id);
  if(idx>=0){
    buses.splice(idx,1);
    saveBuses();
    renderBuses();
  }
}

// ------------------ SAVE / LOAD ------------------
// Save using GitHub Issues (workflow will commit to JSON)
async function saveBuses(){
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      {
        method: "POST",
        headers: {
          "Accept": "application/vnd.github+json",
        },
        body: JSON.stringify({
          title: "Bus Update",
          body: JSON.stringify(buses),
        }),
      }
    );
    if(!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    document.getElementById("status").textContent = "Saved ✓";
  } catch(err) {
    console.error("Save error:", err);
    document.getElementById("status").textContent = "Save error";
  }
}

// Load current state from GitHub Pages JSON
async function loadBuses() {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/map-state-midday.json?_=${Date.now()}`);
    if(!res.ok) throw new Error(`Fetch error: ${res.status}`);
    const data = await res.json();
    const serverBuses = data.buses || [];
    serverBuses.forEach(serverBus => {
      if(dragBusId && serverBus.id === dragBusId) return;
      const localBus = buses.find(b => b.id===serverBus.id);
      if(localBus){
        localBus.x = serverBus.x;
        localBus.y = serverBus.y;
      } else {
        buses.push(serverBus);
      }
    });
    renderBuses();
  } catch(err) { console.error("Load error:", err); }
}

// ------------------ AUTO REFRESH ------------------
setInterval(loadBuses, 2000);
loadBuses();
