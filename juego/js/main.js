import * as THREE from 'three';
import { createWorld } from './world.js';

const canvas=document.querySelector('#scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0a1917);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,100);
camera.position.set(0,1.7,12);
const hemi=new THREE.HemisphereLight(0xb9f5d7,0x17251e,2.1);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xd5ffe8,2.2);sun.position.set(-8,15,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);
const interactables=createWorld(scene);

const ui={
 start:document.querySelector('#startScreen'),help:document.querySelector('#helpScreen'),result:document.querySelector('#resultScreen'),
 panel:document.querySelector('#objectPanel'),title:document.querySelector('#objectName'),desc:document.querySelector('#objectDescription'),
 tag:document.querySelector('#objectTag'),condition:document.querySelector('#objectCondition'),choices:document.querySelector('#choices'),
 feedback:document.querySelector('#feedback'),toast:document.querySelector('#toast')
};
let started=false,locked=false,selected=null,score=0,correct=0,safety=100,decided=new Set(),primaryDecisions=new Set(),yaw=0,pitch=0;
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
const keys={};
const player={x:0,z:12,speed:7};
const scenarios={
 good:{correct:'use',options:[['use','Continuar utilizándola siguiendo las instrucciones'],['trash','Tirarla a la basura común'],['damage','Abrirla para revisar su interior']],explain:'¡Correcto! Si la batería está en buen estado, úsala y cárgala según las indicaciones del fabricante. No la modifiques.'},
 damaged:{correct:'stop',options:[['stop','Dejar de usarla, no manipularla y alejarse'],['charge','Conectarla para comprobar si funciona'],['open','Perforarla para liberar la presión']],explain:'¡Correcto! Una batería hinchada puede estar dañada. Suspende su uso, no la cargues ni la abras. Mantén distancia y consulta al fabricante o a un gestor especializado. Si hay humo o fuego, evacúa y llama a emergencias.'},
 used:{correct:'recycle',options:[['recycle','Llevarla a un punto de recolección especializado'],['trash','Depositarla en la basura común'],['bin','Ponerla en el contenedor convencional de reciclaje']],explain:'¡Correcto! Las baterías de litio requieren canales de recolección especializados. No deben ir a la basura ni al reciclaje municipal convencional.'},
 info:{correct:'learn',options:[['learn','Aplicar esta recomendación'],['ignore','Ignorar la recomendación']],explain:'¡Muy bien! Las buenas prácticas reducen el riesgo de daños, sobrecalentamiento e incidentes.'}
};
function showToast(msg){ui.toast.textContent=msg;ui.toast.classList.add('show');setTimeout(()=>ui.toast.classList.remove('show'),2200)}
function updateHUD(){document.querySelector('#recycleScore').textContent=score;document.querySelector('#safetyScore').textContent=safety+'%';document.querySelector('#progressBar').style.width=(correct/3*100)+'%';document.querySelector('#progressText').textContent=correct+' de 3 decisiones correctas';}
function openObject(obj){
 selected=obj;const d=obj.userData;ui.title.textContent=d.name;ui.desc.textContent=d.description;ui.condition.textContent=d.condition;ui.tag.textContent=d.type==='damaged'?'⚠ OBJETO CON RIESGO':'OBJETO DETECTADO';
 ui.feedback.classList.add('hidden');ui.choices.innerHTML='';
 const scenario=scenarios[d.type]||scenarios.info;
 scenario.options.forEach(([value,label])=>{const b=document.createElement('button');b.className='choice-btn';b.textContent=label;b.onclick=()=>choose(value,scenario,d.type,obj);ui.choices.appendChild(b)});
 ui.panel.classList.remove('hidden');
}
function choose(value,scenario,type,obj){
 if(decided.has(obj.uuid)){showToast('Ya tomaste una decisión sobre este objeto.');return}
 const good=value===scenario.correct;
 const fb=ui.feedback;fb.textContent=(good?'✓ DECISIÓN CORRECTA. ':'✕ DECISIÓN INCORRECTA. ')+scenario.explain;fb.classList.remove('hidden','bad');if(!good)fb.classList.add('bad');
 if(good){score+=100;correct=Math.min(3,correct+1)}else{safety=Math.max(0,safety-20)}
 decided.add(obj.uuid);if(type!=='info')primaryDecisions.add(obj.uuid);updateHUD();
 [...ui.choices.children].forEach(b=>b.disabled=true);
 if(primaryDecisions.size>=3)setTimeout(finish,2200);
}
function finish(){
 ui.panel.classList.add('hidden');
 document.querySelector('#finalScore').textContent=score;
 document.querySelector('#finalCorrect').textContent=correct+'/3';
 document.querySelector('#finalSafety').textContent=safety+'%';
 document.querySelector('#resultTitle').textContent=safety>=80?'¡Excelente trabajo, operador!':'Simulación finalizada';
 document.querySelector('#resultMessage').textContent=safety>=80?'Has demostrado buenas decisiones para proteger a las personas y al medioambiente.':'Has completado la práctica. Repasa las recomendaciones y vuelve a intentarlo para mejorar tu índice de seguridad.';
 ui.result.classList.remove('hidden');
 const best=Math.max(score,Number(localStorage.getItem('lg3d-best')||0));localStorage.setItem('lg3d-best',best);
}
function start(){started=true;ui.start.classList.add('hidden');showToast('Explora el centro y selecciona las baterías para inspeccionarlas.');}
document.querySelector('#startBtn').addEventListener('click',start);
document.querySelector('#helpBtn').addEventListener('click',()=>ui.help.classList.remove('hidden'));
document.querySelector('#helpClose').addEventListener('click',()=>ui.help.classList.add('hidden'));
document.querySelector('#closePanel').addEventListener('click',()=>ui.panel.classList.add('hidden'));
document.querySelector('#restartBtn').addEventListener('click',()=>location.reload());
document.querySelector('#soundBtn').addEventListener('click',()=>showToast('La experiencia funciona en modo silencioso.'));
document.querySelector('#helpBtn').addEventListener('click',()=>{locked=false});

window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==='e'&&selected)openObject(selected)});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
canvas.addEventListener('click',e=>{
 if(!started||!ui.panel.classList.contains('hidden'))return;
 const r=canvas.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;
 raycaster.setFromCamera(mouse,camera);
 const hits=raycaster.intersectObjects(interactables,true);
 if(hits.length){let o=hits[0].object;while(o&&!o.userData.name)o=o.parent;if(o?.userData.name)openObject(o);else showToast('Acércate y selecciona una batería.')}
});
let dragging=false,lastX=0,lastY=0;
canvas.addEventListener('mousedown',e=>{if(e.button===2){dragging=true;lastX=e.clientX;lastY=e.clientY}});
window.addEventListener('mouseup',()=>dragging=false);
window.addEventListener('mousemove',e=>{if(dragging&&started){yaw-=(e.clientX-lastX)*.004;pitch=Math.max(-.35,Math.min(.35,pitch+(e.clientY-lastY)*.002));lastX=e.clientX;lastY=e.clientY}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());

const clock=new THREE.Clock();
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);
 if(started){
  const forward=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0);
  const side=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
  const len=Math.hypot(forward,side)||1;
  player.x+=((side*Math.cos(yaw)+forward*Math.sin(yaw))/len)*player.speed*dt;
  player.z+=((side*Math.sin(yaw)-forward*Math.cos(yaw))/len)*player.speed*dt;
  player.x=THREE.MathUtils.clamp(player.x,-19,19);player.z=THREE.MathUtils.clamp(player.z,-13,14);
 }
 camera.position.set(player.x,1.7,player.z);
 camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;
 renderer.render(scene,camera);
}
animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
updateHUD();
