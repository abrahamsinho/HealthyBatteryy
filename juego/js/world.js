import * as THREE from 'three';

export function createWorld(scene) {
  const mat = (color, roughness=0.75, metalness=0) => new THREE.MeshStandardMaterial({color, roughness, metalness});
  const floorMat = mat(0x18332c);
  const wallMat = mat(0x29453c);
  const darkMat = mat(0x10241f);
  const mintMat = new THREE.MeshStandardMaterial({color:0x63e6ad, emissive:0x123f2e, roughness:.35});
  const objects = [];

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 32), floorMat);
  floor.rotation.x = -Math.PI/2; floor.position.y = 0; floor.receiveShadow = true; scene.add(floor);

  const grid = new THREE.GridHelper(42, 42, 0x477967, 0x294a3d);
  grid.position.y = .012; grid.material.transparent = true; grid.material.opacity = .22; scene.add(grid);

  function box(w,h,d,x,y,z,material, cast=true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
    m.position.set(x,y,z); m.castShadow=cast; m.receiveShadow=true; scene.add(m); return m;
  }
  // Paredes y señalización del centro
  box(42,5,.45,0,2.5,-16,wallMat); box(.45,5,32,-21,2.5,0,wallMat); box(.45,5,32,21,2.5,0,wallMat);
  box(8,2,.16,0,4.05,-15.72,darkMat);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(7.7,1.7,.08), mintMat); sign.position.set(0,4.05,-15.58); scene.add(sign);
  // Letras 3D simuladas con pequeños paneles luminosos
  for(let i=0;i<5;i++) box(.55,.12,.06,-2.4+i*1.2,4.05,-15.48,mat(0x06291d),false);

  // Estaciones de clasificación
  const stationXs=[-12,0,12];
  const stationColors=[0x3a9d71,0xd79b42,0x578bc4];
  const stationNames=['REUTILIZABLE','DAÑADA / RIESGO','RECOLECCIÓN'];
  stationXs.forEach((x,i)=>{
    box(5.2,.35,4.2,x,.45,-8,mat(0x233e34));
    box(5.0,.16,4.0,x,.7,-8,mat(stationColors[i]));
    box(4.7,.12,3.7,x,.84,-8,mat(0x152b24));
    // pilares de luz
    for(const dx of [-2.3,2.3]) box(.09,2.2,.09,x+dx,1.9,-10.0,mat(stationColors[i]));
  });

  // Estanterías laterales
  for(let z=-2;z<12;z+=4){
    box(4,.18,.8,-17,1.1,z,mat(0x52675d)); box(4,.18,.8,-17,2.3,z,mat(0x52675d));
    box(.15,2.8,.9,-19,1.4,z,mat(0x40564c)); box(.15,2.8,.9,-15,1.4,z,mat(0x40564c));
  }
  // Plantas decorativas
  for(const [x,z] of [[-19,-13],[19,-13],[-19,14],[19,14]]){
    const pot=new THREE.Mesh(new THREE.CylinderGeometry(.45,.55,.65,8),mat(0x8c6949));pot.position.set(x,.33,z);scene.add(pot);
    const leaves=new THREE.Mesh(new THREE.SphereGeometry(.75,8,7),mat(0x3f9c68));leaves.position.set(x,1.25,z);leaves.scale.y=1.3;scene.add(leaves);
  }

  function battery(name, description, condition, color, position, type) {
    const group = new THREE.Group(); group.position.set(...position); scene.add(group);
    const body = new THREE.Mesh(new THREE.BoxGeometry(.95,1.55,.58),mat(color,.38,.25));
    body.position.y=.9; body.castShadow=true; group.add(body);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(.65,.12,.48),mat(0x263a34,.3,.5));cap.position.y=1.74;group.add(cap);
    const terminal = new THREE.Mesh(new THREE.BoxGeometry(.2,.12,.18),mat(0xd6dfd8,.25,.7));terminal.position.set(.18,1.85,0);group.add(terminal);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(.12,.95,.6),mat(0xe4f5e9,.4));stripe.position.set(-.28,.92,0);group.add(stripe);
    const label = new THREE.Mesh(new THREE.BoxGeometry(.48,.28,.025),mat(type==='damaged'?0x8f3333:0x174a39));label.position.set(.08,1.15,.305);group.add(label);
    if(type==='damaged'){
      body.rotation.z=-.08; body.scale.set(1.1,1.03,1.05);
      const warning = new THREE.PointLight(0xff503b,1.6,4);warning.position.y=2.2;group.add(warning);
    }
    if(type==='used'){
      body.material=mat(0x758b80,.75); stripe.material=mat(0xd6dfd8);
    }
    group.userData={name,description,condition,type};
    objects.push(group);
    return group;
  }
  battery('Batería en buen estado','Batería de un dispositivo que no presenta deformaciones, fugas, olor extraño ni calentamiento anormal. Aún puede utilizarse siguiendo las instrucciones del fabricante.','ESTADO: NORMAL',0x238c68,[-12,0,-2],'good');
  battery('Batería hinchada','La carcasa está deformada. La hinchazón puede indicar daño interno y riesgo de incendio. No la cargues, perfores ni intentes abrirla.','ALERTA: DAÑO FÍSICO',0xb64a46,[0,0,-2],'damaged');
  battery('Batería usada al final de su vida útil','Ya no se necesita o ha llegado al final de su vida útil. Debe llevarse a un programa o punto de recolección especializado, nunca a la basura común.','ESTADO: RESIDUO',0x7c9186,[12,0,-2],'used');

  // Cargador certificado y contenedor de recolección (decoración interactiva)
  const charger=box(1.2,1.1,.8,-8,.65,5,mat(0x356c9c)); charger.userData={name:'Cargador del fabricante',description:'Utiliza el cargador recomendado por el fabricante y sigue las instrucciones de carga. Evita cargadores incompatibles o dañados.',condition:'BUENA PRÁCTICA',type:'info'};objects.push(charger);
  const bin=box(2.0,1.8,1.5,12, .9,-8,mat(0x267a61));bin.userData={name:'Punto de recolección especializado',description:'Las baterías de litio deben entregarse en puntos de recolección o gestores autorizados. No deben ir a la basura ni al contenedor convencional.',condition:'DESTINO CORRECTO',type:'info'};objects.push(bin);

  // Luminarias y luces
  for(let x=-14;x<=14;x+=7){
    const lamp= new THREE.PointLight(0x9af5cb,35,18);lamp.position.set(x,4,-3);scene.add(lamp);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),new THREE.MeshBasicMaterial({color:0xb9ffdb}));bulb.position.set(x,4,-3);scene.add(bulb);
  }
  scene.background=new THREE.Color(0x0a1917);
  scene.fog=new THREE.Fog(0x0a1917,22,43);
  return objects;
}
