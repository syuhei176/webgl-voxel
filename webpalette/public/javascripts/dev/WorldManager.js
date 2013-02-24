$(function(){
	
	function RenderManager(_width, _height) {
		var width = _width;
		var height = _height;
		//レンダラーの作成
		var renderer = null;
		renderer = new THREE.WebGLRenderer({ antialias:true });
		renderer.setDepthTest(true);
		renderer.setSize(_width, _height);
		renderer.setClearColorHex(0xffffff, 1);
		document.body.appendChild(renderer.domElement);
		//シーンの作成
		var scene = new THREE.Scene();
		scene.fog = new THREE.Fog( 0xffffff, 1, 47 );
		//カメラの作成
		var camera = new THREE.PerspectiveCamera(100, _width / _height);
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
		return {
			addToScene : function(obj) {
				scene.add(obj);
			},
			removeFromScene : function(obj) {
				scene.remove(obj);
			},
			play : function() {
				function render() {
					for(var i = 0;i < listeners.length;i++) {
						listeners[i]();
					}
					requestAnimationFrame(render);
					renderer.render(scene, camera);
				};
				render();
			},
			camera:camera,
			scene:scene,
			addEnterFrameListener : function(l) {
				listeners.push(l);
			}
		}
	}
	
	function GameManager() {
		
	}
	function InputManager() {
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
			prevMousePos.x = mousePos.x;
			prevMousePos.y = mousePos.y;
			mousePos.x = (e.clientX / window.innerWidth ) *  2 - 1;
			mousePos.y = (e.clientY / window.innerHeight) * -2 + 1;
			if(prevMousePos.x != 0) {
				listeners["pointermove"]({mx:mousePos.x - prevMousePos.x, my:mousePos.y - prevMousePos.y});
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
	Chunk.CHUNLK_WIDTH = 32;
	Chunk.CHUNLK_HEIGHT = 32;
	function Chunk(x,z, _renderManager) {
		var pos = {
				x:x,
				z:z
		}
		var renderManager = _renderManager;
		var x_size = Chunk.CHUNLK_WIDTH;
		var z_size = Chunk.CHUNLK_HEIGHT;
		var y_size = 128;
		var mesh = null;
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
    		function search_surface_part(x,z) {
    			for(var y = y_size-1;y >= 0;y--) {
    				if(boxes[x][y][z] == null) {
    					if(x < x_size-1 && boxes[x+1][y][z]) {
    						var q1 = add_vertex([x+1,y,z]);
    						var q2 =add_vertex([x+1,y,z+1]);
    						var q3 =add_vertex([x+1,y+1,z+1]);
    						var q4 =add_vertex([x+1,y+1,z]);
    						result.faces.push([q1,q2,q3,q4]);
    						result.uvs.push([new THREE.Vector2(0,0),new THREE.Vector2(0,1),new THREE.Vector2(1,1),new THREE.Vector2(1,0)]);
    					}
    					if(x > 0 && boxes[x-1][y][z]) {
    						var q1 = add_vertex([x,y,z]);
    						var q2 =add_vertex([x,y+1,z]);
    						var q3 =add_vertex([x,y+1,z+1]);
    						var q4 =add_vertex([x,y,z+1]);
    						result.faces.push([q1,q2,q3,q4]);
    					}
    					if(y < y_size-1 && boxes[x][y+1][z]) {
    						var q1 = add_vertex([x, y+1,z]);
    						var q2 =add_vertex([x+1,y+1,z]);
    						var q3 =add_vertex([x+1,y+1,z+1]);
    						var q4 =add_vertex([x,  y+1,z+1]);
    						result.faces.push([q1,q2,q3,q4]);
    					}
    					if(y>0 && boxes[x][y-1][z]) {
    						var q1 = add_vertex([x,  y,z]);
    						var q2 = add_vertex([x,  y,z+1]);
    						var q3 = add_vertex([x+1,y,z+1]);
    						var q4 = add_vertex([x+1,y,z]);
    						result.faces.push([q1,q2,q3,q4]);
    					}
    					if(z < z_size-1 && boxes[x][y][z+1]) {
    						var q1 = add_vertex([x,  y,  z+1]);
    						var q2 = add_vertex([x,  y+1,z+1]);
    						var q3 = add_vertex([x+1,y+1,z+1]);
    						var q4 = add_vertex([x+1,y,  z+1]);
    						result.faces.push([q1,q2,q3,q4]);
    					}
    					if(z>0 && boxes[x][y][z-1]) {
    						var q1 = add_vertex([x,  y,  z]);
    						var q2 = add_vertex([x+1,y,  z]);
    						var q3 = add_vertex([x+1,y+1,z]);
    						var q4 = add_vertex([x,  y+1,z]);
    						result.faces.push([q1,q2,q3,q4]);
    					}
    				}
    			}
    		}
    	}
    	return {
    		init : function() {
    			boxes = [];
    	        for(var x = 0;x < x_size;x++) {
    	        	boxes[x] = [];
    		        for(var y = 0;y < y_size;y++) {
    		        	boxes[x][y] = [];
    			        for(var z = 0;z < z_size;z++) {
    			        	boxes[x][y][z] = null;
    			        	if(y <= 32) {
    				        	boxes[x][y][z] = true;
    			        	}
    			        }
    		        }
    	        }
	        	boxes[0][13][0] = true;
	        	boxes[0][13][1] = true;
	        	boxes[1][13][0] = true;
    		},
			refresh : function() {
				var geometry = new THREE.Geometry();
				var result = getMesherResult();
				//console.log(result);
				geometry.vertices.length = 0
				geometry.faces.length = 0
				for(var i=0;i < result.vertices.length;i++) {
					geometry.vertices.push(new THREE.Vector3(
							pos.x * x_size + result.vertices[i][0],
							result.vertices[i][1],
							pos.z * z_size +result.vertices[i][2]));
				}
				for(var i=0;i < result.faces.length;i++) {
				    geometry.faceVertexUvs[0].push([new THREE.Vector2(0,0),new THREE.Vector2(1,0),new THREE.Vector2(1,1),new THREE.Vector2(0,1)]);
					var q = result.faces[i];
					var f = new THREE.Face4(q[0], q[1], q[2], q[3]);
					f.color = new THREE.Color(0x000000);
					f.vertexColors = [f.color,f.color,f.color,f.color];
					geometry.faces.push(f);
				}
				
		        var material = new THREE.MeshBasicMaterial({
		            color: 0xffffff, ambient: 0xffffff,
		            specular: 0xcccccc, shininess:50, metal:true,
		            map: THREE.ImageUtils.loadTexture('/images/01.png') });
		        
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
    		findObject : function(_x, _y, _z) {
    			var x = _x - pos.x * x_size;
    			var y = _y;
    			var z = _z - pos.z * z_size;
    			if(x < 0 || y < 0 || z < 0) return null;
    			if(x >= x_size || y >= y_size || z >= z_size) return null;
    			return boxes[x][y][z];
    		},
			createObject : function(_x, _y, _z) {
    			var x = _x - pos.x * x_size;
    			var y = _y;
    			var z = _z - pos.z * z_size;
				if(boxes[x][y][z] == null) {
					boxes[x][y][z] = true;
				}else{
					
				}
				this.refresh();
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
				this.refresh();
			}
		}
	}
	function WorldManager() {
    	var renderManager = new RenderManager(640, 500);
		var x_size = 12;
		var z_size = 12;
		
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
				chunk[x][z] = (new Chunk(x,z, renderManager));
			}
		}
		var current_chunk = chunk[0][0];
		/*
		var current_chunk00 = chunk[0][0];
		var current_chunk01 = chunk[0][1];
		var current_chunk02 = chunk[0][2];
		var current_chunk10 = chunk[1][0];
		var current_chunk11 = chunk[1][1];
		var current_chunk12 = chunk[1][2];
		var current_chunk20 = chunk[2][0];
		var current_chunk21 = chunk[2][1];
		var current_chunk22 = chunk[2][2];
		*/
		var player = new Player(renderManager);
    	var inputManager = new InputManager();
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
			add : function(obj) {
		        if(obj.getClass() == "Object") {
		        	//既にboxesに入っている
		        }else if(obj.getClass() == "Item"){
		        	items[obj.getID()] = obj;
			        renderManager.addToScene(obj);
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
				var x = Math.floor(player.getPos().x / Chunk.CHUNLK_WIDTH);
				var z = Math.floor(player.getPos().z / Chunk.CHUNLK_HEIGHT);
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
				var x = Math.floor(player.getPos().x / Chunk.CHUNLK_WIDTH);
				var z = Math.floor(player.getPos().z / Chunk.CHUNLK_HEIGHT);
				var start_x = x - 1;
				var start_z = z - 1;
				var end_x = x + 1;
				var end_z = z + 1;
				if(start_x < 0) start_x = 0;
				if(start_z < 0) start_z = 0;
				for(var i=start_x;i <= end_x;i++) {
					for(var j=start_z;j <= end_z;j++) {
						chunk[i][j].refresh();
					}
				}
			},
			init : function() {
				player.setWorldManager(this);
				for(var x=0;x < x_size;x++) {
					for(var z=0;z < z_size;z++) {
						chunk[x][z].init();
					}
				}
				this.createMesh();
				this.refreshActiveChunk();
			},
			play : function() {
		        renderManager.play();
			},
			destroyObject : function(_x,_y,_z) {
				var x = Math.floor(_x / Chunk.CHUNLK_WIDTH);
				var z = Math.floor(_z / Chunk.CHUNLK_HEIGHT);
				if(chunk[x][z]) {
					chunk[x][z].destroyObject(_x, _y, _z);
				}
				//TODO: オブジェクトをアイテム化して床に落とす
	        	var item = metaItem.getInstance(renderManager);
	        	item.setPosition(_x+0.5, _y+0.5, _z+0.5);
	        	this.add(item);
			},
			createObject : function(x,y,z) {
				current_chunk.createObject(x, y, z);
			},
			findObject : function(_x, _y, _z) {
				var x = Math.floor(_x);
				var y = Math.floor(_y);
				var z = Math.floor(_z);
				return current_chunk.findObject(x, y, z);
			},
			findItemById : function(id) {
				return items[id];
			},
			findItemByPos : function(_x, _y, _z) {
				for(var key in items) {
					var a = items[key].getMesh().position.x - _x;
					var b = items[key].getMesh().position.y - _y;
					var c = items[key].getMesh().position.z - _z;
					console.log("item", a * a + b * b + c * c);
					if(a * a + b * b + c * c < 2) {
						return items[key];
					}
				}
			}
		}
	}
	
	function Player(_renderManager) {
		var renderManager = _renderManager;
		var worldManager;
		var camera = renderManager.camera;
		var pos = new THREE.Vector3(40, 35, 16);
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
		renderManager.addEnterFrameListener(function() {
			var below = worldManager.findObject(pos.x, pos.y-1, pos.z);
			//TODO: 下にブロックがなかったら下に落ちる
			if(below) {
				pos.y += 0.025;
			}else{
				pos.y -= 0.05;
				refreshCameraPosition();
			}
		});
		return {
			getPos : function() {
				return pos;
			},
			setWorldManager : function(_worldManager) {
				worldManager = _worldManager;
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
				$("#debug2").html("chunk x="+pos.x+",y="+pos.y+",z="+pos.z);
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
				pos.x += direction.z * -walkspeed;
				pos.z += direction.x * -walkspeed;
				//TODO: もし壁に当たったら、元に戻す
				//TODO: 下にブロックがなかったら下に落ちる
				refreshCameraPosition();
			},
			left : function() {
				pos.x += direction.z * walkspeed;
				pos.z += direction.x * walkspeed;
				//TODO: もし壁に当たったら、元に戻す
				//TODO: 下にブロックがなかったら下に落ちる
				refreshCameraPosition();
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
						worldManager.destroyObject(
								Math.floor(intersects[0].point.x - intersects[0].face.normal.x/4),
								Math.floor(intersects[0].point.y - intersects[0].face.normal.y/4),
								Math.floor(intersects[0].point.z - intersects[0].face.normal.z/4));
					}else{
						if(items > 0 && intersects[0].distance < 3) {
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
        var material = new THREE.MeshPhongMaterial({
            color: 0xffffff, ambient: 0xffffff,
            specular: 0xcccccc, shininess:50, metal:true,
            map: THREE.ImageUtils.loadTexture('/images/01.png') });
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