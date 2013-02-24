var createGame = require('voxel-engine')
var texturePath = require('painterly-textures')(__dirname)
var game = createGame({texturePath: texturePath})
var container = document.body
game.appendTo(container)
game.setupPointerLock(container)