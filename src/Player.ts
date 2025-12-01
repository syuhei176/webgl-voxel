import { CHUNLK_LENGTH_X, CHUNLK_LENGTH_Y, CHUNLK_LENGTH_Z } from "./chunk";
import { RenderManager } from "./render_manager";
import { WORLD_WIDTH, WorldManager } from "./world_manager";
import * as THREE from "three";
import { META_ITEMS, display2d } from "./items";

type Pockets = {
  id: number;
  num: number;
};

export class Player {
  renderManager: RenderManager;
  worldManager: WorldManager;
  camera: THREE.Camera;
  pos: THREE.Vector3;
  direction: THREE.Vector3;
  walkSpeed: number;
  selectedItem: number;
  items: number;
  pockets: Pockets[];

  jumpForce: number;
  isForwardMode: boolean;
  isBackMode: boolean;
  isRightMode: boolean;
  isLeftMode: boolean;

  constructor(renderManager: RenderManager) {
    this.renderManager = renderManager;
    this.camera = renderManager.camera;
    this.pos = new THREE.Vector3(
      Math.floor((CHUNLK_LENGTH_X * WORLD_WIDTH) / 2),
      Math.floor(CHUNLK_LENGTH_Y - 30),
      Math.floor((CHUNLK_LENGTH_Z * WORLD_WIDTH) / 2),
    );
    this.direction = new THREE.Vector3(0, 0, -1);
    this.walkSpeed = 0.18;
    this.selectedItem = 0;
    this.items = 2;
    this.pockets = [
      {
        id: 1,
        num: 5,
      },
    ];

    this.refreshCameraPosition();

    renderManager.addEnterFrameListener(() => {
      const below = this.worldManager.findObject(
        this.pos.x,
        this.pos.y - 1,
        this.pos.z,
      );

      if (this.jumpForce > 0) {
        this.pos.y += this.jumpForce;

        this.jumpForce -= 0.02;

        if (this.jumpForce < 0) {
          this.jumpForce = 0;
        }
      }

      // if there is not a block below, falls down
      if (!below) {
        this.pos.y -= 0.08;

        this.refreshCameraPosition();
      }

      if (this.isForwardMode) {
        this.forward();
      }
      if (this.isBackMode) {
        this.backward();
      }
      if (this.isRightMode) {
        this.right();
      }
      if (this.isLeftMode) {
        this.left();
      }
    });
  }

  refreshCameraPosition() {
    this.camera.position.setX(this.pos.x);
    this.camera.position.setY(this.pos.y + 0.5);
    this.camera.position.setZ(this.pos.z);
    var p = new THREE.Vector3(this.pos.x, this.pos.y + 0.5, this.pos.z);
    p.add(this.direction);
    this.camera.lookAt(p);
  }

  getPos() {
    return this.pos;
  }

  initPlayer(worldManager: WorldManager) {
    this.worldManager = worldManager;
    var p = worldManager.getStartPoint();
    this.pos.x = p.x;
    this.pos.y = p.y;
    this.pos.z = p.z;
  }

  startForward() {
    this.isForwardMode = true;
  }

  stopForward() {
    this.isForwardMode = false;
  }

  startBack() {
    this.isBackMode = true;
  }

  stopBack() {
    this.isBackMode = false;
  }

  startRight() {
    this.isRightMode = true;
  }

  stopRight() {
    this.isRightMode = false;
  }

  startLeft() {
    this.isLeftMode = true;
  }

  stopLeft() {
    this.isLeftMode = false;
  }

  forward() {
    this.pos.x += this.direction.x * this.walkSpeed;
    this.pos.z += this.direction.z * this.walkSpeed;
    if (this.pos.x < 0.5) this.pos.x = 0.5;
    if (this.pos.z < 0.5) this.pos.z = 0.5;

    // If the player hit a wall, put the position back up.
    const coll = this.worldManager.findObject(
      this.pos.x,
      this.pos.y,
      this.pos.z,
    );
    if (coll) {
      this.pos.x -= this.direction.x * this.walkSpeed;
      this.pos.z -= this.direction.z * this.walkSpeed;
    }

    this.refreshCameraPosition();

    const item = this.worldManager.findItemByPos(
      this.pos.x,
      this.pos.y,
      this.pos.z,
    );
    if (item) {
      this.worldManager.remove(item);
      this.items++;
    }
    $("#debug2").html(
      "chunk x=" +
        Math.floor(this.pos.x) +
        ",y=" +
        Math.floor(this.pos.y) +
        ",z=" +
        Math.floor(this.pos.z),
    );
    this.worldManager.refreshActiveChunk();
  }

  backward() {
    this.pos.x += this.direction.x * -this.walkSpeed;
    this.pos.z += this.direction.z * -this.walkSpeed;

    // If the player hit a wall, put the position back up.
    const coll = this.worldManager.findObject(
      this.pos.x,
      this.pos.y,
      this.pos.z,
    );
    if (coll) {
      this.pos.x -= this.direction.x * -this.walkSpeed;
      this.pos.z -= this.direction.z * -this.walkSpeed;
    }
    this.refreshCameraPosition();
    this.worldManager.refreshActiveChunk();
  }

  right() {
    this.pos.x += -this.direction.z * this.walkSpeed;
    this.pos.z += this.direction.x * this.walkSpeed;

    // If the player hit a wall, put the position back up.
    const coll = this.worldManager.findObject(
      this.pos.x,
      this.pos.y,
      this.pos.z,
    );
    if (coll) {
      this.pos.x += -this.direction.z * -this.walkSpeed;
      this.pos.z += this.direction.x * -this.walkSpeed;
    }
    this.refreshCameraPosition();
    this.worldManager.refreshActiveChunk();
  }

  left() {
    this.pos.x += this.direction.z * this.walkSpeed;
    this.pos.z += -this.direction.x * this.walkSpeed;

    // If the player hit a wall, put the position back up.
    const coll = this.worldManager.findObject(
      this.pos.x,
      this.pos.y,
      this.pos.z,
    );
    if (coll) {
      this.pos.x += this.direction.z * -this.walkSpeed;
      this.pos.z += -this.direction.x * -this.walkSpeed;
    }
    this.refreshCameraPosition();
    this.worldManager.refreshActiveChunk();
  }

  startJump() {
    if (this.jumpForce <= 0) {
      this.jumpForce = 0.6;
    }
  }
  stopJump() {
    this.jumpForce = 0;
  }

  changeDirection(mx: number, my: number) {
    const th = (mx > 0 ? 1 : -1) * Math.abs(mx) * 320;
    const dx =
      this.direction.x * Math.cos((th / 180) * Math.PI) -
      this.direction.z * Math.sin((th / 180) * Math.PI);
    const dz =
      this.direction.x * Math.sin((th / 180) * Math.PI) +
      this.direction.z * Math.cos((th / 180) * Math.PI);

    this.direction.setX(dx);
    this.direction.setZ(dz);
    this.direction.setY(this.direction.y + my * 2);
    this.direction.normalize();

    this.refreshCameraPosition();
  }

  useItem() {
    const raycaster = new THREE.Raycaster(); // create once

    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    const intersects = raycaster.intersectObjects(
      this.renderManager.scene.children,
    );

    if (intersects.length > 0 && intersects[0].face) {
      const itemInfo = META_ITEMS[this.pockets[this.selectedItem].id];

      if (itemInfo.destroy_tool) {
        if (intersects[0].distance < 4) {
          this.worldManager.destroyObject(
            Math.floor(intersects[0].point.x - intersects[0].face.normal.x / 4),
            Math.floor(intersects[0].point.y - intersects[0].face.normal.y / 4),
            Math.floor(intersects[0].point.z - intersects[0].face.normal.z / 4),
          );
        }
      } else if (itemInfo.settable) {
        if (this.items > 0 && intersects[0].distance < 4) {
          this.items--;
          this.worldManager.createObject(
            Math.floor(intersects[0].point.x + intersects[0].face.normal.x / 4),
            Math.floor(intersects[0].point.y + intersects[0].face.normal.y / 4),
            Math.floor(intersects[0].point.z + intersects[0].face.normal.z / 4),
            itemInfo.boxid,
          );
        }
      }
    } else {
      //intersects[0].object.material.emissive = new THREE.Color(0);
    }
  }

  selectItem(i: number) {
    this.selectedItem = i;
    const itemInfo = META_ITEMS[this.pockets[this.selectedItem].id];
    display2d(itemInfo.name);
  }
}
