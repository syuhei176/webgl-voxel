import { RenderManager } from "./render_manager";
import { WorldManager } from "./world_manager";
import * as THREE from "three";

interface Box {
  type: number | null;
  brightness: 0xffffff;
}

export const CHUNLK_LENGTH_X = 16;
export const CHUNLK_LENGTH_Y = 64;
export const CHUNLK_LENGTH_Z = 16;
export const TEXTURE_SIZE = 320;
export const TEXTURE_TIP_SIZE = 32;
export const TEXTURE_TIP_RATIO = TEXTURE_TIP_SIZE / TEXTURE_SIZE;

type Pos2D = {
  x: number;
  z: number;
};

export class Chunk {
  renderManager: RenderManager;
  worldManager: WorldManager;
  geometry: THREE.BufferGeometry;
  boxes: Box[][][];
  meshes: (THREE.Mesh | null)[][];
  x_size: number = CHUNLK_LENGTH_X;
  z_size: number = CHUNLK_LENGTH_Z;
  y_size: number = CHUNLK_LENGTH_Y;

  mesh: THREE.Mesh;

  pos: Pos2D;

  loader: THREE.TextureLoader;

  texture: THREE.Texture;

  constructor(x: number, z: number, renderManager: RenderManager) {
    this.pos = {
      x,
      z,
    };
    this.renderManager = renderManager;
    this.loader = new THREE.TextureLoader();

    this.meshes = [];
    for (var i = 0; i < CHUNLK_LENGTH_X; i++) {
      this.meshes[i] = [];
      for (var j = 0; j < CHUNLK_LENGTH_Z; j++) {
        this.meshes[i][j] = null;
      }
    }

    this.texture = this.loader.load("./texture.png");
    this.geometry = new THREE.BufferGeometry();

    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
    });
    this.mesh = new THREE.Mesh(this.geometry, material);

    this.renderManager.addToScene(this.mesh);
  }

  getMeshResult() {
    var result: {
      vertices: number[][];
      faces: number[][];
      uvs: THREE.Vector2[];
      colors: number[];
    } = {
      vertices: [],
      faces: [],
      uvs: [],
      colors: [],
    };

    var vertex_map = {};

    const search_surface_part = (x: number, z: number) => {
      for (var y = this.y_size - 1; y >= 0; y--) {
        if (this.boxes[x][y][z].type == null) {
          if (x < this.x_size - 1 && this.boxes[x + 1][y][z].type) {
            const uvs = get_uv(this.boxes[x + 1][y][z].type || 0);

            var q1 = add_vertex([x + 1, y, z], uvs[0]);
            var q2 = add_vertex([x + 1, y, z + 1], uvs[1]);
            var q3 = add_vertex([x + 1, y + 1, z + 1], uvs[2]);
            var q4 = add_vertex([x + 1, y + 1, z], uvs[3]);

            result.faces.push([q1, q2, q3, q4]);
            result.colors.push(this.boxes[x][y][z].brightness);
          } else if (x == this.x_size - 1) {
            var chunk1 = this.worldManager.getChunk(this.pos.x + 1, this.pos.z);
            if (chunk1) {
              var box1 = chunk1.findObjectLocal(0, y, z);
              if (box1 && box1.type) {
                const uvs = get_uv(box1.type);

                var q1 = add_vertex([x + 1, y, z], uvs[0]);
                var q2 = add_vertex([x + 1, y, z + 1], uvs[1]);
                var q3 = add_vertex([x + 1, y + 1, z + 1], uvs[2]);
                var q4 = add_vertex([x + 1, y + 1, z], uvs[3]);

                result.faces.push([q1, q2, q3, q4]);
                result.colors.push(this.boxes[x][y][z].brightness);
              }
            }
          }
          if (x > 0 && this.boxes[x - 1][y][z].type) {
            const uvs = get_uv(this.boxes[x - 1][y][z].type || 0);

            var q1 = add_vertex([x, y, z], uvs[0]);
            var q2 = add_vertex([x, y + 1, z], uvs[1]);
            var q3 = add_vertex([x, y + 1, z + 1], uvs[2]);
            var q4 = add_vertex([x, y, z + 1], uvs[3]);

            result.faces.push([q1, q2, q3, q4]);
            result.colors.push(this.boxes[x][y][z].brightness);
          } else if (x == 0) {
            var chunk1 = this.worldManager.getChunk(this.pos.x - 1, this.pos.z);
            if (chunk1) {
              var box1 = chunk1.findObjectLocal(CHUNLK_LENGTH_X - 1, y, z);
              if (box1 && box1.type) {
                const uvs = get_uv(box1.type);

                var q1 = add_vertex([x, y, z], uvs[0]);
                var q2 = add_vertex([x, y + 1, z], uvs[1]);
                var q3 = add_vertex([x, y + 1, z + 1], uvs[2]);
                var q4 = add_vertex([x, y, z + 1], uvs[3]);

                result.faces.push([q1, q2, q3, q4]);
                result.colors.push(this.boxes[x][y][z].brightness);
              }
            }
          }
          if (y < this.y_size - 1 && this.boxes[x][y + 1][z].type) {
            const uvs = get_uv(this.boxes[x][y + 1][z].type || 0);

            var q1 = add_vertex([x, y + 1, z], uvs[0]);
            var q2 = add_vertex([x + 1, y + 1, z], uvs[1]);
            var q3 = add_vertex([x + 1, y + 1, z + 1], uvs[2]);
            var q4 = add_vertex([x, y + 1, z + 1], uvs[3]);

            result.faces.push([q1, q2, q3, q4]);
            result.colors.push(this.boxes[x][y][z].brightness);
          }
          if (y > 0 && this.boxes[x][y - 1][z].type) {
            const uvs = get_uv(this.boxes[x][y - 1][z].type || 0);

            var q1 = add_vertex([x, y, z], uvs[0]);
            var q2 = add_vertex([x, y, z + 1], uvs[1]);
            var q3 = add_vertex([x + 1, y, z + 1], uvs[2]);
            var q4 = add_vertex([x + 1, y, z], uvs[3]);

            result.faces.push([q1, q2, q3, q4]);
            result.colors.push(this.boxes[x][y][z].brightness);
          }
          if (z < this.z_size - 1 && this.boxes[x][y][z + 1].type) {
            const uvs = get_uv(this.boxes[x][y][z + 1].type || 0);

            var q1 = add_vertex([x, y, z + 1], uvs[0]);
            var q2 = add_vertex([x, y + 1, z + 1], uvs[1]);
            var q3 = add_vertex([x + 1, y + 1, z + 1], uvs[2]);
            var q4 = add_vertex([x + 1, y, z + 1], uvs[3]);

            result.faces.push([q1, q2, q3, q4]);
            result.colors.push(this.boxes[x][y][z].brightness);
          } else if (z == this.z_size - 1) {
            var chunk1 = this.worldManager.getChunk(this.pos.x, this.pos.z + 1);
            if (chunk1) {
              var box1 = chunk1.findObjectLocal(x, y, 0);
              if (box1 && box1.type) {
                const uvs = get_uv(box1.type);

                var q1 = add_vertex([x, y, z + 1], uvs[0]);
                var q2 = add_vertex([x, y + 1, z + 1], uvs[1]);
                var q3 = add_vertex([x + 1, y + 1, z + 1], uvs[2]);
                var q4 = add_vertex([x + 1, y, z + 1], uvs[3]);

                result.faces.push([q1, q2, q3, q4]);
                result.colors.push(this.boxes[x][y][z].brightness);
              }
            }
          }
          if (z > 0 && this.boxes[x][y][z - 1].type) {
            const uvs = get_uv(this.boxes[x][y][z - 1].type || 0);

            var q1 = add_vertex([x, y, z], uvs[0]);
            var q2 = add_vertex([x + 1, y, z], uvs[1]);
            var q3 = add_vertex([x + 1, y + 1, z], uvs[2]);
            var q4 = add_vertex([x, y + 1, z], uvs[3]);

            result.faces.push([q1, q2, q3, q4]);
            result.colors.push(this.boxes[x][y][z].brightness);
          } else if (z == 0) {
            var chunk1 = this.worldManager.getChunk(this.pos.x, this.pos.z - 1);
            if (chunk1) {
              var box1 = chunk1.findObjectLocal(x, y, CHUNLK_LENGTH_Z - 1);
              if (box1 && box1.type) {
                const uvs = get_uv(box1.type);

                var q1 = add_vertex([x, y, z], uvs[0]);
                var q2 = add_vertex([x + 1, y, z], uvs[1]);
                var q3 = add_vertex([x + 1, y + 1, z], uvs[2]);
                var q4 = add_vertex([x, y + 1, z], uvs[3]);

                result.faces.push([q1, q2, q3, q4]);
                result.colors.push(this.boxes[x][y][z].brightness);
              }
            }
          }
        }
      }
    };

    for (var x = 0; x < this.x_size; x++) {
      for (var z = 0; z < this.z_size; z++) {
        search_surface_part(x, z);
      }
    }

    return result;

    function add_vertex(v: number[], uv: THREE.Vector2) {
      const key = v.join("-") + "-" + uv.x.toFixed(4) + "-" + uv.y.toFixed(4);
      if (!vertex_map[key]) {
        vertex_map[key] = result.vertices.length;
        result.vertices.push(v);
        result.uvs.push(uv);
      }
      return vertex_map[key];
    }

    function get_uv(index: number) {
      const u1 = new THREE.Vector2(index * TEXTURE_TIP_RATIO, 1);
      const u2 = new THREE.Vector2(index * TEXTURE_TIP_RATIO, 0.9);
      const u3 = new THREE.Vector2((index + 1) * TEXTURE_TIP_RATIO, 0.9);
      const u4 = new THREE.Vector2((index + 1) * TEXTURE_TIP_RATIO, 1);

      return [u1, u2, u3, u4];
    }
  }

  init(worldManager: WorldManager, terrain) {
    this.worldManager = worldManager;
    this.boxes = [];
    for (var x = 0; x < this.x_size; x++) {
      this.boxes[x] = [];
      for (var y = 0; y < this.y_size; y++) {
        this.boxes[x][y] = [];
        for (var z = 0; z < this.z_size; z++) {
          this.boxes[x][y][z] = {
            type: null,
            brightness: 0xffffff,
          };
        }
      }
    }
    for (var x = 0; x < this.x_size; x++) {
      for (var z = 0; z < this.z_size; z++) {
        var hpoint =
          terrain[this.pos.x * CHUNLK_LENGTH_X + x][
            this.pos.z * CHUNLK_LENGTH_Z + z
          ];
        for (var y = 0; y < this.y_size; y++) {
          if (hpoint > y) {
            var r = Math.random() * 10;
            if (this.getNumOfBox(x, y, z, 5, 1)) {
              if (r < 3) this.boxes[x][y][z].type = 5;
              else this.boxes[x][y][z].type = 2;
            } else {
              if (r <= 0.01) {
                this.boxes[x][y][z].type = 5;
              } else this.boxes[x][y][z].type = 2;
            }
          } else if (hpoint == y) {
            if (Math.random() * 10 <= 1) {
              this.boxes[x][y][z].type = 2;
            } else {
              this.boxes[x][y][z].type = 1;
            }
          } else {
            this.boxes[x][y][z].type = null;
            this.boxes[x][y][z].brightness = 0xffffff;
          }
        }
      }
    }
  }

  refresh() {
    const result = this.getMeshResult();

    const positionArray: number[] = [];
    const faces: number[] = [];
    const uvArray: number[] = [];

    for (var i = 0; i < result.vertices.length; i++) {
      positionArray.push(this.pos.x * this.x_size + result.vertices[i][0]);
      positionArray.push(result.vertices[i][1]);
      positionArray.push(this.pos.z * this.z_size + result.vertices[i][2]);

      uvArray.push(result.uvs[i].x);
      uvArray.push(result.uvs[i].y);
    }

    for (var i = 0; i < result.faces.length; i++) {
      const q = result.faces[i];

      faces.push(q[0]);
      faces.push(q[1]);
      faces.push(q[2]);

      faces.push(q[0]);
      faces.push(q[2]);
      faces.push(q[3]);
    }

    // Only update geometry if we have valid data
    if (positionArray.length > 0 && faces.length > 0 && uvArray.length > 0) {
      // Dispose old geometry to prevent memory issues
      this.geometry.dispose();
      this.geometry = new THREE.BufferGeometry();

      this.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(positionArray), 3),
      );
      this.geometry.setAttribute(
        "uv",
        new THREE.BufferAttribute(new Float32Array(uvArray), 2),
      );
      this.geometry.setIndex(faces);

      this.geometry.computeVertexNormals();
      this.geometry.computeBoundingBox();
      this.geometry.computeBoundingSphere();

      // Update the mesh geometry
      this.mesh.geometry = this.geometry;
    }
  }

  getPos() {
    return this.pos;
  }

  findObjectLocal(_x, _y, _z) {
    var x = _x;
    var y = _y;
    var z = _z;
    if (x < 0 || y < 0 || z < 0) return null;
    if (x >= this.x_size || y >= this.y_size || z >= this.z_size) return null;
    return this.boxes[x][y][z];
  }

  findObjectLocal2(_x, _y, _z) {
    var x = _x;
    var y = _y;
    var z = _z;
    let chunk1: Chunk | null = this;

    if (x < 0) {
      chunk1 = this.worldManager.getChunk(this.pos.x - 1, this.pos.z);
      x += CHUNLK_LENGTH_X;
    }
    if (z < 0) {
      chunk1 = this.worldManager.getChunk(this.pos.x, this.pos.z - 1);
      z += CHUNLK_LENGTH_Z;
    }
    if (x >= this.x_size) {
      chunk1 = this.worldManager.getChunk(this.pos.x + 1, this.pos.z);
      x -= CHUNLK_LENGTH_X;
    }
    if (z >= this.z_size) {
      chunk1 = this.worldManager.getChunk(this.pos.x, this.pos.z + 1);
      z -= CHUNLK_LENGTH_Z;
    }
    if (chunk1) {
      return chunk1.findObjectLocal(x, y, z);
    }
  }

  findObject(_x, _y, _z) {
    var x = _x - this.pos.x * this.x_size;
    var y = _y;
    var z = _z - this.pos.z * this.z_size;
    if (x < 0 || y < 0 || z < 0) return null;
    if (x >= this.x_size || y >= this.y_size || z >= this.z_size) return null;
    return this.boxes[x][y][z].type;
  }

  createObject(_x: number, _y: number, _z: number, type: number) {
    var x = _x - this.pos.x * this.x_size;
    var y = _y;
    var z = _z - this.pos.z * this.z_size;
    if (this.boxes[x][y][z].type == null) {
      this.boxes[x][y][z].type = type;
      this.boxes[x][y][z].brightness = 0xffffff;
      //this.calBrightnessMap(x,y,z);
    } else {
    }

    var chunks: (Chunk | null)[] = [];

    if (x == 0)
      chunks.push(this.worldManager.getChunk(this.pos.x - 1, this.pos.z));
    if (x == this.x_size - 1)
      chunks.push(this.worldManager.getChunk(this.pos.x + 1, this.pos.z));
    if (z == 0)
      chunks.push(this.worldManager.getChunk(this.pos.x, this.pos.z - 1));
    if (z == this.z_size - 1)
      chunks.push(this.worldManager.getChunk(this.pos.x, this.pos.z + 1));

    for (var i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      if (chunk !== null) {
        this.renderManager.enDisplayQueue(chunk);
      }
    }

    this.renderManager.enDisplayQueue(this);

    //this.refresh();
  }

  each(option, cb) {
    var sx = option.x - option.range;
    var sy = option.y - option.range;
    var sz = option.z - option.range;
    var ex = option.x + option.range;
    var ey = option.y + option.range;
    var ez = option.z + option.range;
    for (var x = sx; x < ex; x++) {
      for (var y = sy; y < ey; y++) {
        for (var z = sz; z < ez; z++) {
          cb(x, y, z);
        }
      }
    }
  }

  calBrightnessMap(bx, by, bz) {
    var self = this;
    this.each(
      {
        x: bx,
        y: by,
        z: bz,
        range: 2,
      },
      function (bx, by, bz) {
        var box = self.findObjectLocal2(bx, by, bz);
        if (box) {
          if (box.brightness != 0xffffff) {
            box.brightness = 0xffffff;
          }
        }
      },
    );
    this.each(
      {
        x: bx,
        y: by,
        z: bz,
        range: 6,
      },
      function (bx, by, bz) {
        var box = self.findObjectLocal2(bx, by, bz);
        if (box) {
          if (box.type) {
            var metaObj = this.worldManager.getMetaObject(box.type);
            if (metaObj._isLight()) {
              self.calBrightness(bx, by, bz);
            }
          } else if (box.brightness == 0xffffff) {
            self.calBrightness(bx, by, bz);
          }
        }
      },
    );
  }

  calBrightness(bx, by, bz) {
    this.create_brightness_map(bx, by, bz);
  }

  create_brightness_map(bx, by, bz) {
    var map = {};

    const object = this.findObjectLocal2(bx, by, bz);
    if (!object) {
      return;
    }

    var br = object.brightness - 0x111111;
    //if(br < 0xeeeeee) return;
    dfs(bx, by, bz, 0);
    function dfs(x, y, z, l) {
      map[x + "-" + y + "-" + z] = true;
      var v = this.findObjectLocal2(x, y, z);
      if (v && v.type == null && l > 0) {
        var b = 0xffffff - 0x111111 * l;
        if (v.brightness < b) v.brightness = b;
      }
      if (l > 0 && v.type) return;
      if (!map[x + 1 + "-" + y + "-" + z] && l < 10) dfs(x + 1, y, z, l + 1);
      if (!map[x - 1 + "-" + y + "-" + z] && l < 10) dfs(x - 1, y, z, l + 1);
      if (!map[x + "-" + (y + 1) + "-" + z] && l < 10) dfs(x, y + 1, z, l + 1);
      if (!map[x + "-" + (y - 1) + "-" + z] && l < 10) dfs(x, y - 1, z, l + 1);
      if (!map[x + "-" + y + "-" + (z + 1)] && l < 10) dfs(x, y, z + 1, l + 1);
      if (!map[x + "-" + y + "-" + (z - 1)] && l < 10) dfs(x, y, z - 1, l + 1);
    }
    /*
    var queue = [];
    var obj = self.findObjectLocal2(bx,by,bz);
    queue.push({x:bx,y:by,z:bz,data:obj,l:0});	//enqueue(v)
    map[bx+"-"+by+"-"+bz] = true;	//mark v as visited
    while(queue.length > 0) {	//while queue not empty
      var v = queue.shift();	//	v=dequeue()
      //	process(v)
      if(v.data && v.data.type==null && v.l > 0) {
        var b = 0xffffff - 0x111111 * v.l;
        if(v.data.brightness < b) v.data.brightness = b;
      }
          //	for all unvisited vertices i adjacent to v
      abc(v.x+1,v.y,v.z,v.l);
      abc(v.x-1,v.y,v.z,v.l);
      abc(v.x,v.y+1,v.z,v.l);
      abc(v.x,v.y-1,v.z,v.l);
      abc(v.x,v.y,v.z+1,v.l);
      abc(v.x,v.y,v.z-1,v.l);
      function abc(x,y,z,l) {
        if(!map[x+"-"+y+"-"+z] && l < 6) {
          queue.push({x:z,y:y,z:z,data:self.findObjectLocal2(x,y,z),l:l+1});
          map[x+"-"+y+"-"+z] = true;//		mark i as visited
        }
      }
    }
    */
  }

  destroyObject(_x, _y, _z) {
    var x = _x - this.pos.x * this.x_size;
    var y = _y;
    var z = _z - this.pos.z * this.z_size;
    if (x < 0 || y < 0 || z < 0) return null;
    if (x >= this.x_size || y >= this.y_size || z >= this.z_size) return null;
    if (this.boxes[x][y][z].type) {
      this.boxes[x][y][z].type = null;
      //this.boxes[x][y][z].brightness = 0x111111;
      //this.calBrightnessMap(x,y,z);
    }

    var chunks: (Chunk | null)[] = [];

    if (x == 0)
      chunks.push(this.worldManager.getChunk(this.pos.x - 1, this.pos.z));
    if (x == this.x_size - 1)
      chunks.push(this.worldManager.getChunk(this.pos.x + 1, this.pos.z));
    if (z == 0)
      chunks.push(this.worldManager.getChunk(this.pos.x, this.pos.z - 1));
    if (z == this.z_size - 1)
      chunks.push(this.worldManager.getChunk(this.pos.x, this.pos.z + 1));

    for (var i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      if (chunk !== null) {
        this.renderManager.enDisplayQueue(chunk);
      }
    }

    this.renderManager.enDisplayQueue(this);
  }

  getNumOfBox(x, y, z, type, range) {
    var num = 0;
    var sx = x - range;
    var sy = y - range;
    var sz = z - range;
    var ex = x + range;
    var ey = y + range;
    var ez = z + range;
    if (sx < 0) sx = 0;
    if (sy < 0) sy = 0;
    if (sz < 0) sz = 0;
    if (ex > CHUNLK_LENGTH_X - 1) ex = CHUNLK_LENGTH_X - 1;
    if (ey > CHUNLK_LENGTH_Y - 1) ey = CHUNLK_LENGTH_Y - 1;
    if (ez > CHUNLK_LENGTH_Z - 1) ez = CHUNLK_LENGTH_Z - 1;
    for (var xx = sx; xx <= ex; xx++) {
      for (var yy = sy; yy <= ey; yy++) {
        for (var zz = sz; zz <= ez; zz++) {
          if (this.boxes[xx][yy][zz].type == type) num++;
        }
      }
    }
    return num;
  }

  enterFrame() {
    return;
    var self = this;
    for (var x = 0; x < x_size; x++) {
      for (var z = 0; z < z_size; z++) {
        search_soil(x, z);
      }
    }
    function search_soil(x, z) {
      for (var y = this.y_size - 1; y >= 0; y--) {
        if (this.boxes[x][y][z] == 2) {
          //soil
          if (Math.random() * 10 < 3 && self.getNumOfBox(x, y, z, 3, 2) < 1) {
            this.boxes[x][y + 1][z] = 3;
            self.refresh();
          } else {
            this.boxes[x][y + 1][z] = 1;
            self.refresh();
          }
          return;
        } else if (this.boxes[x][y][z] == 3) {
          if (this.boxes[x][y - 1][z] == 3 && this.boxes[x][y - 2][z] == 3) {
            this.boxes[x][y + 1][z] = 4;
            this.boxes[x + 1][y + 1][z] = 4;
            this.boxes[x - 1][y + 1][z] = 4;
            this.boxes[x][y + 1][z + 1] = 4;
            this.boxes[x][y + 1][z - 1] = 4;
            this.boxes[x + 1][y + 1][z + 1] = 4;
            this.boxes[x - 1][y + 1][z + 1] = 4;
            this.boxes[x + 1][y + 1][z - 1] = 4;
            this.boxes[x - 1][y + 1][z - 1] = 4;
          } else {
            this.boxes[x][y + 1][z] = 3;
          }
          self.refresh();
          return;
        }
        if (this.boxes[x][y][z] != null) return;
      }
    }
  }
}
