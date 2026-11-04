import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {SVGObject,SVGRenderer} from 'three/examples/jsm/renderers/SVGRenderer.js';
import {disposeObject,geographicPoint,makeAncientWorld} from './journey3d/terrain';

export type JourneySceneNode={day:number;lon:number;lat:number;color:string;status:'current'|'completed'|'locked';name?:string};
export type ProjectedJourneyNode={day:number;x:number;y:number};
export type ProjectedJourneyLabel={id:string;label:string;x:number;y:number};
export type JourneyViewMode='world'|'region'|'episode';
export type JourneyScene3DProps={
 nodes:readonly JourneySceneNode[];
 focus:{lon:number;lat:number};
 focusLabel?:string;
 viewMode?:JourneyViewMode;
 zoom?:number;
 resetViewKey?:number;
 onZoomChange?:(zoom:number)=>void;
 onLabelsProject?:(labels:ReadonlyArray<ProjectedJourneyLabel>)=>void;
 onSelect:(day:number)=>void;
 onTransition?:(moving:boolean)=>void;
 reducedMotion?:boolean;
 onUnavailable?:()=>void;
 onRenderMode?:(mode:'webgl'|'software')=>void;
 onProject?:(points:ReadonlyArray<ProjectedJourneyNode>)=>void;
};
type Flag={node:JourneySceneNode;group:THREE.Group;anchor:THREE.Vector3;label:THREE.Vector3;hit:THREE.Object3D};
type SceneController={update:(props:JourneyScene3DProps)=>void;dispose:()=>void};
const clampZoom=(zoom:number)=>THREE.MathUtils.clamp(Number.isFinite(zoom)?zoom:1,.75,3);
const UP=new THREE.Vector3(0,1,0),GROUND=new THREE.Plane(UP,-.82);
function mesh(geometry:THREE.BufferGeometry,color:string,roughness=.8){const result=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness,flatShading:true}));result.castShadow=true;result.receiveShadow=true;return result;}
function modeledFlag(node:JourneySceneNode,position:THREE.Vector3):Flag{
 const group=new THREE.Group();group.position.copy(position);group.userData.day=node.day;
 const base=mesh(new THREE.CylinderGeometry(.48,.6,.18,8),node.status==='current'?'#fff2ac':'#d5dca4');base.position.y=.08;group.add(base);
 const baseRim=mesh(new THREE.CylinderGeometry(.6,.65,.12,8),'#807d45');baseRim.position.y=-.04;group.add(baseRim);
 const pole=mesh(new THREE.CylinderGeometry(.038,.055,1.65,6),'#e9bb50',.4);pole.position.set(-.36,.89,0);group.add(pole);
 const finial=mesh(new THREE.SphereGeometry(.085,6,4),'#ffdf6b',.35);finial.position.set(-.36,1.78,0);group.add(finial);
 const bar=mesh(new THREE.CylinderGeometry(.037,.037,.94,6),'#f5c458',.4);bar.rotation.z=Math.PI/2;bar.position.set(.03,1.65,0);group.add(bar);
 // The cloth is an extruded swallowtail mesh; both faces have the literary color.
 const cloth=new THREE.Shape();cloth.moveTo(-.31,1.59);cloth.lineTo(.42,1.59);cloth.lineTo(.42,.65);cloth.lineTo(.06,.84);cloth.lineTo(-.31,.65);cloth.closePath();
 const clothGeometry=new THREE.ExtrudeGeometry(cloth,{depth:.045,bevelEnabled:false});const banner=new THREE.Mesh(clothGeometry,new THREE.MeshStandardMaterial({color:node.color,roughness:.68,side:THREE.DoubleSide}));banner.castShadow=true;banner.position.z=.02;group.add(banner);
 const crest=mesh(new THREE.BoxGeometry(.46,.44,.04),'#173546');crest.position.set(.05,1.27,.085);group.add(crest);
 if(node.status==='current'){const ring=new THREE.Mesh(new THREE.TorusGeometry(.75,.045,5,40),new THREE.MeshBasicMaterial({color:'#fff4a3'}));ring.rotation.x=-Math.PI/2;ring.position.y=.08;group.add(ring);const ray=mesh(new THREE.ConeGeometry(.13,.25,4),'#fff1a1');ray.position.set(.05,2.03,0);ray.rotation.z=Math.PI;group.add(ray)}
 // The front of every banner faces the isometric camera (same yaw as camera offset).
 group.rotation.y=Math.PI*.23;
 return {node,group,anchor:geographicPoint(node.lon,node.lat,.85),label:position.clone().add(new THREE.Vector3(0,1.25,0)),hit:base};
}
function projected(point:THREE.Vector3,camera:THREE.Camera,width:number,height:number){const p=point.clone().project(camera);return {x:(p.x+1)*width/2,y:(1-p.y)*height/2};}
/** Rendered with actual WebGL meshes. Accessible flag controls are supplied by the parent. */
export function JourneyScene3D(props:JourneyScene3DProps){
 const host=useRef<HTMLDivElement>(null),controller=useRef<SceneController|null>(null),latest=useRef(props);latest.current=props;
 useEffect(()=>{
  const element=host.current;if(!element)return;
  type Renderer={domElement:HTMLCanvasElement|SVGElement;setSize:(width:number,height:number,updateStyle?:boolean)=>void;render:(scene:THREE.Scene,camera:THREE.Camera)=>void;dispose:()=>void};
  let renderer:Renderer,webgl:THREE.WebGLRenderer|null=null,software=false;
  const makeSoftware=():Renderer=>{const svg=new SVGRenderer();svg.setQuality('low');svg.setPrecision(2);svg.setClearColor(new THREE.Color('#163c4e'),1);svg.overdraw=.3;return {domElement:svg.domElement,setSize:(w,h)=>svg.setSize(w,h),render:(scene,camera)=>svg.render(scene,camera),dispose:()=>{svg.clear()}}};
  if(typeof window.WebGL2RenderingContext!=='undefined')try{
   webgl=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
   if(!webgl.capabilities.isWebGL2){webgl.dispose();webgl=null}
  }catch{webgl=null}
  try{if(webgl){renderer=webgl;webgl.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));webgl.setClearColor('#163c4e');webgl.outputColorSpace=THREE.SRGBColorSpace;webgl.toneMapping=THREE.ACESFilmicToneMapping;webgl.toneMappingExposure=1.27;webgl.shadowMap.enabled=true;webgl.shadowMap.type=THREE.PCFSoftShadowMap}else{software=true;renderer=makeSoftware()}}catch{latest.current.onUnavailable?.();return}
  const mountRenderer=()=>{renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.setAttribute('data-renderer',software?'three-software-3d':'three-webgl2');renderer.domElement.style.cssText='display:block;width:100%;height:100%;touch-action:none';element.append(renderer.domElement);latest.current.onRenderMode?.(software?'software':'webgl')};mountRenderer();
  const scene=new THREE.Scene();scene.background=new THREE.Color('#163c4e');scene.fog=new THREE.Fog('#163c4e',70,150);
  const camera=new THREE.OrthographicCamera(-8,8,8,-8,.1,180);
  const light=new THREE.DirectionalLight('#fff0cc',3.3);light.position.set(-16,34,18);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-36;light.shadow.camera.right=36;light.shadow.camera.top=28;light.shadow.camera.bottom=-28;light.shadow.camera.near=1;light.shadow.camera.far=90;light.shadow.normalBias=.04;light.shadow.bias=-.00015;scene.add(light,new THREE.HemisphereLight('#d9fbff','#92834f',2.4));
  const world=makeAncientWorld();scene.add(world);
  const compatibleLabels=()=>{const replacements:THREE.Object3D[]=[];world.traverse(object=>{if(object.userData.waterSurface)object.renderOrder=-200;else if(object.userData.terrainSurface)object.renderOrder=-100;if(object instanceof THREE.Sprite){object.visible=false;if(object.userData.atlasLabel&&!latest.current.onLabelsProject){const ns='http://www.w3.org/2000/svg',group=document.createElementNS(ns,'g'),rect=document.createElementNS(ns,'rect'),text=document.createElementNS(ns,'text');rect.setAttribute('x','-51');rect.setAttribute('y','-10');rect.setAttribute('width','102');rect.setAttribute('height','20');rect.setAttribute('rx','6');rect.setAttribute('fill','#173c47');rect.setAttribute('fill-opacity','.85');text.setAttribute('text-anchor','middle');text.setAttribute('y','4');text.setAttribute('fill','#fff4ce');text.setAttribute('font-family','system-ui,sans-serif');text.setAttribute('font-size','9');text.setAttribute('font-weight','800');text.textContent=object.userData.atlasLabel;group.append(rect,text);const label=new SVGObject(group);label.position.copy(object.position);replacements.push(label)}}});replacements.forEach(label=>world.add(label))};
  if(latest.current.onLabelsProject)world.traverse(object=>{if(object instanceof THREE.Sprite&&object.userData.atlasLabel)object.visible=false});
  if(software){compatibleLabels();light.intensity=.65;scene.add(new THREE.AmbientLight('#fff7df',.34));const hemisphere=scene.children.find(object=>object instanceof THREE.HemisphereLight) as THREE.HemisphereLight|undefined;if(hemisphere)hemisphere.intensity=.8}
  let route=new THREE.Group();scene.add(route);
  let flags:Flag[]=[],width=1,height=1,raf=0,disposed=false,moving=false,initialized=false,activeNodes=latest.current.nodes,activeFocus=latest.current.focus,reduced=Boolean(latest.current.reducedMotion)||software;
  let viewMode=latest.current.viewMode??'episode',activeZoom=clampZoom(latest.current.zoom??1);
  const pan=new THREE.Vector3();
  let fromTarget=new THREE.Vector3(),toTarget=new THREE.Vector3(),currentTarget=new THREE.Vector3(),fromSpan=12,toSpan=12,currentSpan=12,startedAt=0;
  const cameraOffset=new THREE.Vector3(24,35,28),raycaster=new THREE.Raycaster();
  const applyCamera=(target:THREE.Vector3,span:number)=>{const aspect=width/height;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.position.copy(target).add(cameraOffset);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld()};
  const publish=()=>{
   latest.current.onProject?.(viewMode==='episode'?flags.map(flag=>({day:flag.node.day,...projected(flag.label,camera,width,height)})).filter(p=>p.x>24&&p.x<width-24&&p.y>36&&p.y<height-36):[]);
   const places=viewMode==='world'?[['africa','África',18,22],['europe','Europa',16,46],['asia','Ásia',49,44],['sea','Mar Mediterrâneo',24,35],['egypt','Egito',30,27],['mesopotamia','Mesopotâmia',44,33],['canaan','Canaã',35,31]] as const:[['focus',latest.current.focusLabel??'Região da leitura',activeFocus.lon,activeFocus.lat]] as const;
   const labels:ProjectedJourneyLabel[]=[];
   places.forEach(([id,label,lon,lat])=>{const p=projected(geographicPoint(lon,lat,1.1),camera,width,height);if(p.x<35||p.x>width-35||p.y<28||p.y>height-28)return;if(labels.some(other=>Math.abs(other.x-p.x)<105&&Math.abs(other.y-p.y)<30))return;labels.push({id,label,...p})});latest.current.onLabelsProject?.(labels);
  };
  const setMoving=(next:boolean)=>{if(moving!==next){moving=next;latest.current.onTransition?.(next)}};
  const render=()=>{if(disposed)return;renderer.render(scene,camera);publish()};
  const animate=(now:number)=>{if(disposed)return;const t=reduced?1:Math.min(1,(now-startedAt)/850),ease=t*t*(3-2*t);currentTarget.lerpVectors(fromTarget,toTarget,ease);currentSpan=THREE.MathUtils.lerp(fromSpan,toSpan,ease);applyCamera(currentTarget,currentSpan);render();if(t<1)raf=requestAnimationFrame(animate);else{raf=0;setMoving(false)}};
  const screenGround=(x:number,y:number)=>{raycaster.setFromCamera(new THREE.Vector2(x/width*2-1,1-y/height*2),camera);const point=new THREE.Vector3();return raycaster.ray.intersectPlane(GROUND,point)??geographicPoint(activeFocus.lon,activeFocus.lat,.82)};
  const rebuild=()=>{
   scene.remove(route);disposeObject(route);route=new THREE.Group();scene.add(route);flags=[];
   const focusPoint=geographicPoint(activeFocus.lon,activeFocus.lat,.85);
   // A week can cross countries: only nearby reading pins influence the local camera.
   const localNodes=activeNodes.filter(node=>geographicPoint(node.lon,node.lat,.85).distanceTo(focusPoint)<8);
   const anchors=localNodes.map(node=>geographicPoint(node.lon,node.lat,.85));
   toTarget.copy(focusPoint);toTarget.y=.6;
   let fitPoints=[focusPoint,...anchors];
   if(viewMode==='world'){
    const bounds=new THREE.Box3().setFromObject(world);toTarget.copy(bounds.getCenter(new THREE.Vector3()));toTarget.y=.6;
    fitPoints=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])fitPoints.push(new THREE.Vector3(x,y,z));
   }
   const orientationCamera=camera.clone();orientationCamera.position.copy(toTarget).add(cameraOffset);orientationCamera.lookAt(toTarget);orientationCamera.updateMatrixWorld();
   const extent=new THREE.Box3().setFromPoints(fitPoints.map(p=>p.clone().applyMatrix4(orientationCamera.matrixWorldInverse))).getSize(new THREE.Vector3());
   const baseSpan=viewMode==='region'?Math.max(18,13/(width/height)):viewMode==='world'?Math.max(extent.y+5,(extent.x+5)/(width/height)):Math.max(12,extent.y+6,(extent.x+6)/(width/height));
   toTarget.add(pan);toSpan=baseSpan/activeZoom;
   applyCamera(toTarget,toSpan);
   // Same-site flags remain nearby, separated in screen space and visibly tethered to the site.
   const minGap=Math.min(104,Math.max(76,height/7.8));
   const slots=(viewMode==='episode'?anchors:[]).map((anchor,index)=>{
    const p=projected(anchor,camera,width,height);
    const siblings=anchors.map((candidate,i)=>candidate.distanceTo(anchor)<.28?i:-1).filter(i=>i>=0),ordinal=siblings.indexOf(index);
    // Repeated chapters in the same city make an ordered serpentine, not a pile of pins.
    const vertical=(ordinal-(siblings.length-1)/2)*minGap*.92;
    const sideways=siblings.length>1?(ordinal%2===0?-1:1)*minGap*.8:0;
    return {x:p.x+sideways,y:p.y-28+vertical,index};
   });
   for(let pass=0;pass<35;pass++){
    for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){const a=slots[i],b=slots[j];let dx=b.x-a.x,dy=b.y-a.y;let length=Math.hypot(dx,dy);if(length<minGap){if(length<.01){const angle=(j*2.399)+(i*.7);dx=Math.cos(angle);dy=Math.sin(angle);length=1}const nudge=(minGap-length)*.52;a.x-=dx/length*nudge;a.y-=dy/length*nudge;b.x+=dx/length*nudge;b.y+=dy/length*nudge}}
    for(const slot of slots){slot.x=THREE.MathUtils.clamp(slot.x,45,width-45);slot.y=THREE.MathUtils.clamp(slot.y,70,height-70)}
   }
   slots.forEach((slot,index)=>{
    // A banner label is 1.25 units above the ground, so compensate before inverse projection.
    const basePoint=screenGround(slot.x,slot.y+Math.max(18,1.25*height/toSpan*.72));
    const flag=modeledFlag(localNodes[index],basePoint);flags.push(flag);route.add(flag.group);
    const anchor=anchors[index];const marker=new THREE.Mesh(new THREE.CylinderGeometry(.10,.14,.045,7),new THREE.MeshBasicMaterial({color:localNodes[index].color}));marker.position.copy(anchor);route.add(marker);
    if(anchor.distanceTo(basePoint)>.45){const tetherCurve=new THREE.LineCurve3(anchor,basePoint);const tether=new THREE.Mesh(new THREE.TubeGeometry(tetherCurve,1,.023,4,false),new THREE.MeshBasicMaterial({color:'#fff3c3',transparent:true,opacity:.55}));route.add(tether)}
   });
   for(let i=1;i<flags.length;i++){
    const a=flags[i-1].group.position,b=flags[i].group.position;const mid=a.clone().lerp(b,.5);mid.y=1.05;
    const curve=new THREE.CatmullRomCurve3([a.clone().setY(.97),a.clone().lerp(mid,.65).setY(1.05),b.clone().lerp(mid,.65).setY(1.05),b.clone().setY(.97)]);
    const border=new THREE.Mesh(new THREE.TubeGeometry(curve,20,.13,5,false),new THREE.MeshStandardMaterial({color:'#fff0c0',roughness:.8}));route.add(border);
    const trace=new THREE.Mesh(new THREE.TubeGeometry(curve,20,.075,5,false),new THREE.MeshStandardMaterial({color:flags[i].node.color,emissive:flags[i].node.color,emissiveIntensity:.3}));trace.position.y=.075;route.add(trace);
   }
   // Past and future are noninteractive hints, never additional stage meshes.
   if(flags.length){const first=flags[0].group.position,last=flags.at(-1)!.group.position;
   if(activeNodes[0].day>1){const pastGeometry=new THREE.BufferGeometry().setFromPoints([first.clone().add(new THREE.Vector3(-.6,.1,-1.5)),first.clone().setY(.9)]);route.add(new THREE.Line(pastGeometry,new THREE.LineBasicMaterial({color:'#d7d8b2',transparent:true,opacity:.55})))}
   const fogGeometry=new THREE.SphereGeometry(1.3,10,5);for(let i=0;i<3;i++){const fog=new THREE.Mesh(fogGeometry,new THREE.MeshBasicMaterial({color:'#cde5dd',transparent:true,opacity:.16,depthWrite:false}));fog.position.copy(last).add(new THREE.Vector3(.5+i*.5,.45,1.5+i*.18));fog.scale.set(1,.36,.7);route.add(fog)}}
   if(!initialized||reduced||(currentTarget.distanceTo(toTarget)<.08&&Math.abs(currentSpan-toSpan)<.08)){cancelAnimationFrame(raf);raf=0;initialized=true;currentTarget.copy(toTarget);currentSpan=toSpan;applyCamera(currentTarget,currentSpan);setMoving(false);render()}else{fromTarget.copy(currentTarget);fromSpan=currentSpan;startedAt=performance.now();setMoving(true);cancelAnimationFrame(raf);raf=requestAnimationFrame(animate)}
  };
  const resize=()=>{const box=element.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);renderer.setSize(width,height,false);rebuild()};
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(resize);observer?.observe(element);if(!observer)window.addEventListener('resize',resize);
  const pointers=new Map<number,{x:number;y:number}>();let gestureStart={x:0,y:0},dragged=false,pinchDistance=0;
  const requestZoom=(value:number)=>{const next=clampZoom(value);if(Math.abs(next-activeZoom)<.001)return;activeZoom=next;latest.current.onZoomChange?.(next);rebuild()};
  const localPoint=(event:PointerEvent)=>{const rect=element.getBoundingClientRect();return {x:event.clientX-rect.left,y:event.clientY-rect.top}};
  const distance=()=>{const points=[...pointers.values()];return points.length===2?Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y):0};
  const down=(event:PointerEvent)=>{if(event.button!==0)return;const point=localPoint(event);pointers.set(event.pointerId,point);if(pointers.size===1){gestureStart=point;dragged=false}else{dragged=true;pinchDistance=distance()}element.setPointerCapture?.(event.pointerId)};
  const move=(event:PointerEvent)=>{const previous=pointers.get(event.pointerId);if(!previous)return;const point=localPoint(event);pointers.set(event.pointerId,point);if(pointers.size===2){const nextDistance=distance();if(pinchDistance>0)requestZoom(activeZoom*nextDistance/pinchDistance);pinchDistance=nextDistance;return}if(Math.hypot(point.x-gestureStart.x,point.y-gestureStart.y)>6)dragged=true;if(!dragged)return;cancelAnimationFrame(raf);raf=0;setMoving(false);const delta=screenGround(previous.x,previous.y).sub(screenGround(point.x,point.y));const before=pan.clone();pan.add(delta);pan.x=THREE.MathUtils.clamp(pan.x,-30,30);pan.z=THREE.MathUtils.clamp(pan.z,-20,20);currentTarget.add(pan.clone().sub(before));toTarget.copy(currentTarget);applyCamera(currentTarget,currentSpan);render()};
  const up=(event:PointerEvent)=>{const had=pointers.delete(event.pointerId);if(!had)return;element.releasePointerCapture?.(event.pointerId);if(dragged||moving||viewMode!=='episode')return;const point=localPoint(event);raycaster.setFromCamera(new THREE.Vector2(point.x/width*2-1,1-point.y/height*2),camera);const hits=raycaster.intersectObjects(flags.map(flag=>flag.group),true);if(hits.length){let object:THREE.Object3D|null=hits[0].object;while(object&&!object.userData.day)object=object.parent;if(object?.userData.day)latest.current.onSelect(object.userData.day)}};
  const cancel=()=>{pointers.clear();dragged=true;pinchDistance=0};
  const wheel=(event:WheelEvent)=>{event.preventDefault();requestZoom(activeZoom*Math.exp(-event.deltaY*.0015))};
  element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);element.addEventListener('pointerup',up);element.addEventListener('pointercancel',cancel);element.addEventListener('wheel',wheel,{passive:false});
  const contextLost=(event:Event)=>{event.preventDefault();setMoving(false);cancelAnimationFrame(raf);try{renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.domElement.remove();renderer.dispose();renderer=makeSoftware();software=true;reduced=true;compatibleLabels();light.intensity=.65;scene.add(new THREE.AmbientLight('#fff7df',.34));mountRenderer();resize()}catch{latest.current.onUnavailable?.()}};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;setMoving(false)}else{currentTarget.copy(toTarget);currentSpan=toSpan;applyCamera(currentTarget,currentSpan);render()}};document.addEventListener('visibilitychange',visibility);
  let lastReset=latest.current.resetViewKey;
  const api:SceneController={update:(next)=>{if(viewMode!==(next.viewMode??'episode')||activeFocus.lon!==next.focus.lon||activeFocus.lat!==next.focus.lat||next.resetViewKey!==lastReset){pan.set(0,0,0)}lastReset=next.resetViewKey;activeNodes=next.nodes;activeFocus=next.focus;viewMode=next.viewMode??'episode';activeZoom=clampZoom(next.zoom??activeZoom);reduced=Boolean(next.reducedMotion)||software;rebuild()},dispose:()=>{disposed=true;cancelAnimationFrame(raf);observer?.disconnect();if(!observer)window.removeEventListener('resize',resize);element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',up);element.removeEventListener('pointercancel',cancel);element.removeEventListener('wheel',wheel);renderer.domElement.removeEventListener('webglcontextlost',contextLost);document.removeEventListener('visibilitychange',visibility);disposeObject(scene);renderer.dispose();renderer.domElement.remove();latest.current.onTransition?.(false)}};
  controller.current=api;resize();
  return()=>{controller.current=null;api.dispose()};
 },[]);
 useEffect(()=>{controller.current?.update(props)},[props.nodes,props.focus.lon,props.focus.lat,props.reducedMotion,props.viewMode,props.zoom,props.resetViewKey,props.focusLabel]);
 return <div className="journey-webgl-scene" ref={host} data-renderer="three-scene" style={{position:'absolute',inset:0,touchAction:'none',cursor:'grab'}}/>;
}
