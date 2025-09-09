const URL = "https://andrewposner-byte.github.io/Bus-Duty-Map/map-state-midday.json"; // GitHub JSON path
let buses = [];

// ------------------ RENDER ------------------
function renderBuses() {
  const busMap = document.getElementById("busMap");
  document.querySelectorAll(".bus").forEach(el => el.remove());

  buses.forEach(bus => {
    const g = document.createElementNS("http://www.w3.org/2000/svg","g");
    g.setAttribute("class","bus");
    g.setAttribute("transform",`translate(${bus.x},${bus.y})`);

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
  });
}

// ------------------ LOAD ------------------
async function loadBuses() {
  try {
    const res = await fetch(URL + "?_=" + Date.now());
    if(!res.ok) return;
    buses = await res.json();
    renderBuses();
  } catch(e) {
    console.error("Load error:", e);
  }
}

// ------------------ AUTO REFRESH ------------------
setInterval(loadBuses, 2000);
loadBuses();
