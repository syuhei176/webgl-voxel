import { RenderManager } from "./render_manager";

interface Listener {
  forward: () => void;
  right: () => void;
  left: () => void;
  back: () => void;
  stopforward: () => void;
  stopright: () => void;
  stopleft: () => void;
  stopback: () => void;
  jump: () => void;
  stopjump: () => void;
  selectitem: (e: any) => void;
  pointermove: (e: any) => void;
  pointerclick: () => void;
}

interface Position2D {
  x: number;
  y: number;
}

export class InputManager {
  listeners: Listener;
  mousePos: Position2D;
  prevMousePos: Position2D;

  constructor() {
    this.listeners = {
      forward: () => {},
      right: () => {},
      left: () => {},
      back: () => {},
      stopforward: () => {},
      stopright: () => {},
      stopleft: () => {},
      stopback: () => {},
      jump: () => {},
      stopjump: () => {},
      selectitem: (e: any) => {},
      pointermove: function (e: any) {},
      pointerclick: () => {},
    };

    this.mousePos = { x: 0, y: 0 };
    var prevMousePos = { x: 0, y: 0 };
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.code == "KeyW") {
          this.listeners["forward"]();
        }
        if (e.code == "KeyD") {
          this.listeners["right"]();
        }
        if (e.code == "KeyA") {
          this.listeners["left"]();
        }
        if (e.code == "KeyS") {
          this.listeners["back"]();
        }
        if (e.code == "Space") {
          this.listeners["jump"]();
        }

        const keyCode = Number(e.code.substring(5));

        if (keyCode >= 49 && keyCode <= 58) {
          this.listeners["selectitem"]({ number: keyCode - 49 });
        }
      },
      false,
    );

    window.addEventListener(
      "keyup",
      (e) => {
        if (e.code == "KeyW") {
          this.listeners["stopforward"]();
        }
        if (e.code == "KeyD") {
          this.listeners["stopright"]();
        }
        if (e.code == "KeyA") {
          this.listeners["stopleft"]();
        }
        if (e.code == "KeyS") {
          this.listeners["stopback"]();
        }
        if (e.code == "Space") {
          this.listeners["stopjump"]();
        }
      },
      false,
    );

    window.addEventListener(
      "mousemove",
      (e) => {
        var movementX = e.movementX || null,
          movementY = e.movementY || 0;
        if (movementX != null) {
          this.listeners["pointermove"]({
            mx: movementX / window.innerWidth,
            my: -movementY / window.innerHeight,
          });
        } else {
          prevMousePos.x = this.mousePos.x;
          prevMousePos.y = this.mousePos.y;
          this.mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
          this.mousePos.y = (e.clientY / window.innerHeight) * -2 + 1;
          if (prevMousePos.x != 0) {
            this.listeners["pointermove"]({
              mx: this.mousePos.x - prevMousePos.x,
              my: this.mousePos.y - prevMousePos.y,
            });
          }
        }
      },
      false,
    );

    window.addEventListener(
      "mousedown",
      (e) => {
        this.listeners["pointerclick"]();
      },
      false,
    );
  }

  set(event, cb) {
    this.listeners[event] = cb;
  }
  getMousePosition() {
    return this.mousePos;
  }

  getPrevMousePosition() {
    return this.prevMousePos;
  }
}
