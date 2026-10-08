// Registra o uso das calculadoras na planilha (mesmo Apps Script do Meu Mapa).
// Envia uma linha por visita, com os valores finais, quando a pessoa sai da página
// — e só se ela tiver mexido em algum campo.
const REGISTRO_ENDPOINT='https://script.google.com/macros/s/AKfycbxKbxCBeGMicT_NdUFqCp3vZQm0O7MxLUD64eI0hldwqhE2daE3ghUIZJ58xQ7TS-T_sw/exec';

function registrarUso(calculadora, coletar){
  let usou=false, enviado=false;
  document.addEventListener('input',()=>{usou=true});
  document.addEventListener('click',e=>{if(e.target.closest('button'))usou=true});

  function enviar(){
    if(!usou||enviado)return;
    enviado=true;
    let nome='',email='';
    try{const d=JSON.parse(localStorage.getItem('clinicaDiag')||'{}');nome=d.nome||'';email=d.email||''}catch(e){}
    const {entradas,resultado}=coletar();
    const body=JSON.stringify({tipo:'calculadora',calculadora,nome,email,entradas,resultado});
    try{
      if(navigator.sendBeacon&&navigator.sendBeacon(REGISTRO_ENDPOINT,new Blob([body],{type:'text/plain;charset=UTF-8'})))return;
      fetch(REGISTRO_ENDPOINT,{method:'POST',mode:'no-cors',keepalive:true,headers:{'Content-Type':'text/plain;charset=UTF-8'},body});
    }catch(e){}
  }
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')enviar()});
  window.addEventListener('pagehide',enviar);
}

// Monta "Rótulo: valor | Rótulo: valor" a partir de ids de campos.
function lerCampos(campos){
  return Object.entries(campos).map(([id,rotulo])=>{
    const el=document.getElementById(id);
    return rotulo+': '+(el?el.value:'');
  }).join(' | ');
}
function lerTexto(id){const el=document.getElementById(id);return el?(el.value!==undefined&&el.tagName==='INPUT'?el.value:el.textContent.trim()):''}
