
let map = L.map('map',{zoomControl:true}).setView([-30.038,-51.18],13);
// Provider 100% gratuito sem API key - HOT
let currentLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',{
  maxZoom:19,
  subdomains:'abc',
  attribution:'&copy; OpenStreetMap, HOT'
}).addTo(map);
currentLayer.on('tileerror',()=>{
  // fallback Esri
  map.removeLayer(currentLayer);
  currentLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',{
    attribution:'Esri'
  }).addTo(map);
  document.getElementById('tile-source').textContent='esri (fallback)';
});

const rota = [
 [-30.0275,-51.2285],[-30.029,-51.22],[-30.031,-51.21],[-30.033,-51.20],[-30.035,-51.19],
 [-30.037,-51.18],[-30.039,-51.17],[-30.041,-51.16],[-30.044,-51.15],[-30.047,-51.14],
 [-30.05,-51.13],[-30.053,-51.12],[-30.056,-51.115],[-30.058,-51.11],[-30.06,-51.105]
];
L.polyline(rota,{color:'#22c55e',weight:4,opacity:0.8}).addTo(map);

// 38 paradas simuladas ao longo da rota
let paradas=[];
for(let i=0;i<38;i++){
  let t=i/37;
  let idx=Math.floor(t*(rota.length-1));
  let lat=rota[idx][0]+(Math.random()-0.5)*0.002;
  let lng=rota[idx][1]+(Math.random()-0.5)*0.002;
  paradas.push([lat,lng]);
  L.marker([lat,lng],{icon:L.divIcon({className:'',html:`<div class="parada-num">${i+1}</div>`,iconSize:[22,22]})}).addTo(map);
}

let buses=[
  {id:'B1',p:0.2,speed:30,pax:4,prog:52,icon:'B1'},
  {id:'B2',p:0.85,speed:27,pax:30,prog:88,icon:'B2'},
  {id:'B3',p:0.35,speed:22,pax:3,prog:22,icon:'B3'}
];
let markers={};
buses.forEach(b=>{
  let idx=Math.floor(b.p*(rota.length-1));
  let m=L.marker(rota[idx],{icon:L.divIcon({className:'',html:`<div class="bus-icon ${b.id}">${b.id}</div>`,iconSize:[28,28]})}).addTo(map);
  markers[b.id]=m;
});

function renderFleet(){
  const fleet=document.getElementById('fleet');
  fleet.innerHTML=buses.map(b=>`
    <div class="bus-card ${b.id}">
      <div class="top"><b>${b.id} • 665</b><span style="font-size:11px;opacity:.7">${b.pax} pax • ${b.speed} km/h • ${b.prog}%</span></div>
      <div class="prog"><i style="width:${b.prog}%"></i></div>
      <div style="font-size:11px;opacity:.6;margin-top:4px">Parada ${Math.round(b.p*38)}/38</div>
    </div>
  `).join('');
  document.getElementById('bus-count').textContent=`${buses.length} ônibus`;
}
renderFleet();

let modo='SIMULACAO';
setInterval(()=>{
  if(modo!=='SIMULACAO') return;
  buses.forEach(b=>{
    b.p+=0.002+Math.random()*0.002;
    if(b.p>1) b.p=0;
    b.prog=Math.round(b.p*100);
    let idx=Math.floor(b.p*(rota.length-1));
    markers[b.id].setLatLng(rota[idx]);
  });
  renderFleet();
  let now=new Date().toLocaleTimeString();
  document.getElementById('last-update').textContent=now;
},1200);

// API real - tenta via proxy, se não, mantém simulação
async function tentarApiReal(){
  const pill=document.getElementById('status-text');
  pill.textContent='BUSCANDO API...';
  const urls=[
    'https://api.allorigins.win/raw?url=http://www.poatransporte.com.br/php/facades/process.php?a=nc&p=%&t=o',
    'https://corsproxy.io/?http://www.poatransporte.com.br/php/facades/process.php?a=nc&p=%&t=o'
  ];
  for(let u of urls){
    try{
      let r=await fetch(u);
      let j=await r.json();
      // tenta filtrar 665
      let filtrado=j.filter && j.filter(o=>JSON.stringify(o).includes('665')) || [];
      if(filtrado.length>0){
        modo='REAL';
        pill.textContent=`AO VIVO REAL • ${filtrado.length} ônibus`;
        document.getElementById('status-pill').style.background='#052e16';
        alert('API real encontrada! '+filtrado.length+' ônibus da 665. Código para adaptar markers no console.');
        console.log('Dados reais 665:',filtrado);
        return;
      }
    }catch(e){console.log('falha proxy',e)}
  }
  alert('API da EPTC fora do ar ou sem ônibus da 665 no momento (madrugada). Mantendo simulação. Tente entre 6h e 22h.');
  pill.textContent='SIMULAÇÃO';
}

document.getElementById('btn-api').onclick=tentarApiReal;

let deferredPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;});
document.getElementById('btn-install').onclick=async()=>{
  if(deferredPrompt){deferredPrompt.prompt(); let c=await deferredPrompt.userChoice; deferredPrompt=null;}
  else alert('No celular: menu ⋮ > Adicionar à tela inicial / Instalar app');
};
document.getElementById('btn-qrcode').onclick=()=>{
  let box=document.getElementById('qrcode-box');
  let img=document.getElementById('qr-img');
  let url=window.location.href;
  img.src=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  box.style.display=box.style.display==='none'?'block':'none';
};

// registra SW
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js');
}
