$(function(){
	WorldManager.WORLD_WIDTH = 16;
	Chunk.CHUNLK_LENGTH_X = 16;
	Chunk.CHUNLK_LENGTH_Y = 128;
	Chunk.CHUNLK_LENGTH_Z = 16;
	Chunk.TEXTURE_SIZE = 320;
	Chunk.TEXTURE_TIP_SIZE = 32;
	Chunk.TEXTURE_TIP_RATIO = Chunk.TEXTURE_TIP_SIZE / Chunk.TEXTURE_SIZE;

	function RenderManager(_width, _height) {
		var width = _width;
		var height = _height;
		//レンダラーの作成
		var renderer = null;
		renderer = new THREE.WebGLRenderer({ antialias:true });
		renderer.setDepthTest(true);
		renderer.setSize(_width, _height);
		renderer.setClearColorHex(0xffffff, 1);
		renderer.clear();
		document.body.appendChild(renderer.domElement);
		//シーンの作成
		var scene = new THREE.Scene();
		scene.fog = new THREE.Fog( 0xffffff, 1, Chunk.CHUNLK_LENGTH_X * 1.2 );
		//カメラの作成
		var camera = new THREE.PerspectiveCamera(90, _width / _height);
		camera.position = new THREE.Vector3(0, 0, 10);
		camera.lookAt(new THREE.Vector3(0, 0, 0));
		scene.add(camera);
		//ライトの作成
		var light = new THREE.DirectionalLight(0xcccccc);
		light.position = new THREE.Vector3(0.577, 0.577, 0.577);
		scene.add(light);
		var ambient = new THREE.AmbientLight(0x333333);
		scene.add(ambient);
		
		var listeners = [];
		var display_queue = [];
		return {
			enDisplayQueue : function(chunk) {
				//chunk.refresh();
				display_queue.push(chunk);
			},
			addToScene : function(obj) {
				scene.add(obj);
			},
			removeFromScene : function(obj) {
				scene.remove(obj);
			},
			play : function() {
				function render() {
					var c = display_queue.shift();
					if(c) {
						c.refresh();
					}
					//display_queue.length = 0;
					requestAnimationFrame(render);
					if(!c) renderer.render(scene, camera);
				};
				render();
			},
			camera:camera,
			scene:scene,
			renderer:renderer,
			addEnterFrameListener : function(l) {
				listeners.push(l);
			},
			blight : function(i) {
				renderer.setClearColorHex(i, 1);
			}
		}
	}
	
	function GameManager() {
		
	}
	function InputManager(RenderManager) {
		var listeners = {pointermove:function(){}};
		var mousePos = {x:0,y:0};
		var prevMousePos = {x:0,y:0};
		window.addEventListener("keydown", function(e){
			console.log(e.keyCode);
			if(e.keyCode == 87) {
				listeners["forward"]();
			}
			if(e.keyCode == 68) {
				listeners["right"]();
			}
			if(e.keyCode == 65) {
				listeners["left"]();
			}
			if(e.keyCode == 83) {
				listeners["back"]();
			}
			if(e.keyCode >= 49 && e.keyCode <= 58) {
				listeners["selectitem"]({number:e.keyCode - 49});
			}
		}, false);
		window.addEventListener("mousemove", function(e){
			if(true) {
				  var movementX = e.movementX       ||
                  e.mozMovementX    ||
                  e.webkitMovementX ||
                  0,
                  movementY = e.movementY       ||
                  e.mozMovementY    ||
                  e.webkitMovementY ||
                  0;
				  listeners["pointermove"]({mx:movementX/window.innerWidth, my:-movementY/window.innerHeight});
			}else{
				prevMousePos.x = mousePos.x;
				prevMousePos.y = mousePos.y;
				mousePos.x = (e.clientX / window.innerWidth ) *  2 - 1;
				mousePos.y = (e.clientY / window.innerHeight) * -2 + 1;
				if(prevMousePos.x != 0) {
					listeners["pointermove"]({mx:mousePos.x - prevMousePos.x, my:mousePos.y - prevMousePos.y});
				}
			}
		}, false);
		window.addEventListener("mousedown", function(e){
			listeners["pointerclick"]();
		}, false);
		return {
			set : function(event, cb) {
				listeners[event] = cb;
			},
			getMousePosition : function() {
				return mousePos;
			},
			getPrevMousePosition : function() {
				return prevMousePos;
			}
		}
	}
	function Chunk(x,z, _renderManager) {
		var pos = {
				x:x,
				z:z
		}
		var renderManager = _renderManager;
		var worldManager = null;
		var x_size = Chunk.CHUNLK_LENGTH_X;
		var z_size = Chunk.CHUNLK_LENGTH_Z;
		var y_size = Chunk.CHUNLK_LENGTH_Y;
		var mesh = null;
		var meshes = [];
		for(var i=0;i < Chunk.CHUNLK_LENGTH_X;i++) {
			meshes[i] = [];
			for(var j=0;j < Chunk.CHUNLK_LENGTH_Z;j++) {
				meshes[i][j] = null;
			}
		}
		function getMesh(x,z) {
			if(x < 0 || z < 0 || x >= Chunk.CHUNLK_LENGTH_X-1 || z >= Chunk.CHUNLK_LENGTH_Z-1) return null;
			return meshes[x][z];
		}
		var geometry = null;
		var boxes = null;
    	function getMesherResult() {
    		var result = {
    				vertices : [],
    				faces : [],
    				uvs : []
    		}
    		var vertex_map = {};
    		for(var x = 0;x < x_size;x++) {
        		for(var z = 0;z < z_size;z++) {
            		search_surface_part(x, z);
        		}
    		}
    		return result;
    		function add_vertex(v) {
				if(!vertex_map[v.join("-")]) {
					vertex_map[v.join("-")] = result.vertices.length;
					result.vertices.push(v);
				}
				return vertex_map[v.join("-")];
    		}
    		function get_uv(index) {
    			var u1 = new THREE.Vector2(index * Chunk.TEXTURE_TIP_RATIO,  0.9);
    			var u2 = new THREE.Vector2(index * Chunk.TEXTURE_TIP_RATIO,  1);
    			var u3 = new THREE.Vector2((index + 1) * Chunk.TEXTURE_TIP_RATIO,1);
    			var u4 = new THREE.Vector2((index + 1) * Chunk.TEXTURE_TIP_RATIO,0.9);
    			return [u1,u2,u3,u4];
    		}
    		function search_surface_part(x,z) {
    			for(var y = y_size-1;y >= 0;y--) {
    				if(boxes[x][y][z] == null) {
    					if(x < x_size-1 && boxes[x+1][y][z]) {
    						var q1 = add_vertex([x+1,y,z]);
    						var q2 =add_vertex([x+1,y,z+1]);
    						var q3 =add_vertex([x+1,y+1,z+1]);
    						var q4 =add_vertex([x+1,y+1,z]);
    						result.faces.push([q1,q2,q3,q4]);
    						result.uvs.push(get_uv(boxes[x+1][y][z]));
    					}else if(x == x_size-1){
    						var chunk1 = worldManager.getChunk(pos.x+1, pos.z);
    						if(chunk1) {
        						var box1 = chunk1.findObjectLocal(0, y, z);
        						if(box1) {
            						var q1 = add_vertex([x+1,y,z]);
            						var q2 =add_vertex([x+1,y,z+1]);
            						var q3 =add_vertex([x+1,y+1,z+1]);
            						var q4 =add_vertex([x+1,y+1,z]);
            						result.faces.push([q1,q2,q3,q4]);
            						result.uvs.push(get_uv(box1));
        						}
    						}
    					}
    					if(x > 0 && boxes[x-1][y][z]) {
    						var q1 = add_vertex([x,y,z]);
    						var q2 =add_vertex([x,y+1,z]);
    						var q3 =add_vertex([x,y+1,z+1]);
    						var q4 =add_vertex([x,y,z+1]);
    						result.faces.push([q1,q2,q3,q4]);
    						result.uvs.push(get_uv(boxes[x-1][y][z]));
    					}else if(x == 0){
    						var chunk1 = worldManager.getChunk(pos.x-1, pos.z);
    						if(chunk1) {
        						var box1 = chunk1.findObjectLocal(Chunk.CHUNLK_LENGTH_X-1, y, z);
        						if(box1) {
            						var q1 = add_vertex([x,y,z]);
            						var q2 =add_vertex([x,y+1,z]);
            						var q3 =add_vertex([x,y+1,z+1]);
            						var q4 =add_vertex([x,y,z+1]);
            						result.faces.push([q1,q2,q3,q4]);
            						result.uvs.push(get_uv(box1));
        						}
    						}
    					}
    					if(y < y_size-1 && boxes[x][y+1][z]) {
    						var q1 = add_vertex([x, y+1,z]);
    						var q2 =add_vertex([x+1,y+1,z]);
    						var q3 =add_vertex([x+1,y+1,z+1]);
    						var q4 =add_vertex([x,  y+1,z+1]);
    						result.faces.push([q1,q2,q3,q4]);
    						result.uvs.push(get_uv(boxes[x][y+1][z]));
    					}
    					if(y>0 && boxes[x][y-1][z]) {
    						var q1 = add_vertex([x,  y,z]);
    						var q2 = add_vertex([x,  y,z+1]);
    						var q3 = add_vertex([x+1,y,z+1]);
    						var q4 = add_vertex([x+1,y,z]);
    						result.faces.push([q1,q2,q3,q4]);
    						result.uvs.push(get_uv(boxes[x][y-1][z]));
    					}
    					if(z < z_size-1 && boxes[x][y][z+1]) {
    						var q1 = add_vertex([x,  y,  z+1]);
    						var q2 = add_vertex([x,  y+1,z+1]);
    						var q3 = add_vertex([x+1,y+1,z+1]);
    						var q4 = add_vertex([x+1,y,  z+1]);
    						result.faces.push([q1,q2,q3,q4]);
    						result.uvs.push(get_uv(boxes[x][y][z+1]));
    					}else if(z == z_size-1){
    						var chunk1 = worldManager.getChunk(pos.x, pos.z+1);
    						if(chunk1) {
        						var box1 = chunk1.findObjectLocal(x, y, 0);
        						if(box1) {
            						var q1 = add_vertex([x,  y,  z+1]);
            						var q2 = add_vertex([x,  y+1,z+1]);
            						var q3 = add_vertex([x+1,y+1,z+1]);
            						var q4 = add_vertex([x+1,y,  z+1]);
            						result.faces.push([q1,q2,q3,q4]);
            						result.uvs.push(get_uv(box1));
        						}
    						}
    					}
    					if(z>0 && boxes[x][y][z-1]) {
    						var q1 = add_vertex([x,  y,  z]);
    						var q2 = add_vertex([x+1,y,  z]);
    						var q3 = add_vertex([x+1,y+1,z]);
    						var q4 = add_vertex([x,  y+1,z]);
    						result.faces.push([q1,q2,q3,q4]);
    						result.uvs.push(get_uv(boxes[x][y][z-1]));
    					}else if(z == 0){
    						var chunk1 = worldManager.getChunk(pos.x, pos.z-1);
    						if(chunk1) {
        						var box1 = chunk1.findObjectLocal(x, y, Chunk.CHUNLK_LENGTH_Z-1);
        						if(box1) {
            						var q1 = add_vertex([x,  y,  z]);
            						var q2 = add_vertex([x+1,y,  z]);
            						var q3 = add_vertex([x+1,y+1,z]);
            						var q4 = add_vertex([x,  y+1,z]);
            						result.faces.push([q1,q2,q3,q4]);
            						result.uvs.push(get_uv(box1));
        						}
    						}
    					}
    				}
    			}
    		}
    	}
    	return {
    		init : function(_worldManager, terrain) {
    			worldManager = _worldManager;
    			boxes = [];
    	        for(var x = 0;x < x_size;x++) {
    	        	boxes[x] = [];
    		        for(var y = 0;y < y_size;y++) {
    		        	boxes[x][y] = [];
    			        for(var z = 0;z < z_size;z++) {
    			        	boxes[x][y][z] = null;
    			        }
    		        }
    	        }
    	        for(var x = 0;x < x_size;x++) {
			        for(var z = 0;z < z_size;z++) {
			        	var hpoint = terrain[pos.x*Chunk.CHUNLK_LENGTH_X+x][pos.z*Chunk.CHUNLK_LENGTH_Z+z];
	    		        for(var y = 0;y < y_size;y++) {
	    		        	if(hpoint > y) {
	    		        		var r = Math.random() * 10;
	    		        		if(this.get_numofbox(x,y,z,5,1)) {
	    		        			if(r < 3) boxes[x][y][z] = 5;
	    		        			else boxes[x][y][z] = 2;
	    		        		}else{
	    		        			if(r <= 0.01){
	    		        				boxes[x][y][z] = 5;
	    		        			}else boxes[x][y][z] = 2;
	    		        		}
	    		        	}else if(hpoint == y) {
	    		        		if(Math.random() * 10 <= 1) {
		    		        		boxes[x][y][z] = 2;
	    		        		}else{
		    		        		boxes[x][y][z] = 1;
	    		        		}
	    		        	}else{
	    		        		boxes[x][y][z] = null;
	    		        	}
	    		        }
			        }
    	        }
    		},
			refresh : function() {
				geometry = new THREE.Geometry();
				geometry.dynamic = true;
				var result = getMesherResult();
				
				geometry.vertices.length = 0
				geometry.faces.length = 0
				for(var i=0;i < result.vertices.length;i++) {
					geometry.vertices.push(new THREE.Vector3(
							pos.x * x_size + result.vertices[i][0],
							result.vertices[i][1],
							pos.z * z_size +result.vertices[i][2]));
				}
				for(var i=0;i < result.faces.length;i++) {
				    geometry.faceVertexUvs[0].push(result.uvs[i]);
					var q = result.faces[i];
					var f = new THREE.Face4(q[0], q[1], q[2], q[3]);
					f.color = new THREE.Color(0x000000);
					f.vertexColors = [f.color,f.color,f.color,f.color];
					geometry.faces.push(f);
				}
				
		        var material = new THREE.MeshBasicMaterial({
		            color: 0xffffff, ambient: 0xffffff,
		            specular: 0xcccccc, shininess:50, metal:true,
		            map: THREE.ImageUtils.loadTexture('/images/texture.png') });
		        
		        geometry.computeFaceNormals()
		        
		        geometry.verticesNeedUpdate = true
		        geometry.elementsNeedUpdate = true
		        geometry.normalsNeedUpdate = true
		        
		        geometry.computeBoundingBox()
		        geometry.computeBoundingSphere()
		        
				if(mesh) renderManager.removeFromScene(mesh)
				mesh = new THREE.Mesh(geometry, material);
		        mesh.doubleSided = false
		        renderManager.addToScene(mesh);
			},
			getPos : function() {
				return pos;
			},
    		findObjectLocal : function(_x, _y, _z) {
    			var x = _x;
    			var y = _y;
    			var z = _z;
    			if(x < 0 || y < 0 || z < 0) return null;
    			if(x >= x_size || y >= y_size || z >= z_size) return null;
    			return boxes[x][y][z];
    		},
    		findObject : function(_x, _y, _z) {
    			var x = _x - pos.x * x_size;
    			var y = _y;
    			var z = _z - pos.z * z_size;
    			if(x < 0 || y < 0 || z < 0) return null;
    			if(x >= x_size || y >= y_size || z >= z_size) return null;
    			return boxes[x][y][z];
    		},
			createObject : function(_x, _y, _z, type) {
    			var x = _x - pos.x * x_size;
    			var y = _y;
    			var z = _z - pos.z * z_size;
				if(boxes[x][y][z] == null) {
					boxes[x][y][z] = type;
				}else{
					
				}
				renderManager.enDisplayQueue(this);
				//this.refresh();
			},
			destroyObject : function(_x, _y, _z) {
    			var x = _x - pos.x * x_size;
    			var y = _y;
    			var z = _z - pos.z * z_size;
    			console.log("destroy", x, y, z);
    			if(x < 0 || y < 0 || z < 0) return null;
    			if(x >= x_size || y >= y_size || z >= z_size) return null;
				if(boxes[x][y][z]) {
					boxes[x][y][z] = null;
				}
				var chunk = [];
				if(x == 0) chunk.push(worldManager.getChunk(pos.x-1, pos.z));
				if(x == x_size-1) chunk.push(worldManager.getChunk(pos.x+1, pos.z));
				if(z == 0) chunk.push(worldManager.getChunk(pos.x, pos.z-1));
				if(z == z_size-1) chunk.push(worldManager.getChunk(pos.x, pos.z+1));
				for(var i=0;i < chunk.length;i++) {
					//chunk[i].refresh();
					renderManager.enDisplayQueue(chunk[i]);
				}
				renderManager.enDisplayQueue(this);
				//this.refresh();
			},
			get_numofbox : function(x,y,z,type,range) {
				var num = 0;
				var sx = x-range;
				var sy = y-range;
				var sz = z-range;
				var ex = x+range;
				var ey = y+range;
				var ez = z+range;
				if(sx < 0) sx = 0;
				if(sy < 0) sy = 0;
				if(sz < 0) sz = 0;
				if(ex > Chunk.CHUNLK_LENGTH_X-1) ex = Chunk.CHUNLK_LENGTH_X-1;
				if(ey > Chunk.CHUNLK_LENGTH_Y-1) ey = Chunk.CHUNLK_LENGTH_Y-1;
				if(ez > Chunk.CHUNLK_LENGTH_Z-1) ez = Chunk.CHUNLK_LENGTH_Z-1;
				for(var xx=sx;xx<=ex;xx++) {
					for(var yy=sy;yy<=ey;yy++) {
						for(var zz=sz;zz<=ez;zz++) {
							if(boxes[xx][yy][zz] == type) num++;
						}
					}
				}
				return num;
			},
			enterFrame : function() {
				return;
				var self = this;
	    		for(var x = 0;x < x_size;x++) {
	        		for(var z = 0;z < z_size;z++) {
	        			search_soil(x, z);
	        		}
	    		}
	    		function search_soil(x, z) {
	    			for(var y = y_size-1;y >= 0;y--) {
	    				if(boxes[x][y][z] == 2) {
	    					//soil
	    					if(Math.random()*10 < 3 && self.get_numofbox(x,y,z,3,2) < 1) {
		    					boxes[x][y+1][z] = 3;
	    						self.refresh();
	    					}else{
		    					boxes[x][y+1][z] = 1;
	    						self.refresh();
	    					}
	    					return;
	    				}else if(boxes[x][y][z] == 3) {
	    					if(boxes[x][y-1][z] == 3 && boxes[x][y-2][z] == 3) {
	    						boxes[x][y+1][z] = 4;
	    						boxes[x+1][y+1][z] = 4;
	    						boxes[x-1][y+1][z] = 4;
	    						boxes[x][y+1][z+1] = 4;
	    						boxes[x][y+1][z-1] = 4;
	    						boxes[x+1][y+1][z+1] = 4;
	    						boxes[x-1][y+1][z+1] = 4;
	    						boxes[x+1][y+1][z-1] = 4;
	    						boxes[x-1][y+1][z-1] = 4;
	    					}else{
		    					boxes[x][y+1][z] = 3;
	    					}
	    					self.refresh();
	    					return;
	    				}
	    				if(boxes[x][y][z] != null) return;
	    			}
	    		}
			}
		}
	}
	function WorldManager() {
    	var renderManager = new RenderManager(window.innerWidth, window.innerHeight);
		var x_size = WorldManager.WORLD_WIDTH;
		var z_size = WorldManager.WORLD_WIDTH;
		
		//current chunk mesh
		var mesh = null;
		var boxes = [];
		var items = {};
		var render_pos = null;
		var metaObject = new MetaObject();
		var metaItem = new MetaItem();
		var chunk = [];
		for(var x=0;x < x_size;x++) {
			chunk[x] = [];
			for(var z=0;z < z_size;z++) {
				chunk[x][z] = new Chunk(x,z, renderManager);
			}
		}
    	setInterval(function(){
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
    		*/
    		$("#time").html(hour + "時");
    		
    		if(g_time % 10 == 0) {
    			current_chunk.enterFrame();
    		}
    	}, 1000);
		var current_chunk = chunk[0][0];
		var player = new Player(renderManager);
    	var inputManager = new InputManager(renderManager);
    	inputManager.set("forward", function(){
    		player.forward();
    	});
    	inputManager.set("back", function(){
    		player.backward();
    	});
    	inputManager.set("right", function(){
    		player.right();
    	});
    	inputManager.set("left", function(){
    		player.left();
    	});
    	inputManager.set("pointermove", function(e){
    		player.changeDirection(e.mx, e.my);
    	});
    	inputManager.set("pointerclick", function(e){
    		player.useitem();
    	});
    	inputManager.set("selectitem", function(e){
    		player.selectItem(e.number);
    	});
		return {
			getChunk : function(x, z) {
				if(x < 0 || z < 0 || x >= WorldManager.WORLD_WIDTH || z >= WorldManager.WORLD_WIDTH) return null;
				return chunk[x][z];
			},
			add : function(obj) {
		        if(obj.getClass() == "Object") {
		        	//既にboxesに入っている
		        }else if(obj.getClass() == "Item"){
		        	items[obj.getID()] = obj;
			        renderManager.addToScene(obj.getMesh());
		        }
			},
			remove : function(obj) {
		        if(obj.getClass() == "Object") {
		        	//既にboxesに入っている
		        }else if(obj.getClass() == "Item"){
			        renderManager.removeFromScene(obj.getMesh());
		        	delete items[obj.getID()];
		        }
			},
			refreshActiveChunk : function() {
				var x = Math.floor(player.getPos().x / Chunk.CHUNLK_LENGTH_X);
				var z = Math.floor(player.getPos().z / Chunk.CHUNLK_LENGTH_Z);
				if(current_chunk != chunk[x][z] && chunk[x][z]) {
					current_chunk = chunk[x][z];
					this.createMesh();
				}
				$("#debug1").html("chunk x="+x+",z="+z);
				return;
			},
			refreshCurrentChunk : function(pos, direction) {
				current_chunk.refresh();
				return;
			},
			createMesh : function() {
				var x = Math.floor(player.getPos().x / Chunk.CHUNLK_LENGTH_X);
				var z = Math.floor(player.getPos().z / Chunk.CHUNLK_LENGTH_Z);
				var start_x = x - 1;
				var start_z = z - 1;
				var end_x = x + 1;
				var end_z = z + 1;
				if(start_x < 0) start_x = 0;
				if(start_z < 0) start_z = 0;
				for(var i=start_x;i <= end_x;i++) {
					for(var j=start_z;j <= end_z;j++) {
						renderManager.enDisplayQueue(chunk[i][j]);
					}
				}
			},
			init : function() {
	        	var terraingen = new TerrainGenerator(Chunk.CHUNLK_LENGTH_X*WorldManager.WORLD_WIDTH, Chunk.CHUNLK_LENGTH_Y, Chunk.CHUNLK_LENGTH_Z*WorldManager.WORLD_WIDTH);
	        	var terrain = terraingen.getMap();
				for(var x=0;x < x_size;x++) {
					for(var z=0;z < z_size;z++) {
						chunk[x][z].init(this, terrain);
					}
				}
				this.createMesh();
				this.refreshActiveChunk();
				player.initPlayer(this);
			},
			play : function() {
		        renderManager.play();
			},
			destroyObject : function(_x,_y,_z) {
				var x = Math.floor(_x / Chunk.CHUNLK_LENGTH_X);
				var z = Math.floor(_z / Chunk.CHUNLK_LENGTH_Z);
				if(chunk[x][z]) {
					chunk[x][z].destroyObject(_x, _y, _z);
				}
				//TODO: オブジェクトをアイテム化して床に落とす
	        	var item = metaItem.getInstance(renderManager);
	        	item.setPosition(_x+0.5, _y+0.5, _z+0.5);
	        	this.add(item);
			},
			createObject : function(_x,_y,_z) {
				var x = Math.floor(_x / Chunk.CHUNLK_LENGTH_X);
				var z = Math.floor(_z / Chunk.CHUNLK_LENGTH_Z);
				if(chunk[x][z]) {
					chunk[x][z].createObject(_x, _y, _z, 2);
				}
			},
			findObject : function(_x, _y, _z) {
				var cx = Math.floor(_x / Chunk.CHUNLK_LENGTH_X);
				var cz = Math.floor(_z / Chunk.CHUNLK_LENGTH_Z);
				var x = Math.floor(_x);
				var y = Math.floor(_y);
				var z = Math.floor(_z);
				if(chunk[cx][cz]) {
					return chunk[cx][cz].findObject(x, y, z);
				}
				return null;
			},
			findItemById : function(id) {
				return items[id];
			},
			findItemByPos : function(_x, _y, _z) {
				for(var key in items) {
					var a = items[key].getMesh().position.x - _x;
					var b = items[key].getMesh().position.y - _y;
					var c = items[key].getMesh().position.z - _z;
					//.log("item", a * a + b * b + c * c);
					if(a * a + b * b + c * c < 2) {
						return items[key];
					}
				}
			},
			getStartPoint : function() {
				var player_x = Math.floor(Chunk.CHUNLK_LENGTH_X * WorldManager.WORLD_WIDTH / 2);
				var player_y = Chunk.CHUNLK_LENGTH_Y-1;
				var player_z = Math.floor(Chunk.CHUNLK_LENGTH_Z * WorldManager.WORLD_WIDTH / 2);
				var x = Math.floor(WorldManager.WORLD_WIDTH / 2);
				var z = Math.floor(WorldManager.WORLD_WIDTH / 2);
    			for(var y = Chunk.CHUNLK_LENGTH_Y-1;y >= 0;y--) {
    				if(chunk[x][z].findObject(player_x, y, player_z)) {
    					player_y = y+5;
    					break;
    				}
    			}
				return {x:player_x,y:player_y,z:player_z};
			}
		}
	}
	
	function Player(_renderManager) {
		var renderManager = _renderManager;
		var worldManager;
		var camera = renderManager.camera;
		var pos = new THREE.Vector3(
				Math.floor(Chunk.CHUNLK_LENGTH_X * WorldManager.WORLD_WIDTH / 2),
				Math.floor(Chunk.CHUNLK_LENGTH_Y - 30),
				Math.floor(Chunk.CHUNLK_LENGTH_Z * WorldManager.WORLD_WIDTH / 2)
				);
		var direction = new THREE.Vector3(0, 0, -1);
		var walkspeed = 0.2;
		var selectedItem = 0;
		var items = 2;
		refreshCameraPosition();
		function refreshCameraPosition() {
			camera.position.setX(pos.x);
			camera.position.setY(pos.y + 0.5);
			camera.position.setZ(pos.z);
			var p = new THREE.Vector3(pos.x, pos.y + 0.5, pos.z);
			p.add(direction);
			camera.lookAt(p);
		}
    	setInterval(function(){
			var below = worldManager.findObject(pos.x, pos.y-1, pos.z);
			//TODO: 下にブロックがなかったら下に落ちる
			if(below) {
				pos.y += 0.025;
			}else{
				pos.y -= 0.05;
				refreshCameraPosition();
			}
    	}, 1000/60);
		renderManager.addEnterFrameListener(function() {
		});
		return {
			getPos : function() {
				return pos;
			},
			initPlayer : function(_worldManager) {
				worldManager = _worldManager;
				var p = worldManager.getStartPoint();
				pos.x = p.x;
				pos.y = p.y;
				pos.z = p.z;
			},
			forward : function() {
				pos.x += direction.x * walkspeed;
				pos.z += direction.z * walkspeed;
				if(pos.x < 0.5) pos.x = 0.5;
				if(pos.z < 0.5) pos.z = 0.5;
				//もし壁に当たったら、元に戻す
				var coll = worldManager.findObject(pos.x, pos.y, pos.z);
				if(coll) {
					pos.x -= direction.x * walkspeed;
					pos.z -= direction.z * walkspeed;
				}
				refreshCameraPosition();
				var item = worldManager.findItemByPos(pos.x, pos.y, pos.z);
				if(item) {
					worldManager.remove(item);
					items++;
				}
				$("#debug2").html("chunk x="+Math.floor(pos.x)+",y="+Math.floor(pos.y)+",z="+Math.floor(pos.z));
				worldManager.refreshActiveChunk();
			},
			backward : function() {
				pos.x += direction.x * -walkspeed;
				pos.z += direction.z * -walkspeed;
				//もし壁に当たったら、元に戻す
				var coll = worldManager.findObject(pos.x, pos.y, pos.z);
				if(coll) {
					pos.x -= direction.x * -walkspeed;
					pos.z -= direction.z * -walkspeed;
				}
				refreshCameraPosition();
				worldManager.refreshActiveChunk();
			},
			right : function() {
				pos.x += -direction.z * walkspeed;
				pos.z += direction.x * walkspeed;
				//もし壁に当たったら、元に戻す
				var coll = worldManager.findObject(pos.x, pos.y, pos.z);
				if(coll) {
					pos.x += -direction.z * -walkspeed;
					pos.z += direction.x * -walkspeed;
				}
				refreshCameraPosition();
				worldManager.refreshActiveChunk();
			},
			left : function() {
				pos.x += direction.z * walkspeed;
				pos.z += -direction.x * walkspeed;
				//もし壁に当たったら、元に戻す
				var coll = worldManager.findObject(pos.x, pos.y, pos.z);
				if(coll) {
					pos.x += direction.z * -walkspeed;
					pos.z += -direction.x * -walkspeed;
				}
				refreshCameraPosition();
				worldManager.refreshActiveChunk();
			},
			changeDirection : function(mx, my) {
				var th = ((mx > 0)?1:-1) * Math.abs(mx) * 320;
				//console.log(th);
				var dx = direction.x * Math.cos(th / 180 * Math.PI) - direction.z * Math.sin(th / 180 * Math.PI);
				var dz = direction.x * Math.sin(th / 180 * Math.PI) + direction.z * Math.cos(th / 180 * Math.PI);
				direction.setX(dx);
				direction.setZ(dz);
				direction.setY(direction.y + my * 2);
				direction.normalize();
				refreshCameraPosition();
				/*
				var projector = new THREE.Projector();
				var ray = projector.pickingRay(new THREE.Vector3(0, 0, -1), camera);
				var intersects = ray.intersectObjects(renderManager.scene.children);
				if(intersects.length > 0) {
					
				}
				*/				
			},
			useitem : function() {
				console.log("use item");
				var projector = new THREE.Projector();
				var ray = projector.pickingRay(new THREE.Vector3(0, 0, -1), camera);
				var intersects = ray.intersectObjects(renderManager.scene.children);
				
				if(intersects.length > 0) {
					console.log(intersects[0]);
					if(selectedItem == 0) {
						if(intersects[0].distance < 4) {
							worldManager.destroyObject(
									Math.floor(intersects[0].point.x - intersects[0].face.normal.x/4),
									Math.floor(intersects[0].point.y - intersects[0].face.normal.y/4),
									Math.floor(intersects[0].point.z - intersects[0].face.normal.z/4));
						}
					}else{
						if(items > 0 && intersects[0].distance < 4) {
							items--;
							console.log(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z);
							console.log(intersects[0].face.normal.x/4,intersects[0].face.normal.y/4,intersects[0].face.normal.z/4)
							worldManager.createObject(
									Math.floor(intersects[0].point.x + intersects[0].face.normal.x/4),
									Math.floor(intersects[0].point.y + intersects[0].face.normal.y/4),
									Math.floor(intersects[0].point.z + intersects[0].face.normal.z/4));
						}
					}
				} else {
					//intersects[0].object.material.emissive = new THREE.Color(0);
				}
			},
			selectItem : function(i) {
				selectedItem = i;
			}
		}
	}
	
	function InstanceOfMetaObject(_renderManager, geometry, material) {
		var id = "i";//+new Date().getTime().toString(36);
		var mesh = null;
		var renderManager = _renderManager;
		/*
        mesh = new THREE.Mesh(geometry, material);
        mesh.rot = new THREE.Vector3(0,0,0);
        */
		return {
			getID : function() {
				return id;
			},
			getClass : function() {
				return "Object";
			},
			getMesh : function() {
				return mesh;
			},
			setPosition : function(x, y, z) {
		        //mesh.position = new THREE.Vector3(x,y,z);
			},
			destroy : function() {
				//renderManager.scene.remove(mesh);
			}
		}
	}
	function MetaObject() {
    	var geometry = new THREE.CubeGeometry(1, 1, 1);
        var material = new THREE.MeshPhongMaterial({
            color: 0xffffff, ambient: 0xffffff,
            specular: 0xcccccc, shininess:50, metal:true,
            map: THREE.ImageUtils.loadTexture('/images/01.png') });
		var shape = "";
		return {
			getInstance : function(renderManager) {
				return new InstanceOfMetaObject(renderManager, geometry, material);
			}
		}
	}
	
	function InstanceOfMetaItem(_renderManager, geometry, material) {
		var id = "i"+new Date().getTime().toString(36);
		var mesh = null;
		var renderManager = _renderManager;
        mesh = new THREE.Mesh(geometry, material);
        mesh.rot = new THREE.Vector3(0,30/180*Math.PI,0);
		return {
			getID : function() {
				return id;
			},
			getClass : function() {
				return "Item";
			},
			getMesh : function() {
				return mesh;
			},
			setPosition : function(x, y, z) {
		        mesh.position = new THREE.Vector3(x,y,z);
			},
			destroy : function() {
				renderManager.scene.remove(mesh);
			}
		}
	}
	function MetaItem() {
    	var geometry = new THREE.CubeGeometry(0.2, 0.2, 0.2);
        var material = new THREE.MeshBasicMaterial({
            color: 0xffffff, ambient: 0xffffff,
            specular: 0xcccccc, shininess:50, metal:true,
            map: THREE.ImageUtils.loadTexture('/images/texture.png') });
        var shape = "";
		return {
			getInstance : function(renderManager) {
				return new InstanceOfMetaItem(renderManager, geometry, material);
			}
		}
	}
	
	function MetaCreature() {
		
	}
	
	window.RenderManager = RenderManager;
	window.InputManager = InputManager;
	window.WorldManager = WorldManager;
}());