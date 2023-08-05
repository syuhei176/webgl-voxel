import { Camera, Scene, WebGLRenderer } from "three"
import * as THREE from "three"
import { CHUNLK_LENGTH_X, Chunk } from "./Chunk"

export class RenderManager {
  width: number
  height: number
  camera: Camera
  scene: Scene
  renderer: WebGLRenderer
  display_queue: Chunk[] = []
  listeners: any = []

  constructor(width: number, height: number) {
    this.width = width
    this.height = height

    //レンダラーの作成
    this.renderer = new WebGLRenderer({ antialias: true });
    // this.renderer.setDepthTest(true);
    this.renderer.setSize(width, height);
    // this.renderer.setClearColorHex(0xffffff, 1);
    this.renderer.clear();
    document.body.appendChild(this.renderer.domElement);
    //シーンの作成
    this.scene = new Scene();
    this.scene.fog = new THREE.Fog(0xffffff, 1, CHUNLK_LENGTH_X * 1.2);
    //カメラの作成
    this.camera = new THREE.PerspectiveCamera(90, width / height);
    this.camera.translateX(0)
    this.camera.translateY(0)
    this.camera.translateZ(10)
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.camera);
    //ライトの作成
    var light = new THREE.DirectionalLight(0xcccccc, 1);
    light.translateX(0.577)
    light.translateY(0.577)
    light.translateZ(0.577)
    this.scene.add(light);
    /*
    var light = new THREE.PointLight( 0xcccccc, 1, 200 );
    light.position.x = 100;
    light.position.y = 100;
    light.position.z = 100;
    scene.add(light);
    */
    /*
    var ambient = new THREE.AmbientLight(0x333333);
    scene.add(ambient);
    */
    var listeners = [];
    var display_queue = [];
  }

  enDisplayQueue(chunk: Chunk) {
    //chunk.refresh();
    this.display_queue.push(chunk);
  }

  addToScene(obj) {
    this.scene.add(obj);
  }

  removeFromScene(obj) {
    this.scene.remove(obj);
  }

  play() {

    const render = () => {
      var c = this.display_queue.shift();
      if (c) {
        c.refresh();
      }
      //display_queue.length = 0;
      requestAnimationFrame(render);
      if (!c) this.renderer.render(this.scene, this.camera);
    };

    render();
  }

  addEnterFrameListener(l) {
    this.listeners.push(l);
  }

  blight(i: number) {
    this.renderer.setClearColorHex(i, 1);
  }

}