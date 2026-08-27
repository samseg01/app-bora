import React, { useState } from "react";

// ————————————————————————————————————————————————
//  Prévia de tela — app de descoberta de rolês (SP)
//  Conceito: duas camadas verticais.
//   • Topo  = DESCOBERTA (empurra o desconhecido)
//   • Base  = MAPA       (puxa quem já tem região em mente)
//  Nome "Bora" é placeholder — embute a tese (convencer a sair).
// ————————————————————————————————————————————————

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap');

.stage{
  min-height:100vh;
  background:
    radial-gradient(120% 80% at 15% 0%, #26123f 0%, rgba(38,18,63,0) 55%),
    radial-gradient(120% 90% at 90% 20%, #3a0f2e 0%, rgba(58,15,46,0) 50%),
    #0d0a18;
  color:#f3eefc;
  font-family:'Inter',system-ui,sans-serif;
  display:flex; flex-wrap:wrap; gap:48px;
  align-items:center; justify-content:center;
  padding:56px 28px; box-sizing:border-box;
}

/* —— left rail: brand + thesis —— */
.rail{ max-width:340px; }
.brand{
  font-family:'Anton',sans-serif; font-size:64px; line-height:.9;
  letter-spacing:-.5px; text-transform:uppercase; margin:0 0 6px;
}
.brand em{ font-style:normal; color:#ff3d81; }
.brand-dot{ color:#ffb443; }
.tag{ font-size:15px; color:#a99cc4; margin:0 0 28px; line-height:1.5; }
.legend-item{ display:flex; gap:12px; align-items:flex-start; margin-bottom:16px; }
.legend-key{
  font-family:'Anton',sans-serif; font-size:11px; letter-spacing:1.5px;
  text-transform:uppercase; padding:5px 9px; border-radius:6px; white-space:nowrap;
  margin-top:1px;
}
.legend-key.push{ background:rgba(255,61,129,.16); color:#ff6fa0; }
.legend-key.pull{ background:rgba(255,180,67,.16); color:#ffc774; }
.legend-txt{ font-size:13.5px; color:#b4a9cc; line-height:1.5; }
.legend-txt b{ color:#f3eefc; font-weight:600; }
.ph-note{ font-size:12px; color:#6f6690; margin-top:26px; line-height:1.5; }

/* —— phone —— */
.phone{
  width:340px; border-radius:44px; padding:11px;
  background:linear-gradient(150deg,#2a2140,#141020);
  box-shadow:0 40px 90px -30px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.05) inset;
  position:relative; flex:none;
}
.screen{
  border-radius:34px; overflow:hidden; background:#0f0b1c;
  height:720px; display:flex; flex-direction:column; position:relative;
}
.notch{
  position:absolute; top:12px; left:50%; transform:translateX(-50%);
  width:104px; height:26px; background:#000; border-radius:16px; z-index:20;
}

/* —— app header —— */
.appbar{ padding:22px 20px 12px; display:flex; justify-content:space-between; align-items:center; }
.loc{ display:flex; flex-direction:column; gap:2px; }
.loc-lbl{ font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#8478a0; }
.loc-name{ font-size:16px; font-weight:700; display:flex; align-items:center; gap:6px; }
.loc-name svg{ color:#ff3d81; }
.avatar{ width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#ff3d81,#ffb443); }

/* —— discovery layer —— */
.eyebrow{
  display:flex; align-items:baseline; gap:10px; padding:6px 20px 12px;
}
.eyebrow h2{
  font-family:'Anton',sans-serif; font-size:30px; margin:0;
  text-transform:uppercase; letter-spacing:-.3px; line-height:1;
}
.eyebrow span{ font-size:12px; color:#8478a0; }
.rail-scroll{
  display:flex; gap:14px; overflow-x:auto; padding:2px 20px 20px;
  scrollbar-width:none;
}
.rail-scroll::-webkit-scrollbar{ display:none; }
.card{
  flex:none; width:200px; border-radius:20px; overflow:hidden;
  background:#181227; border:1px solid rgba(255,255,255,.06);
  cursor:pointer; transition:transform .18s ease;
}
.card:active{ transform:scale(.97); }
.card-img{ height:112px; position:relative; }
.card-img.g1{ background:linear-gradient(135deg,#ff3d81,#7a1fff); }
.card-img.g2{ background:linear-gradient(135deg,#ffb443,#ff3d81); }
.card-img.g3{ background:linear-gradient(135deg,#1fd0ff,#7a1fff); }
.badge{
  position:absolute; top:10px; left:10px; display:flex; align-items:center; gap:6px;
  background:rgba(13,10,24,.72); backdrop-filter:blur(6px);
  padding:5px 9px; border-radius:20px; font-size:11px; font-weight:600;
}
.dot{ width:7px; height:7px; border-radius:50%; }
.dot.live{ background:#ff3d81; box-shadow:0 0 0 0 rgba(255,61,129,.7); animation:pulse 1.8s infinite; }
.dot.warm{ background:#ffb443; }
.dot.new{ background:#1fd0ff; }
@keyframes pulse{ 70%{ box-shadow:0 0 0 8px rgba(255,61,129,0); } 100%{ box-shadow:0 0 0 0 rgba(255,61,129,0); } }
.card-body{ padding:11px 13px 14px; }
.card-cat{ font-size:10px; letter-spacing:1px; text-transform:uppercase; color:#ffb443; font-weight:600; }
.card-ttl{ font-size:15px; font-weight:700; margin:4px 0 3px; line-height:1.2; }
.card-sub{ font-size:12px; color:#9083ad; }

/* —— seam between the two layers —— */
.seam{
  display:flex; align-items:center; gap:12px; padding:4px 20px 14px;
}
.seam .line{ flex:1; height:1px; background:linear-gradient(90deg,rgba(255,61,129,.4),rgba(255,180,67,.4)); }
.seam .txt{ font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#8478a0; }

/* —— map layer —— */
.map{
  flex:1; margin:0 14px 12px; border-radius:22px; position:relative; overflow:hidden;
  background:#141024;
  background-image:
    linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);
  background-size:38px 38px;
  border:1px solid rgba(255,255,255,.06);
}
.road{ position:absolute; background:rgba(255,255,255,.05); }
.road.r1{ top:0; bottom:0; left:38%; width:10px; transform:skewX(-12deg); }
.road.r2{ left:0; right:0; top:44%; height:9px; transform:skewY(6deg); }
.pin{ position:absolute; transform:translate(-50%,-50%); }
.pin .ring{ width:14px; height:14px; border-radius:50%; }
.pin.hot .ring{ background:#ff3d81; box-shadow:0 0 0 0 rgba(255,61,129,.6); animation:pulse 1.8s infinite; }
.pin.warm .ring{ background:#ffb443; }
.pin.dim .ring{ background:#6a5f88; width:10px; height:10px; }
.comment{
  position:absolute; bottom:14px; left:14px; right:14px;
  background:rgba(20,15,36,.9); backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:12px 14px;
  display:flex; gap:11px; align-items:center;
}
.comment .who{ width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#7a1fff,#1fd0ff); flex:none; }
.comment .msg{ font-size:12.5px; line-height:1.35; color:#cfc6e2; }
.comment .msg b{ color:#fff; font-weight:600; }
.map-tag{
  position:absolute; top:12px; left:12px; font-size:11px; font-weight:600;
  background:rgba(13,10,24,.7); padding:5px 10px; border-radius:20px; color:#b4a9cc;
}

/* —— nav —— */
.nav{
  display:flex; justify-content:space-around; padding:12px 8px 20px;
  border-top:1px solid rgba(255,255,255,.06); background:#0f0b1c;
}
.nav div{ display:flex; flex-direction:column; align-items:center; gap:4px; font-size:10px; color:#6f6690; }
.nav div.on{ color:#ff3d81; }
.nav svg{ width:22px; height:22px; }

@media (prefers-reduced-motion: reduce){
  .dot.live,.pin.hot .ring{ animation:none; }
}
`;

const Pin = ({ x, y, kind }) => (
  <div className={`pin ${kind}`} style={{ left: x, top: y }}>
    <div className="ring" />
  </div>
);

export default function App() {
  const [active, setActive] = useState(0);
  const cards = [
    { g: "g1", live: "live", stat: "Bombando agora", cat: "Balada", ttl: "Selo aberto no rooftop", sub: "Baixo Augusta · house" },
    { g: "g2", live: "warm", stat: "Começando a encher", cat: "Bar", ttl: "Samba de quinta no boteco", sub: "Vila Madalena · pagode" },
    { g: "g3", live: "new", stat: "Estreando hoje", cat: "Sarau", ttl: "Sarau novo na garagem", sub: "Pinheiros · poesia + set" },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="stage">
        {/* left rail */}
        <div className="rail">
          <h1 className="brand"><em>Bora</em><span className="brand-dot">?</span></h1>
          <p className="tag">O rolê que tá rolando agora, perto de você — não o que você já conhece.</p>

          <div className="legend-item">
            <span className="legend-key push">↑ empurra</span>
            <span className="legend-txt"><b>Descoberta.</b> Chegou sem plano? O topo te mostra o desconhecido bom de hoje. Curadoria, não busca.</span>
          </div>
          <div className="legend-item">
            <span className="legend-key pull">↓ puxa</span>
            <span className="legend-txt"><b>Mapa.</b> Já tem região em mente? Explora e vê o que estão comentando — o que mudou, o que é novo.</span>
          </div>

          <p className="ph-note">Prévia de conceito. Nome, cores e copy são placeholders pra sentir a ideia — nada final.</p>
        </div>

        {/* phone */}
        <div className="phone">
          <div className="screen">
            <div className="notch" />

            <div className="appbar">
              <div className="loc">
                <span className="loc-lbl">Você está em</span>
                <span className="loc-name">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z"/></svg>
                  Vila Madalena
                </span>
              </div>
              <div className="avatar" />
            </div>

            {/* discovery */}
            <div className="eyebrow">
              <h2>Hoje à noite</h2>
              <span>curado pra você</span>
            </div>
            <div className="rail-scroll">
              {cards.map((c, i) => (
                <div key={i} className="card" onClick={() => setActive(i)}
                     style={{ outline: active === i ? "2px solid #ff3d81" : "none" }}>
                  <div className={`card-img ${c.g}`}>
                    <div className="badge"><span className={`dot ${c.live}`} />{c.stat}</div>
                  </div>
                  <div className="card-body">
                    <div className="card-cat">{c.cat}</div>
                    <div className="card-ttl">{c.ttl}</div>
                    <div className="card-sub">{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* seam */}
            <div className="seam">
              <div className="line" />
              <span className="txt">ou explore a região</span>
              <div className="line" />
            </div>

            {/* map */}
            <div className="map">
              <span className="map-tag">Vila Madalena · agora</span>
              <div className="road r1" /><div className="road r2" />
              <Pin x="30%" y="32%" kind="hot" />
              <Pin x="58%" y="26%" kind="warm" />
              <Pin x="72%" y="52%" kind="dim" />
              <Pin x="44%" y="60%" kind="hot" />
              <Pin x="20%" y="66%" kind="dim" />
              <div className="comment">
                <div className="who" />
                <div className="msg"><b>Marina</b> e mais 8 sinalizaram: <b>fila andando rápido</b> no bar da esquina 🍻</div>
              </div>
            </div>

            {/* nav */}
            <div className="nav">
              <div className="on">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7 7 .5-5.5 4.5 2 7L12 17l-6.5 4 2-7L2 9.5 9 9z"/></svg>
                Descobrir
              </div>
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/></svg>
                Mapa
              </div>
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 11c0 5.5-7 10-7 10z"/></svg>
                Salvos
              </div>
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
                Perfil
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
