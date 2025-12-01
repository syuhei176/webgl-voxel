export class TerrainGenerator {
  x_size: number
  y_size: number
  z_size: number
  map: number[][]

  constructor(_x_size: number, _y_size: number, _z_size: number) {
    this.x_size = _x_size
    this.y_size = _y_size
    this.z_size = _z_size

    this.map = [];
    var gake = true;
    var param1 = this.x_size / 2 - 10;
    for (var i = 0; i < this.x_size; i++) {
      this.map[i] = [];
      for (var j = 0; j < this.z_size; j++) {
        if (i > param1 && i < param1 + 5) {
          this.map[i][j] = Math.floor(this.y_size / 2 - 7);
        } else {
          this.map[i][j] = Math.floor(this.y_size / 2);
        }
      }
      param1 += Math.floor(Math.random() * 2) - 1;
    }
    this.p(0, 0, this.x_size, this.z_size, 48);
    for (var i = 0; i < this.x_size; i++) {
      for (var j = 0; j < this.z_size; j++) {
        this.map[i][j] = Math.floor(this.map[i][j]);
      }
    }

  }

  p(basex: number, basez: number, sizex: number, sizez: number, k: number) {
    var new_sizex = Math.floor(sizex / 2);
    var new_sizez = Math.floor(sizez / 2);
    this.map[basex + new_sizex - 1][basez] = (this.map[basex][basez] + this.map[basex + sizex - 1][basez]) / 2 + (Math.random() - 0.45) * k;
    this.map[basex][basez + new_sizez - 1] = (this.map[basex][basez] + this.map[basex][basez + sizez - 1]) / 2 + (Math.random() - 0.45) * k;
    this.map[basex + sizex - 1][basez + new_sizez - 1] = (this.map[basex + sizex - 1][basez] + this.map[basex + sizex - 1][basez + sizez - 1]) / 2 + (Math.random() - 0.45) * k;
    this.map[basex + new_sizex - 1][basez + sizez - 1] = (this.map[basex][basez + sizez - 1] + this.map[basex + sizex - 1][basez + sizez - 1]) / 2 + (Math.random() - 0.45) * k;
    /*
    var new_point = map[basex][basez] + map[basex+sizex-1][basez] + map[basex][basez+sizez-1] + map[basex+sizex-1][basez+sizez-1];
    new_point /= 4;
    new_point += (Math.random()-0.3) * k;
    map[basex+new_sizex-1][basez+new_sizez-1] = new_point;
    */
    if (sizex <= 3) {
      return
    }
    this.p(basex, basez, new_sizex, new_sizez, k * 0.59);
    this.p(basex + new_sizex, basez, new_sizex, new_sizez, k * 0.58);
    this.p(basex, basez + new_sizez, new_sizex, new_sizez, k * 0.4);
    this.p(basex + new_sizex, basez + new_sizez, new_sizex, new_sizez, k * 0.58);
  }


  getMap() {
    return this.map;
  }

}