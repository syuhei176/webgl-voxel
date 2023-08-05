import { InstanceOfMetaObject } from "./InstanceOfMetaObject";
import { RenderManager } from "./RenderManager";


interface MetaObjectOption {
  is_light: boolean
  brightness: number
}

export class MetaObject {
  tip_no: number
  is_light: boolean = false
  brightness: number

  constructor(_tip_no: number, option?: MetaObjectOption) {
    this.tip_no = _tip_no

    var brightness = 0;
    if (option && option.is_light) {
      this.is_light = true
      this.brightness = option.brightness;
    }
  }

  getInstance(renderManager: RenderManager) {
    return new InstanceOfMetaObject(renderManager);
  }

  getTipNo() {
    return this.tip_no;
  }

  isLight() {
    return this.is_light;
  }

}