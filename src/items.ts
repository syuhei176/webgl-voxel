export const META_ITEMS = {
  "1": {
    name: "pick",
    settable: false,
    destroy_tool: true
  },
  "2": {
    name: "草",
    settable: true,
    destroy_tool: false,
    boxid: 1
  },
  "3": {
    name: "土",
    settable: true,
    destroy_tool: false,
    boxid: 2
  },
  "4": {
    name: "",
    settable: true,
    destroy_tool: false,
    boxid: 3
  },
  "5": {
    name: "",
    settable: true,
    destroy_tool: false
  },
}

export function display2d(v) {
  $("#2d").html("<div>" + v + "</div>");
}