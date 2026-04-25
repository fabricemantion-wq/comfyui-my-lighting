import { app } from "../../../scripts/app.js";

const LIGHT_TYPES = {
    sun:    { label: "Sunlight",    icon: "sun",    color: "#FFD700", prompts: { low: "soft golden sunlight",       med: "bright sunlight",         high: "intense direct sunlight" } },
    window: { label: "Window",      icon: "window", color: "#B0D4F1", prompts: { low: "soft diffused window light", med: "natural window light",     high: "strong window light" } },
    candle: { label: "Candlelight", icon: "🕯",     color: "#FF8C00", prompts: { low: "faint candlelight",          med: "warm candlelight",         high: "bright candlelight" } },
    neon:   { label: "Neon",        icon: "neon",   color: "#FF00FF", prompts: { low: "subtle neon glow",           med: "neon light",               high: "vivid neon light" } },
    spot:   { label: "Spotlight",   icon: "⬤",      color: "#FFFFFF", prompts: { low: "soft spotlight",             med: "spotlight",                high: "harsh spotlight" } },
    studio: { label: "Studio",      icon: "◻",      color: "#E0E0FF", prompts: { low: "soft studio light",          med: "studio light",             high: "bright studio light" } },
    fire:   { label: "Fire",        icon: "🔥",     color: "#FF4500", prompts: { low: "distant firelight",          med: "warm firelight",           high: "intense firelight" } },
    moon:   { label: "Moonlight",   icon: "☽",      color: "#C0C8FF", prompts: { low: "faint moonlight",            med: "soft moonlight",           high: "bright moonlight" } },
};

const HEIGHTS = { low: "from below", mid: "", high: "from above" };

const MOODS = [
    { value: "",                     label: "— None —" },
    { value: "golden hour",          label: "Golden Hour" },
    { value: "blue hour",            label: "Blue Hour" },
    { value: "studio lighting",      label: "Studio" },
    { value: "night scene",          label: "Night" },
    { value: "overcast sky",         label: "Overcast" },
    { value: "dramatic chiaroscuro", label: "Chiaroscuro" },
    { value: "cinematic lighting",   label: "Cinematic" },
    { value: "high key lighting",    label: "High Key" },
    { value: "low key lighting",     label: "Low Key" },
];

const DIRECTIONS = [
    "from the front", "from the front-right", "from the right",
    "from the back-right", "from the back", "from the back-left",
    "from the left", "from the front-left",
];

function angleToDirection(angleDeg) {
    const idx = Math.round(((angleDeg + 22.5) % 360) / 45) % 8;
    return DIRECTIONS[idx];
}

function distToWord(dist) {
    if (dist < 0.35) return "very close";
    if (dist < 0.6)  return "nearby";
    if (dist < 0.85) return "at medium distance";
    return "far away";
}

function hexToColorName(hex) {
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    const lightness=(max+min)/2/255;
    const saturation=max===min?0:(max-min)/(lightness>0.5?2-max/255-min/255:max/255+min/255);
    if(saturation<0.15){ if(lightness>0.85) return "white"; if(lightness<0.15) return "black"; return "neutral grey"; }
    const hue=(Math.atan2(Math.sqrt(3)*(g-b),2*r-g-b)*180/Math.PI+360)%360;
    const w=lightness>0.6?"soft ":lightness<0.3?"deep ":"";
    if(hue<20) return w+"red"; if(hue<45) return w+"orange"; if(hue<75) return w+"yellow";
    if(hue<160) return w+"green"; if(hue<200) return w+"cyan"; if(hue<260) return w+"blue";
    if(hue<290) return w+"purple"; if(hue<340) return w+"pink"; return w+"red";
}

function buildPrompt(lights, mood) {
    const parts = [];
    if (mood) parts.push(mood);
    for (const light of lights) {
        const lt = LIGHT_TYPES[light.type]; if (!lt) continue;
        const base = lt.prompts[light.intensity || "med"];
        const dir  = angleToDirection(light.angle);
        const h    = HEIGHTS[light.height || "mid"];
        const dist = distToWord(light.dist ?? 0.75);
        const defaultCol = lt.color.toLowerCase();
        const currentCol = (light.customColor || lt.color).toLowerCase();
        const colWord = currentCol !== defaultCol ? hexToColorName(light.customColor||lt.color)+" tinted" : "";
        const inFrame = light.inFrame === true;
        const quality = light.quality || "";
        const qualityWord = quality ? quality + " " : "";
        if (inFrame) {
            const p = [colWord?colWord+" "+qualityWord+base:qualityWord+base, dir, dist!=="at medium distance"?dist:"", h]
                .filter(Boolean).join(" ").replace(/\s+/g," ").trim();
            parts.push(p);
        } else {
            const p = ["lit by", colWord?colWord+" "+qualityWord+base:qualityWord+base, "out of frame", h]
                .filter(Boolean).join(" ").replace(/\s+/g," ").trim();
            parts.push(p);
        }
    }
    return parts.join(", ");
}

function intensityIcon(v) {
    const off="#3a3a3a";
    const bar=(h,c)=>`<span style="display:inline-block;width:4px;height:${h};border-radius:1px;background:${c};"></span>`;
    const map={
        low:  [bar("6px","#EF9F27"),bar("9px",off),bar("12px",off)],
        med:  [bar("6px","#EF9F27"),bar("9px","#D85A30"),bar("12px",off)],
        high: [bar("6px","#EF9F27"),bar("9px","#D85A30"),bar("12px","#E24B4A")],
    };
    return `<span style="display:inline-flex;gap:2px;align-items:flex-end;">${(map[v]||map.med).join("")}</span>`;
}

function distIcon(d) {
    const col="#378ADD", off="#3a3a3a";
    const bar=(h,c)=>`<span style="display:inline-block;width:4px;height:${h};border-radius:1px;background:${c};"></span>`;
    if(d<0.35) return `<span style="display:inline-flex;gap:2px;align-items:flex-end;">${bar("6px",col)}${bar("9px",off)}${bar("12px",off)}</span>`;
    if(d<0.6)  return `<span style="display:inline-flex;gap:2px;align-items:flex-end;">${bar("6px",col)}${bar("9px",col)}${bar("12px",off)}</span>`;
    return `<span style="display:inline-flex;gap:2px;align-items:flex-end;">${bar("6px",col)}${bar("9px",col)}${bar("12px",col)}</span>`;
}

function drawLightIcon(ctx, icon, x, y, size, col) {
    ctx.save(); ctx.fillStyle=col; ctx.strokeStyle=col;
    if (icon==="neon") {
        const rw=size*1.4, rh=size*0.4;
        ctx.fillRect(x-rw/2,y-rh/2,rw,rh);
        ctx.lineWidth=1.5; ctx.lineCap="round";
        [[-(rw/2+4),0,-(rw/2+8),0],[(rw/2+4),0,(rw/2+8),0],
         [0,-(rh/2+4),0,-(rh/2+8)],[0,(rh/2+4),0,(rh/2+8)],
         [-(rw/2+3),-(rh/2+3),-(rw/2+6),-(rh/2+6)],[(rw/2+3),-(rh/2+3),(rw/2+6),-(rh/2+6)],
         [-(rw/2+3),(rh/2+3),-(rw/2+6),(rh/2+6)],[(rw/2+3),(rh/2+3),(rw/2+6),(rh/2+6)]
        ].forEach(([x1,y1,x2,y2])=>{ ctx.beginPath(); ctx.moveTo(x+x1,y+y1); ctx.lineTo(x+x2,y+y2); ctx.stroke(); });
    } else if (icon==="sun") {
        const r=size*0.35; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
        ctx.lineWidth=1.5; ctx.lineCap="round";
        for(let i=0;i<8;i++){const a=i*Math.PI/4; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*(r+3),y+Math.sin(a)*(r+3)); ctx.lineTo(x+Math.cos(a)*(r+7),y+Math.sin(a)*(r+7)); ctx.stroke();}
    } else if (icon==="window") {
        const hw=size*0.45, hh=size*0.45; ctx.lineWidth=1.5;
        ctx.strokeRect(x-hw,y-hh,hw*2,hh*2);
        ctx.beginPath(); ctx.moveTo(x,y-hh); ctx.lineTo(x,y+hh); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x-hw,y); ctx.lineTo(x+hw,y); ctx.stroke();
    } else {
        ctx.font=`${size}px sans-serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(icon,x,y);
    }
    ctx.restore();
}

// -----------------------------------------------------------------------
// Node registration
// -----------------------------------------------------------------------
app.registerExtension({
    name: "Comfy.My_Lighting",

    beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "My_Lighting") return;

        const origOnNodeCreated = nodeType.prototype.onNodeCreated;

        nodeType.prototype.onNodeCreated = function() {
            if (origOnNodeCreated) origOnNodeCreated.apply(this, arguments);

            const node = this;
            if (!node.properties)        node.properties        = {};
            if (!node.properties.lights) node.properties.lights = [];
            if (!node.properties.mood)   node.properties.mood   = "";

            // ComfyUI a déjà créé le widget "lighting_prompt" depuis Python INPUT_TYPES
            // On le récupère et on le place correctement
            const promptWidget = node.widgets.find(w => w.name === "lighting_prompt");

            // Ajouter le bouton après
            node.addWidget("button", "⚡ Edit Lighting", null, () => openModal(node));

            // Remettre le prompt widget en dernier (après le bouton)
            if (promptWidget) {
                node.widgets = node.widgets.filter(w => w !== promptWidget);
                node.widgets.push(promptWidget);
                promptWidget.disabled = true;
            }

            node._syncData = function() {
                const prompt = buildPrompt(node.properties.lights, node.properties.mood);
                if (promptWidget) promptWidget.value = prompt;
                node.setDirtyCanvas(true, true);
            };

            setTimeout(() => node._syncData(), 100);
        };
    }
});

// -----------------------------------------------------------------------
// Modal
// -----------------------------------------------------------------------
function openModal(node) {
    const existing = document.getElementById("my-lighting-modal");
    if (existing) existing.remove();

    let lights = JSON.parse(JSON.stringify(node.properties.lights || []));
    let mood   = node.properties.mood || "";

    const overlay = document.createElement("div");
    overlay.id = "my-lighting-modal";
    overlay.style.cssText = `position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);
        display:flex;align-items:center;justify-content:center;font-family:'Segoe UI',sans-serif;`;

    const modal = document.createElement("div");
    modal.style.cssText = `background:#161616;border:1px solid #2a2a2a;border-radius:14px;
        padding:24px;width:720px;max-height:92vh;overflow-y:auto;color:#ddd;
        box-shadow:0 20px 80px rgba(0,0,0,0.95);display:flex;flex-direction:column;gap:16px;`;

    const title = document.createElement("div");
    title.textContent = "⚡ Lighting Setup";
    title.style.cssText = "font-size:18px;font-weight:700;color:#fff;letter-spacing:0.5px;";
    modal.appendChild(title);

    const topRow = document.createElement("div");
    topRow.style.cssText = "display:flex;gap:20px;align-items:flex-start;";

    const CW=300, CH=300;
    const canvas = document.createElement("canvas");
    canvas.width=CW; canvas.height=CH;
    canvas.style.cssText="border-radius:50%;cursor:crosshair;display:block;flex-shrink:0;";
    topRow.appendChild(canvas);

    const right = document.createElement("div");
    right.style.cssText="flex:1;display:flex;flex-direction:column;gap:10px;";

    function sep(t) {
        const d=document.createElement("div");
        d.style.cssText="font-size:10px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-top:4px;";
        d.textContent=t; return d;
    }

    right.appendChild(sep("Global Mood"));
    const moodSel=document.createElement("select");
    moodSel.style.cssText="background:#1e1e1e;border:1px solid #333;border-radius:6px;color:#ccc;padding:6px 10px;width:100%;";
    MOODS.forEach(m=>{
        const o=document.createElement("option"); o.value=m.value; o.textContent=m.label;
        if(m.value===mood) o.selected=true; moodSel.appendChild(o);
    });
    moodSel.onchange=()=>{ mood=moodSel.value; updateAll(); };
    right.appendChild(moodSel);

    right.appendChild(sep("Light Type — click diagram to place"));
    const typeGrid=document.createElement("div");
    typeGrid.style.cssText="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;";
    let selectedType="sun";
    const typeBtns={};
    Object.entries(LIGHT_TYPES).forEach(([key,lt])=>{
        const btn=document.createElement("button");
        btn.style.cssText=`background:#1e1e1e;border:2px solid ${key===selectedType?lt.color:"#2a2a2a"};
            border-radius:6px;color:#fff;padding:5px 2px;cursor:pointer;
            display:flex;flex-direction:column;align-items:center;gap:2px;transition:border-color 0.15s;`;
        if(["neon","sun","window"].includes(lt.icon)){
            const ic=document.createElement("canvas"); ic.width=22; ic.height=22; ic.style.cssText="display:block;";
            drawLightIcon(ic.getContext("2d"),lt.icon,11,11,9,lt.color); btn.appendChild(ic);
        } else {
            const sp=document.createElement("span"); sp.style.cssText="font-size:16px;line-height:1;";
            sp.textContent=lt.icon; btn.appendChild(sp);
        }
        const lbl=document.createElement("span"); lbl.style.cssText="font-size:9px;color:#666;";
        lbl.textContent=lt.label; btn.appendChild(lbl);
        btn.onclick=()=>{ selectedType=key; Object.entries(typeBtns).forEach(([k,b])=>b.style.borderColor=k===key?LIGHT_TYPES[k].color:"#2a2a2a"); };
        typeBtns[key]=btn; typeGrid.appendChild(btn);
    });
    right.appendChild(typeGrid);

    const hint=document.createElement("div");
    hint.style.cssText="font-size:11px;color:#444;margin-top:4px;";
    hint.textContent="Click to add • Drag to move • Right-click to remove";
    right.appendChild(hint);

    // --- Presets ---
    right.appendChild(sep("Presets"));
    const presetRow=document.createElement("div");
    presetRow.style.cssText="display:flex;gap:6px;align-items:center;";

    const presetSel=document.createElement("select");
    presetSel.style.cssText="flex:1;background:#1e1e1e;border:1px solid #333;border-radius:6px;color:#ccc;padding:4px 8px;font-size:12px;";

    const presetNameIn=document.createElement("input");
    presetNameIn.type="text"; presetNameIn.placeholder="Preset name…";
    presetNameIn.style.cssText="flex:1;background:#1e1e1e;border:1px solid #333;border-radius:6px;color:#ccc;padding:4px 8px;font-size:12px;outline:none;";

    async function loadPresetList() {
        try {
            const r=await fetch("/my_lighting/presets"); const data=await r.json();
            presetSel.innerHTML="";
            const placeholder=document.createElement("option"); placeholder.value=""; placeholder.textContent="— Select preset —";
            presetSel.appendChild(placeholder);
            Object.keys(data).forEach(name=>{
                const o=document.createElement("option"); o.value=name; o.textContent=name; presetSel.appendChild(o);
            });
            return data;
        } catch(e){ return {}; }
    }

    const btnLoad=document.createElement("button"); btnLoad.textContent="Load";
    btnLoad.style.cssText="background:#1e1e1e;border:1px solid #333;border-radius:6px;color:#888;padding:4px 10px;font-size:12px;cursor:pointer;";
    btnLoad.onclick=async()=>{
        const name=presetSel.value; if(!name) return;
        const data=await loadPresetList();
        const preset=data[name]; if(!preset) return;
        lights=JSON.parse(JSON.stringify(preset.lights||[]));
        mood=preset.mood||"";
        moodSel.value=mood;
        rebuildList(); drawCanvas(); updateAll();
    };

    const btnSave=document.createElement("button"); btnSave.textContent="Save";
    btnSave.style.cssText="background:#1a5fa8;border:none;border-radius:6px;color:#fff;padding:4px 10px;font-size:12px;cursor:pointer;";
    btnSave.onclick=async()=>{
        const name=presetNameIn.value.trim(); if(!name) return;
        await fetch("/my_lighting/presets",{method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({name,preset:{lights,mood}})});
        presetNameIn.value="";
        await loadPresetList();
        presetSel.value=name;
    };

    const btnDel=document.createElement("button"); btnDel.textContent="✕";
    btnDel.style.cssText="background:none;border:1px solid #333;border-radius:6px;color:#555;padding:4px 8px;font-size:12px;cursor:pointer;";
    btnDel.onclick=async()=>{
        const name=presetSel.value; if(!name) return;
        await fetch("/my_lighting/presets",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})});
        await loadPresetList();
    };

    // Row 1 : select + load + delete
    const presetRow1=document.createElement("div"); presetRow1.style.cssText="display:flex;gap:6px;align-items:center;";
    presetRow1.appendChild(presetSel); presetRow1.appendChild(btnLoad); presetRow1.appendChild(btnDel);
    right.appendChild(presetRow1);

    // Row 2 : name input + save
    const presetRow2=document.createElement("div"); presetRow2.style.cssText="display:flex;gap:6px;align-items:center;";
    presetRow2.appendChild(presetNameIn); presetRow2.appendChild(btnSave);
    right.appendChild(presetRow2);

    loadPresetList();

    topRow.appendChild(right);
    modal.appendChild(topRow);

    modal.appendChild(sep("Light Sources"));

    const GRID = "1fr 76px 96px 52px 76px 80px 40px 24px"; // source | visible | intensity | dist | height | quality | color | remove

    // Header
    const listHeader=document.createElement("div");
    listHeader.style.cssText=`display:grid;grid-template-columns:${GRID};align-items:center;padding:0 14px;column-gap:8px;`;
    function hcol(label, align) {
        const d=document.createElement("div");
        d.style.cssText=`font-size:10px;color:#555;text-transform:uppercase;letter-spacing:1px;text-align:${align||"left"};`;
        d.textContent=label; return d;
    }
    listHeader.appendChild(hcol("Source"));
    listHeader.appendChild(hcol("Visible"));
    listHeader.appendChild(hcol("Intensity"));
    listHeader.appendChild(hcol("Dist.","right"));
    listHeader.appendChild(hcol("Height"));
    listHeader.appendChild(hcol("Quality"));
    listHeader.appendChild(hcol("Color","right"));
    listHeader.appendChild(document.createElement("div"));
    modal.appendChild(listHeader);

    const lightList=document.createElement("div");
    lightList.style.cssText="display:flex;flex-direction:column;gap:6px;";
    modal.appendChild(lightList);

    modal.appendChild(sep("Output Preview"));
    const previewBox=document.createElement("div");
    previewBox.style.cssText=`background:#0d0d0d;border:1px solid #222;border-radius:6px;
        padding:10px 14px;font-size:13px;color:#888;min-height:36px;font-style:italic;word-break:break-word;`;
    modal.appendChild(previewBox);

    const btnRow=document.createElement("div");
    btnRow.style.cssText="display:flex;gap:10px;justify-content:flex-end;";
    const btnCancel=document.createElement("button");
    btnCancel.textContent="Cancel";
    btnCancel.style.cssText="background:#1e1e1e;border:1px solid #333;border-radius:6px;color:#666;padding:8px 20px;cursor:pointer;";
    btnCancel.onclick=()=>overlay.remove();
    const btnApply=document.createElement("button");
    btnApply.textContent="✔ Apply";
    btnApply.style.cssText="background:#1a5fa8;border:none;border-radius:6px;color:#fff;padding:8px 22px;cursor:pointer;font-weight:600;";
    btnApply.onclick=()=>{
        node.properties.lights=JSON.parse(JSON.stringify(lights));
        node.properties.mood=mood;
        node._syncData();
        overlay.remove();
    };
    btnRow.appendChild(btnCancel); btnRow.appendChild(btnApply);
    modal.appendChild(btnRow);

    const cx=CW/2, cy=CH/2, maxR=CW/2-12;
    let dragging=null;

    function drawCanvas(){
        const ctx=canvas.getContext("2d");
        ctx.clearRect(0,0,CW,CH);
        ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,maxR,0,Math.PI*2);
        ctx.fillStyle="#111"; ctx.fill(); ctx.strokeStyle="#2a2a2a"; ctx.lineWidth=1; ctx.stroke(); ctx.restore();

        // Secteurs en camembert alternés (8 x 45°)
        ctx.save();
        ctx.beginPath(); ctx.arc(cx,cy,maxR,0,Math.PI*2); ctx.clip();
        for(let i=0;i<8;i++){
            const a0=(i*45-90)*Math.PI/180, a1=((i+1)*45-90)*Math.PI/180;
            ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,maxR,a0,a1); ctx.closePath();
            ctx.fillStyle = i%2===0 ? "#141414" : "#181818";
            ctx.fill();
        }
        ctx.restore();
        ctx.save();
        [0.35,0.6,0.85].forEach(r=>{ctx.beginPath(); ctx.arc(cx,cy,maxR*r,0,Math.PI*2); ctx.strokeStyle="#444"; ctx.lineWidth=1; ctx.stroke();});
        ctx.restore();
        ctx.save(); ctx.strokeStyle="#1a1a1a"; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(cx-maxR,cy); ctx.lineTo(cx+maxR,cy);
        ctx.moveTo(cx,cy-maxR); ctx.lineTo(cx,cy+maxR); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.fillStyle="#555"; ctx.font="bold 10px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText("FRONT",cx,cy+maxR-10); ctx.fillText("BACK",cx,cy-maxR+10);
        ctx.fillText("L",cx-maxR+8,cy); ctx.fillText("R",cx+maxR-8,cy); ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.arc(cx,cy,18,0,Math.PI*2); ctx.fillStyle="#1e1e1e"; ctx.fill();
        ctx.strokeStyle="#444"; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle="#555";
        ctx.beginPath(); ctx.arc(cx,cy-7,5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx,cy+8,10,Math.PI,Math.PI*2); ctx.fill(); ctx.restore();
        lights.forEach((light,i)=>{
            const lt=LIGHT_TYPES[light.type]; if(!lt) return;
            const d=light.dist??0.75;
            const lx=cx+Math.sin(light.angle*Math.PI/180)*maxR*d;
            const ly=cy-Math.cos(light.angle*Math.PI/180)*maxR*d;
            const col=light.customColor||lt.color;
            const alpha=light.intensity==="low"?0.12:light.intensity==="high"?0.4:0.25;
            ctx.save();
            const grad=ctx.createLinearGradient(lx,ly,cx,cy);
            grad.addColorStop(0,col+Math.round(alpha*255).toString(16).padStart(2,"0"));
            grad.addColorStop(1,"transparent");
            ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(cx,cy);
            ctx.strokeStyle=grad; ctx.lineWidth=light.intensity==="high"?3:1.5; ctx.stroke(); ctx.restore();
            ctx.save();
            ctx.beginPath(); ctx.arc(lx,ly,14,0,Math.PI*2);
            ctx.fillStyle=col+"22"; ctx.fill(); ctx.strokeStyle=col; ctx.lineWidth=2; ctx.stroke();
            drawLightIcon(ctx,lt.icon,lx,ly,9,"#fff");
            ctx.restore();
        });
    }

    function rebuildList(){
        lightList.innerHTML="";
        if(lights.length===0){
            const empty=document.createElement("div");
            empty.style.cssText="color:#333;font-size:13px;text-align:center;padding:10px;";
            empty.textContent="No lights — click on the diagram to add one";
            lightList.appendChild(empty); return;
        }
        lights.forEach((light,i)=>{
            const lt=LIGHT_TYPES[light.type]; if(!lt) return;
            const col=light.customColor||lt.color;

            const row=document.createElement("div");
            row.style.cssText=`background:#1a1a1a;border:1px solid #252525;border-radius:8px;
                padding:8px 14px;display:grid;grid-template-columns:${GRID};align-items:center;column-gap:8px;`;

            // Source
            const nameCol=document.createElement("div");
            nameCol.style.cssText="display:flex;align-items:center;gap:5px;min-width:0;";
            const dot=document.createElement("span");
            dot.style.cssText=`width:8px;height:8px;border-radius:50%;background:${col};display:inline-block;flex-shrink:0;`;
            const nameLbl=document.createElement("span");
            nameLbl.style.cssText="font-size:12px;font-weight:600;color:#bbb;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
            nameLbl.textContent=`${i+1}. ${lt.label}`;
            nameCol.appendChild(dot); nameCol.appendChild(nameLbl);
            row.appendChild(nameCol);

            // Visible (checkbox) — aligné à gauche
            const frameWrap=document.createElement("div"); frameWrap.style.cssText="display:flex;align-items:center;justify-content:flex-start;";
            const frameCb=document.createElement("input"); frameCb.type="checkbox";
            frameCb.checked = light.inFrame === true;
            frameCb.style.cssText="width:15px;height:15px;cursor:pointer;accent-color:#1a5fa8;";
            frameCb.onchange=()=>{ lights[i].inFrame=frameCb.checked; updateAll(); };
            frameWrap.appendChild(frameCb);
            row.appendChild(frameWrap);

            // Intensity — aligné à gauche
            const intWrap=document.createElement("div"); intWrap.style.cssText="display:flex;align-items:center;gap:5px;justify-content:flex-start;";
            const intIcon=document.createElement("span"); intIcon.style.cssText="display:inline-flex;align-items:flex-end;flex-shrink:0;";
            intIcon.innerHTML=intensityIcon(light.intensity||"med");
            const intSel=document.createElement("select");
            intSel.style.cssText="background:#222;border:1px solid #333;border-radius:4px;color:#888;padding:2px 2px;font-size:11px;flex:1;min-width:0;";
            ["low","med","high"].forEach(v=>{
                const o=document.createElement("option"); o.value=v; o.textContent=v.charAt(0).toUpperCase()+v.slice(1);
                if(v===(light.intensity||"med")) o.selected=true; intSel.appendChild(o);
            });
            intSel.onchange=()=>{ lights[i].intensity=intSel.value; intIcon.innerHTML=intensityIcon(intSel.value); updateAll(); };
            intWrap.appendChild(intIcon); intWrap.appendChild(intSel);
            row.appendChild(intWrap);

            // Distance — aligné à droite
            const distIco=document.createElement("span"); distIco.style.cssText="display:flex;align-items:flex-end;justify-content:flex-end;";
            distIco.innerHTML=distIcon(light.dist??0.75);
            row.appendChild(distIco);

            // Height — aligné à gauche
            const hSel=document.createElement("select");
            hSel.style.cssText="background:#222;border:1px solid #333;border-radius:4px;color:#888;padding:2px 2px;font-size:11px;width:100%;";
            [["low","↙ Low"],["mid","→ Mid"],["high","↗ High"]].forEach(([v,l])=>{
                const o=document.createElement("option"); o.value=v; o.textContent=l;
                if(v===(light.height||"mid")) o.selected=true; hSel.appendChild(o);
            });
            hSel.onchange=()=>{ lights[i].height=hSel.value; updateAll(); };
            row.appendChild(hSel);

            // Quality (optionnel)
            const qSel=document.createElement("select");
            qSel.style.cssText="background:#222;border:1px solid #333;border-radius:4px;color:#888;padding:2px 2px;font-size:11px;width:100%;";
            [["","— none —"],["soft","Soft"],["hard","Hard"],["diffuse","Diffuse"],["harsh","Harsh"],["warm","Warm"],["cold","Cold"]].forEach(([v,l])=>{
                const o=document.createElement("option"); o.value=v; o.textContent=l;
                if(v===(light.quality||"")) o.selected=true; qSel.appendChild(o);
            });
            qSel.onchange=()=>{ lights[i].quality=qSel.value; updateAll(); };
            row.appendChild(qSel);

            // Color — aligné à droite
            const colPick=document.createElement("input"); colPick.type="color"; colPick.value=col;
            colPick.style.cssText="width:28px;height:22px;padding:0;border:none;cursor:pointer;border-radius:4px;justify-self:flex-end;";
            colPick.oninput=()=>{ lights[i].customColor=colPick.value; dot.style.background=colPick.value; drawCanvas(); updateAll(); };
            row.appendChild(colPick);

            // Remove
            const rm=document.createElement("button"); rm.textContent="✕";
            rm.style.cssText="background:none;border:none;color:#333;cursor:pointer;font-size:13px;padding:0;justify-self:center;";
            rm.onmouseenter=()=>rm.style.color="#e55"; rm.onmouseleave=()=>rm.style.color="#333";
            rm.onclick=()=>{ lights.splice(i,1); rebuildList(); drawCanvas(); updateAll(); };
            row.appendChild(rm);

            lightList.appendChild(row);
        });
    }

    function updateAll(){ previewBox.textContent=buildPrompt(lights,mood)||"(no lights configured)"; }

    function getPos(e){ const r=canvas.getBoundingClientRect(); return{x:e.clientX-r.left,y:e.clientY-r.top}; }
    function posToAngle(x,y){ return(Math.atan2(x-cx,-(y-cy))*180/Math.PI+360)%360; }
    function posToDist(x,y){ return Math.min(Math.hypot(x-cx,y-cy)/maxR,1.0); }
    function findLight(x,y){
        for(let i=lights.length-1;i>=0;i--){
            const l=lights[i];
            const lx=cx+Math.sin(l.angle*Math.PI/180)*maxR*(l.dist??0.75);
            const ly=cy-Math.cos(l.angle*Math.PI/180)*maxR*(l.dist??0.75);
            if(Math.hypot(x-lx,y-ly)<18) return i;
        } return -1;
    }

    canvas.onmousedown=e=>{
        if(e.button===2) return;
        const{x,y}=getPos(e); const idx=findLight(x,y);
        if(idx!==-1){ dragging=idx; return; }
        if(lights.length>=6||Math.hypot(x-cx,y-cy)>maxR) return;
        lights.push({type:selectedType,angle:Math.round(posToAngle(x,y)),dist:posToDist(x,y),intensity:"med",height:"mid",customColor:LIGHT_TYPES[selectedType].color});
        rebuildList(); drawCanvas(); updateAll();
    };
    canvas.onmousemove=e=>{
        if(dragging===null) return;
        const{x,y}=getPos(e);
        lights[dragging].angle=Math.round(posToAngle(x,y));
        lights[dragging].dist=Math.min(posToDist(x,y),0.98);
        rebuildList(); drawCanvas(); updateAll();
    };
    canvas.onmouseup=()=>{ dragging=null; };
    canvas.onmouseleave=()=>{ dragging=null; };
    canvas.oncontextmenu=e=>{
        e.preventDefault(); const{x,y}=getPos(e); const idx=findLight(x,y);
        if(idx!==-1){ lights.splice(idx,1); rebuildList(); drawCanvas(); updateAll(); }
    };

    overlay.onclick=e=>{ if(e.target===overlay) overlay.remove(); };
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    rebuildList(); drawCanvas(); updateAll();
}
