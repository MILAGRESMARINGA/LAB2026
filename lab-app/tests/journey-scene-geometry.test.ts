// @vitest-environment jsdom
import {describe,it,expect,vi} from 'vitest';
import * as THREE from 'three';
import {disposeObject,geographicPoint,makeAncientWorld} from '../src/components/journey3d/terrain';
describe('Terreno modelado do Mundo Antigo',()=>{
 it('gera relevo real em três dimensões, com vértices finitos',()=>{
  const context=vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(()=>null);
  const world=makeAncientWorld();
  try{
   let meshes=0,extrusions=0;
   world.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return;
    meshes++;
    const geometry=object.geometry;
    if(geometry instanceof THREE.ExtrudeGeometry)extrusions++;
    const positions=geometry.getAttribute('position');
    for(let index=0;index<positions.count;index++)expect([positions.getX(index),positions.getY(index),positions.getZ(index)].every(Number.isFinite)).toBe(true);
   });
   expect(meshes).toBeGreaterThan(80);expect(extrusions).toBeGreaterThanOrEqual(9);
   const bounds=new THREE.Box3().setFromObject(world),size=bounds.getSize(new THREE.Vector3());
   expect(size.x).toBeGreaterThan(40);expect(size.z).toBeGreaterThan(20);expect(size.y).toBeGreaterThan(2);
  }finally{disposeObject(world);context.mockRestore()}
 });
 it('mantém leste e norte consistentes e descarta recursos compartilhados uma única vez',()=>{
  expect(geographicPoint(45,33).x).toBeGreaterThan(geographicPoint(31,29).x);
  expect(geographicPoint(12.5,41.9).z).toBeLessThan(geographicPoint(31,29).z);
  const geometry=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshBasicMaterial(),root=new THREE.Group();
  root.add(new THREE.Mesh(geometry,material),new THREE.Mesh(geometry,material));
  const disposeGeometry=vi.spyOn(geometry,'dispose'),disposeMaterial=vi.spyOn(material,'dispose');
  disposeObject(root);
  expect(disposeGeometry).toHaveBeenCalledOnce();expect(disposeMaterial).toHaveBeenCalledOnce();
 });
});
