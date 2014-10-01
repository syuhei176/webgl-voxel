$(function(){
	function TerrainGenerator(_x_size,_y_size,_z_size) {
		var x_size = _x_size;
		var y_size = _y_size;
		var z_size = _z_size;
		var map = [];
		var gake = true;
		var param1 = x_size/2-10;
		for(var i=0;i < x_size;i++) {
			map[i] = [];
			for(var j=0;j < z_size;j++) {
				if(i > param1 && i < param1+5) {
					map[i][j] = Math.floor(y_size / 2 - 7);
				}else{
					map[i][j] = Math.floor(y_size / 2);
				}
			}
			param1 += Math.floor(Math.random()*2) - 1;
		}
		p(0,0,x_size,z_size, 48);
		for(var i=0;i < x_size;i++) {
			for(var j=0;j < z_size;j++) {
				map[i][j] = Math.floor(map[i][j]);
			}
		}
		function p(basex, basez, sizex, sizez, k) {
			var new_sizex = Math.floor(sizex / 2);
			var new_sizez = Math.floor(sizez / 2);
			map[basex+new_sizex-1][basez          ] = (map[basex][basez] + map[basex+sizex-1][basez])/2 + (Math.random()-0.45) * k;
			map[basex          ][basez+new_sizez-1] = (map[basex][basez] + map[basex][basez+sizez-1])/2 + (Math.random()-0.45) * k;
			map[basex+sizex-1  ][basez+new_sizez-1] = (map[basex+sizex-1][basez] + map[basex+sizex-1][basez+sizez-1])/2 + (Math.random()-0.45) * k;
			map[basex+new_sizex-1][basez+sizez-1] = (map[basex][basez+sizez-1] + map[basex+sizex-1][basez+sizez-1])/2 + (Math.random()-0.45) * k;
			/*
			var new_point = map[basex][basez] + map[basex+sizex-1][basez] + map[basex][basez+sizez-1] + map[basex+sizex-1][basez+sizez-1];
			new_point /= 4;
			new_point += (Math.random()-0.3) * k;
			map[basex+new_sizex-1][basez+new_sizez-1] = new_point;
			*/
			if(sizex <= 3) {
				return
			}
			p(basex          ,basez          ,new_sizex,new_sizez, k*0.59);
			p(basex+new_sizex,basez          ,new_sizex,new_sizez, k*0.58);
			p(basex          ,basez+new_sizez,new_sizex,new_sizez, k*0.4);
			p(basex+new_sizex,basez+new_sizez,new_sizex,new_sizez, k*0.58);
		}
		return {
			getMap : function() {
				return map;
			}
		}
	}
	window.TerrainGenerator = TerrainGenerator;
}())
