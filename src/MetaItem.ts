import { InstanceOfMetaItem } from "./InstanceOfMetaItem";
import { RenderManager } from "./RenderManager";
import * as THREE from "three"

export class MetaItem {
  geometry: THREE.BoxGeometry
  material: THREE.MeshBasicMaterial

  constructor() {
    this.geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      /*
      ambient: 0xffffff,
      specular: 0xcccccc,
      shininess: 50,
      metal: true,
      */
      map: new THREE.TextureLoader().load('texture.png')
    });

  }
  /*
  var vertices = [];
  var faces = [];
  vertices.push([0,0,0]);
  vertices.push([1,0,0]);
  vertices.push([1,0,1]);
  vertices.push([0,0,1]);
  vertices.push([0,1,0]);
  vertices.push([1,1,0]);
  vertices.push([1,1,1]);
  vertices.push([0,1,1]);
  faces.push([0,1,2,3]);
  faces.push([0,1,2,3]);
  faces.push([0,1,2,3]);
  faces.push([0,1,2,3]);
  faces.push([0,1,2,3]);
  faces.push([4,5,6,7]);
  */
  getInstance(renderManager: RenderManager) {
    return new InstanceOfMetaItem(renderManager, geometry, material);
  }
}