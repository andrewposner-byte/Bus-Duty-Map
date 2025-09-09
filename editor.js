const JSON_URL = "map-state-midday.json";
let buses = [], dragTarget = null, dragBusId = null, offsetX = 0, offsetY = 0;

async function loadBuses() {
  try {
    const res = await fetch(JSON_URL);
    const data = await res.json();
    buses = data.buses || [];
    renderBuses();
  } catch(e){ console.error(e); }
}

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

function addBus() {
  const id = document.getElementById("busId").value.trim() || `B${buses.length+1}`;
  buses.push({id, x:120 + buses.length*40, y:600});
  renderBuses();
}

function startDrag(evt, element) {
  evt.preventDefault();
  dragTarget = element;
  dragBusId = element.dataset.id;
  const transform = element.getAttribute("transform");
  const match = /translate\(([-\d.]+),([-\d.]+)\)/.exec(transform);
  offsetX = evt.clientX - parseFloat(match[1]);
  offsetY = evt.clientY - parseFloat(match[2]);
  window.addEventListener("mousemove", drag);
  window.addEventListener("mouseup", endDrag);
}

function drag(evt) {
  if(!dragTarget) return;
  const x = evt.clientX - offsetX;
  const y = evt.clientY - offsetY;
  dragTarget.setAttribute("transform",`translate(${x},${y})`);
}

function endDrag(evt){
  if(!dragTarget) return;
  const id = dragTarget.dataset.id;
  const match = /translate\(([-\d.]+),([-\d.]+)\)/.exec(dragTarget.getAttribute("transform"));
  const bus = buses.find(b=>b.id===id);
  if(bus){ bus.x=parseFloat(match[1]); bus.y=parseFloat(match[2]); }
  dragTarget=null; dragBusId=null;
  window.removeEventListener("mousemove", drag);
  window.removeEventListener("mouseup", endDrag);
}

function deleteBus(id){
  buses = buses.filter(b=>b.id!==id);
  renderBuses();
}

loadBuses();
