import { CHUNLK_LENGTH_X, CHUNLK_LENGTH_Y, CHUNLK_LENGTH_Z, Chunk } from "./Chunk";
import { InputManager } from "./InputManager";
import { MetaItem } from "./MetaItem";
import { MetaObject } from "./MetaObject";
import { Player } from "./Player";
import { RenderManager } from "./RenderManager";
import { TerrainGenerator } from "./TerrainGenerator";

export const WORLD_WIDTH = 8;


export class WorldManager {
  inputManager: InputManager
  renderManager: RenderManager
  player: Player
  chunk: Chunk[][] = []
  current_chunk: Chunk
  items: any

  metaObjects: (MetaObject | null)[]

  x_size = WORLD_WIDTH
  z_size = WORLD_WIDTH


  constructor() {

    this.renderManager = new RenderManager(window.innerWidth, window.innerHeight);

    //current chunk mesh
    var mesh = null;
    var boxes = [];
    this.items = {};
    var render_pos = null;
    this.metaObjects = [null,
      new MetaObject(1),
      new MetaObject(2),
      new MetaObject(3),
      new MetaObject(4, { is_light: true, brightness: 0xffffff }),
      new MetaObject(5)
    ];
    var metaItem = new MetaItem();
    for (var x = 0; x < this.x_size; x++) {
      this.chunk[x] = [];
      for (var z = 0; z < this.z_size; z++) {
        this.chunk[x][z] = new Chunk(x, z, this.renderManager);
      }
    }
    let g_time = 0
    setInterval(() => {
      g_time++;
      var hour = (Math.floor(g_time / 7) % 24);
      /*
      if(hour > 21 || hour < 4) {
          renderManager.blight(0x0f0f0f);
      }else if(hour > 20 || hour < 5) {
          renderManager.blight(0x1f1010);
      }else if(hour > 19 || hour < 6) {
          renderManager.blight(0x993333);
      }else if(hour > 18 || hour < 7) {
          renderManager.blight(0x665577);
      }else{
          renderManager.blight(0xffffff);
      }
      $("#time").html(hour + "時");
      */

      if (g_time % 10 == 0) {
        this.current_chunk.enterFrame();
      }
    }, 1000);
    this.current_chunk = this.chunk[0][0];

    this.player = new Player(this.renderManager);
    var inputManager = new InputManager();

    inputManager.set("forward", () => {
      this.player.startForward();
    })
    inputManager.set("stopforward", () => {
      this.player.stopForward();
    })

    inputManager.set("back", () => {
      this.player.backward();
    })

    inputManager.set("right", () => {
      this.player.right();
    })

    inputManager.set("left", () => {
      this.player.left();
    })

    inputManager.set("jump", () => {
      this.player.startJump();
    })

    inputManager.set("stopjump", () => {
      this.player.stopJump();
    })

    inputManager.set("pointermove", (e) => {
      this.player.changeDirection(e.mx, e.my);
    })

    inputManager.set("pointerclick", (e) => {
      this.player.useItem()
    })

    inputManager.set("selectitem", (e) => {
      this.player.selectItem(e.number);
      //アイテムナンバー表示
    })
  }

  getChunk(x: number, z: number) {
    if (x < 0 || z < 0 || x >= WORLD_WIDTH || z >= WORLD_WIDTH) return null

    return this.chunk[x][z]
  }

  add(obj) {
    if (obj.getClass() == "Object") {
      //既にboxesに入っている
    } else if (obj.getClass() == "Item") {
      this.items[obj.getID()] = obj;
      this.renderManager.addToScene(obj.getMesh());
    }
  }

  remove(obj) {
    if (obj.getClass() == "Object") {
      //既にboxesに入っている
    } else if (obj.getClass() == "Item") {
      this.renderManager.removeFromScene(obj.getMesh());
      delete this.items[obj.getID()];
    }
  }

  refreshActiveChunk() {
    var x = Math.floor(this.player.getPos().x / CHUNLK_LENGTH_X);
    var z = Math.floor(this.player.getPos().z / CHUNLK_LENGTH_Z);
    if (this.current_chunk != this.chunk[x][z] && this.chunk[x][z]) {
      this.current_chunk = this.chunk[x][z];
      this.createMesh();
    }
    $("#debug1").html("chunk x=" + x + ",z=" + z);
    return;
  }

  refreshCurrentChunk(pos, direction) {
    this.current_chunk.refresh();
    return;
  }

  createMesh() {
    var x = Math.floor(this.player.getPos().x / CHUNLK_LENGTH_X);
    var z = Math.floor(this.player.getPos().z / CHUNLK_LENGTH_Z);
    var start_x = x - 1;
    var start_z = z - 1;
    var end_x = x + 1;
    var end_z = z + 1;
    if (start_x < 0) start_x = 0;
    if (start_z < 0) start_z = 0;
    for (var i = start_x; i <= end_x; i++) {
      for (var j = start_z; j <= end_z; j++) {
        this.renderManager.enDisplayQueue(this.chunk[i][j]);
      }
    }
  }

  init() {
    var terraingen = new TerrainGenerator(CHUNLK_LENGTH_X * WORLD_WIDTH, CHUNLK_LENGTH_Y, CHUNLK_LENGTH_Z * WORLD_WIDTH);
    var terrain = terraingen.getMap();
    for (var x = 0; x < this.x_size; x++) {
      for (var z = 0; z < this.z_size; z++) {
        this.chunk[x][z].init(this, terrain);
      }
    }
    this.createMesh();
    this.refreshActiveChunk();
    this.player.initPlayer(this);
  }

  play() {
    this.renderManager.play();
  }

  destroyObject(_x, _y, _z) {
    var x = Math.floor(_x / CHUNLK_LENGTH_X);
    var z = Math.floor(_z / CHUNLK_LENGTH_Z);
    if (this.chunk[x][z]) {
      this.chunk[x][z].destroyObject(_x, _y, _z);
    }
    //TODO: オブジェクトをアイテム化して床に落とす
    //var item = metaItem.getInstance(renderManager);
    //item.setPosition(_x+0.5, _y+0.5, _z+0.5);
    //this.add(item);
  }

  createObject(_x, _y, _z, type) {
    var x = Math.floor(_x / CHUNLK_LENGTH_X);
    var z = Math.floor(_z / CHUNLK_LENGTH_Z);
    if (this.chunk[x][z]) {
      this.chunk[x][z].createObject(_x, _y, _z, type);
    }
  }

  findObject(_x, _y, _z) {
    var cx = Math.floor(_x / CHUNLK_LENGTH_X);
    var cz = Math.floor(_z / CHUNLK_LENGTH_Z);
    var x = Math.floor(_x);
    var y = Math.floor(_y);
    var z = Math.floor(_z);
    if (this.chunk[cx][cz]) {
      return this.chunk[cx][cz].findObject(x, y, z);
    }
    return null;
  }

  findItemById(id) {
    return this.items[id];
  }

  findItemByPos(_x, _y, _z) {
    for (var key in this.items) {
      var a = this.items[key].getMesh().position.x - _x;
      var b = this.items[key].getMesh().position.y - _y;
      var c = this.items[key].getMesh().position.z - _z;
      //.log("item", a * a + b * b + c * c);
      if (a * a + b * b + c * c < 2) {
        return this.items[key];
      }
    }
  }

  getMetaObject(id) {
    return this.metaObjects[id];
  }

  getStartPoint() {
    var player_x = Math.floor(CHUNLK_LENGTH_X * WORLD_WIDTH / 2);
    var player_y = CHUNLK_LENGTH_Y - 1;
    var player_z = Math.floor(CHUNLK_LENGTH_Z * WORLD_WIDTH / 2);
    var x = Math.floor(WORLD_WIDTH / 2);
    var z = Math.floor(WORLD_WIDTH / 2);
    for (var y = CHUNLK_LENGTH_Y - 1; y >= 0; y--) {
      if (this.chunk[x][z].findObject(player_x, y, player_z)) {
        player_y = y + 5;
        break;
      }
    }
    return { x: player_x, y: player_y, z: player_z };
  }
}