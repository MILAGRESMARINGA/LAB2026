import * as THREE from 'three';

/** Original modeled atlas, informed by the user's five Bible map photographs.
 * Coastlines and relief are generalized for gameplay, never archaeological survey data.
 * North is -Z, east +X; degrees are scaled consistently across all meshes and POIs.
 */
export function geographicPoint(lon:number,lat:number,y=.72){return new THREE.Vector3((lon-32)*.84,y,(34-lat));}
const COASTS:readonly (readonly [number,number][])[]=[
 // Europe: Iberia, southern France, Italy, Balkans, Greece and Black Sea coast.
 [[-6,36],[-9,38],[-9,43],[-2,44],[3,43],[7,44],[9,44],[12,46],[17,46],[21,45],[25,45],[29,46],[35,47],[42,46],[42,43],[36,42],[30,41],[28,41],[28,40],[26,40],[25,39],[24,40],[24,38],[23,37],[22,37],[21,39],[20,40],[19,41],[18,40],[17,42],[16,41],[17,39],[16,38],[15,40],[13,42],[12,43],[10,44],[8,43],[6,43],[3,42],[0,40],[-1,38],[-6,36]],
 // Asia Minor, Levant, Mesopotamia and Arabia: no imaginary bridge across the Bosporus.
 [[27,40.5],[29,41],[33,42],[37,41],[40,42],[45,42],[51,40],[56,36],[58,30],[55,25],[51,25],[49,28],[48,30],[45,30],[44,28],[43,25],[42,21],[38,18],[36,23],[35,28],[34.5,29.5],[35.2,31.5],[35.5,34.5],[36,36],[34,36],[32,36],[30,36],[29,37],[27,37],[26,39],[27,40.5]],
 // North Africa and the Nile valley, separated from Arabia by the Red Sea.
 [[-8,35],[-1,35.5],[5,36.5],[10,37.2],[11,34.5],[15,32.5],[20,32],[24,32],[27,31.5],[30,31.5],[32,31],[32.4,29.8],[33,28],[34.2,26],[36,22],[37,18],[32,16],[22,17],[12,18],[1,20],[-8,26],[-8,35]],
 // Sinai peninsula.
 [[32.4,30.1],[34.6,29.5],[34,28],[33.9,27.7],[33.2,28.5],[32.4,30.1]],
 // Mediterranean islands.
 [[23.5,35.6],[26.3,35.3],[26.1,34.9],[24.2,35],[23.5,35.6]],
 [[32.3,35.1],[34.6,35.7],[34,35],[32.5,34.7],[32.3,35.1]],
 [[12.4,38],[15.5,38.2],[15.1,36.7],[13.2,37],[12.4,38]],
 [[8.3,41.2],[9.4,41.2],[9.7,39.2],[8.5,39],[8.3,41.2]],
 [[26.1,37.5],[26.7,37.5],[26.6,37.1],[26.1,37.5]],
];
function material(color:THREE.ColorRepresentation,extra:THREE.MeshStandardMaterialParameters={}){return new THREE.MeshStandardMaterial({color,roughness:.93,flatShading:true,...extra});}
function landPolygon(points:readonly (readonly [number,number])[],color:string,top=.7,depth=.65){
 const shape=new THREE.Shape();points.forEach(([lon,lat],i)=>{const p=geographicPoint(lon,lat);i?shape.lineTo(p.x,-p.z):shape.moveTo(p.x,-p.z)});shape.closePath();
 const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.10,bevelThickness:.08}),[material(color),material('#a47142')]);mesh.userData.terrainSurface=true;mesh.rotation.x=-Math.PI/2;mesh.position.y=top-depth;mesh.receiveShadow=true;mesh.castShadow=true;return mesh;
}
function tube(points:readonly (readonly [number,number])[],radius:number,color:string,y=.78){const curve=new THREE.CatmullRomCurve3(points.map(([lon,lat])=>geographicPoint(lon,lat,y)));return new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*5),radius,5,false),material(color,{roughness:.44}));}
function tree(lon:number,lat:number,palm=false,scale=1){
 const group=new THREE.Group(),bark=material('#8c562e'),leaf=material(palm?'#61a746':'#55a849'),shade=material('#328e55');
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.055,.09,.6,5),bark);trunk.position.y=.3;group.add(trunk);
 if(palm){for(let i=0;i<5;i++){const frond=new THREE.Mesh(new THREE.ConeGeometry(.24,.68,4),i%2?leaf:shade);frond.rotation.z=1.1;frond.rotation.y=i*Math.PI*2/5;frond.position.set(Math.cos(i*1.26)*.22,.72,Math.sin(i*1.26)*.22);group.add(frond)}}else{for(let i=0;i<2;i++){const crown=new THREE.Mesh(new THREE.ConeGeometry(.34-i*.07,.7,5),i?leaf:shade);crown.position.y=.65+i*.27;group.add(crown)}}
 group.position.copy(geographicPoint(lon,lat,.76));group.scale.setScalar(scale);group.traverse(obj=>{if(obj instanceof THREE.Mesh)obj.castShadow=true});return group;
}
function mountain(lon:number,lat:number,height=1.8,width=.9){const group=new THREE.Group(),rock=material('#8a9c91'),shade=material('#6b837b');const cone=new THREE.Mesh(new THREE.ConeGeometry(width,height,5),[rock,shade]);cone.position.y=height/2;cone.castShadow=true;cone.receiveShadow=true;group.add(cone);if(height>1.5){const snow=new THREE.Mesh(new THREE.ConeGeometry(width*.29,height*.3,5),material('#e7f1df'));snow.position.y=height*.86;group.add(snow)}group.position.copy(geographicPoint(lon,lat,.74));return group;}
function pyramid(lon:number,lat:number,scale:number){const mesh=new THREE.Mesh(new THREE.ConeGeometry(.63,1.1,4),material('#efd08b'));mesh.rotation.y=Math.PI/4;mesh.position.copy(geographicPoint(lon,lat,1.23));mesh.scale.setScalar(scale);mesh.castShadow=true;return mesh;}
function city(lon:number,lat:number,kind:'city'|'temple'='city'){
 const group=new THREE.Group(),stone=material('#fff0c5'),roof=material('#c18355');
 const count=kind==='temple'?1:4;for(let i=0;i<count;i++){const h=.20+(i%3)*.1,house=new THREE.Mesh(new THREE.BoxGeometry(.22,h,.24),stone);house.position.set((i%2)*.29-.15,h/2,Math.floor(i/2)*.28-.15);house.castShadow=true;group.add(house);const cap=new THREE.Mesh(new THREE.ConeGeometry(.19,.17,4),roof);cap.rotation.y=Math.PI/4;cap.position.copy(house.position);cap.position.y=h+.08;group.add(cap)}
 if(kind==='temple'){const slab=new THREE.Mesh(new THREE.BoxGeometry(.8,.12,.5),stone);slab.position.y=.52;group.add(slab);for(let i=0;i<4;i++){const column=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,.43,6),stone);column.position.set(-.3+i*.2,.27,.18);group.add(column)}const pediment=new THREE.Mesh(new THREE.ConeGeometry(.5,.25,3),roof);pediment.rotation.z=Math.PI/2;pediment.rotation.y=Math.PI/2;pediment.position.y=.69;group.add(pediment)}group.position.copy(geographicPoint(lon,lat,.76));return group;
}
function regionLabel(text:string,lon:number,lat:number,scale=1){
 if(typeof window.CanvasRenderingContext2D==='undefined')return null;const canvas=document.createElement('canvas');canvas.width=512;canvas.height=112;const ctx=canvas.getContext('2d');if(!ctx)return null;
 ctx.fillStyle='rgba(20,56,64,.86)';ctx.beginPath();ctx.roundRect(8,8,496,96,24);ctx.fill();ctx.font='bold 43px system-ui, sans-serif';ctx.fillStyle='#fff7dc';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,57,470);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));sprite.position.copy(geographicPoint(lon,lat,1.05));sprite.scale.set(2.6*scale,.57*scale,1);sprite.renderOrder=3;sprite.userData.atlasLabel=text;return sprite;
}
export function makeAncientWorld(){
 const world=new THREE.Group();world.name='Mundo Antigo — terreno 3D original';
 const water=new THREE.Mesh(new THREE.BoxGeometry(66,.38,41),material('#249fb3',{metalness:.08,roughness:.5}));water.userData.waterSurface=true;water.position.set(-2,-.45,0);water.receiveShadow=true;world.add(water);
 const underside=new THREE.Mesh(new THREE.BoxGeometry(66,.24,41),material('#177b95'));underside.userData.waterSurface=true;underside.position.set(-2,-.75,0);world.add(underside);
 COASTS.forEach((coast,i)=>world.add(landPolygon(coast,i===2?'#e3bd77':i===1?'#a9c96c':'#87ba67')));
 // Climate zones follow broad geography, with no modern political boundaries.
 world.add(landPolygon([[36,28],[38,26],[42,23],[45,27],[48,30],[45,33],[41,32],[37,31],[36,28]],'#dfb778',.79,.025));
 world.add(landPolygon([[5,27],[15,29],[26,29],[30,25],[31,20],[15,20],[5,24],[5,27]],'#e7c786',.79,.025));
 // Nile, delta, Jordan, Tigris and Euphrates are separate modeled river meshes.
 world.add(tube([[31,20],[31.4,23],[32.8,25],[31.2,27],[31.1,29],[31,30],[30.3,31.2]],.09,'#54e3df'));
 world.add(tube([[31,30],[31.8,31.3]],.055,'#54e3df'));
 world.add(tube([[39,39],[40,37],[41.2,35],[43,33],[45,31],[47.2,30]],.075,'#61e4dd'));
 world.add(tube([[41,38],[42.5,37],[43.4,35],[44.6,33],[46,31],[47.2,30]],.065,'#61e4dd'));
 world.add(tube([[35.6,33.2],[35.6,32.8],[35.55,32.3],[35.5,31.7]],.045,'#62dbe0'));
 const deadSea=new THREE.Mesh(new THREE.SphereGeometry(.23,12,7),material('#42cad4'));deadSea.scale.set(1,.08,2.2);deadSea.position.copy(geographicPoint(35.5,31.4,.81));world.add(deadSea);
 const galilee=new THREE.Mesh(new THREE.SphereGeometry(.13,10,6),material('#42cad4'));galilee.scale.set(1,.10,1.55);galilee.position.copy(geographicPoint(35.58,32.8,.81));world.add(galilee);
 // Taurus, Lebanon/Hermon, Sinai, Zagros, Judean highlands, Greece and Italy.
 const ridges:readonly [number,number,number,number][]=[[28.4,38.6,1.7,.6],[30.1,37.6,1.9,.7],[32.2,37.5,2.2,.8],[34.4,38,2.1,.8],[36.4,38.2,2.3,.8],[39,39.3,2.6,1],[35.9,33.5,1.9,.45],[35.4,32,1,.27],[35.15,31.3,.85,.26],[33.9,28.5,1.5,.45],[34,29,1.2,.36],[45.8,35.3,2.1,.7],[47,34,2,.7],[48.3,32.4,1.6,.65],[22.3,40.2,2,.6],[23,38.6,1.5,.5],[14.2,41.9,1.8,.5],[10.2,44.6,2.2,.8]];
 ridges.forEach(([lon,lat,h,w])=>world.add(mountain(lon,lat,h,w)));
 // Deterministic vegetation, always tied to land corridors.
 const forests:readonly [number,number][]=[[12,43],[13,42.7],[21,40.9],[22.6,39.8],[24,38.4],[28,38],[29.6,39],[30.4,39.2],[34.4,36.5],[35.1,34],[36,33.6],[35.1,32.3],[35.2,31.7],[35,31.3],[38,37],[39.5,36.8]];
 forests.forEach(([lon,lat],i)=>{world.add(tree(lon,lat,false,.7+(i%3)*.12));world.add(tree(lon+.35,lat-.2,false,.65))});
 [[31.1,27],[31,28],[31.1,29],[30.6,30.7],[31.8,30.6],[43,33.2],[44,32.4],[45.4,31.5]].forEach(([lon,lat])=>world.add(tree(lon,lat,true,.9)));
 world.add(pyramid(31.15,29.98,1),pyramid(30.85,29.9,.7));
 [[35.23,31.78],[35.2,31.7],[35.2,32.2],[35.6,32.8],[44.42,32.54],[43.15,36.36],[48.25,32.2]].forEach(([lon,lat])=>world.add(city(lon,lat)));
 world.add(city(12.5,41.9,'temple'),city(23.7,37.98,'temple'),city(27.34,37.94,'temple'));
 const labels:readonly [string,number,number][]=[['ROMA',12.5,42.5],['GRÉCIA',23,36.5],['ÁSIA MENOR',31,40.5],['EGITO',29,27.8],['SINAI',34.3,27],['JERUSALÉM',35.2,30.8],['MESOPOTÂMIA',44,34.5],['NILO',29,25.4]];labels.forEach(([text,lon,lat])=>{const label=regionLabel(text,lon,lat);if(label)world.add(label)});
 // Small modeled wave crests; no texture downloads or animated water shader.
 const crestMaterial=new THREE.MeshBasicMaterial({color:'#9be4e5',transparent:true,opacity:.42});const crestGeometry=new THREE.TorusGeometry(.35,.016,3,12,Math.PI*.7);
 for(let i=0;i<36;i++){const wave=new THREE.Mesh(crestGeometry,crestMaterial);wave.rotation.x=-Math.PI/2;wave.position.set(-24+(i%9)*4.7,-.23,-8+Math.floor(i/9)*4.1);world.add(wave)}
 return world;
}
export function disposeObject(root:THREE.Object3D){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();root.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.geometry)geometries.add(mesh.geometry);if(mesh.material)(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>{materials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value)})});textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
