import { RenderManager } from "./render_manager";
import * as THREE from "three";

export class InstanceOfMetaItem {
  id: string;
  renderManager: RenderManager;
  mesh: THREE.Mesh;

  constructor(renderManager: RenderManager, geometry, material) {
    this.renderManager = renderManager;

    // TODO: id generation
    this.id = "i" + new Date().getTime().toString(36);

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotateY((30 / 180) * Math.PI);
  }

  getID() {
    return this.id;
  }

  getClass() {
    return "Item";
  }

  getMesh() {
    return this.mesh;
  }

  setPosition(x, y, z) {
    this.mesh.translateX(x);
    this.mesh.translateY(y);
    this.mesh.translateZ(z);
  }

  destroy() {
    this.renderManager.scene.remove(this.mesh);
  }
}
