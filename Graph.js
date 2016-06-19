function Node_Graph(){
	this.Node = function(position){
		if(position===undefined){
			this.position = new THREE.Vector3();
		}else{
			this.position = position;
		}
		this.connections = [];
	}
	this.nodes = [];
	this.connections = [];
	
	this.ripGeometry = function(geometry){
		//takes in a geometry and rips all the vertices from it to populate the graph
		for(var ii=0;ii<geometry.vertices.length;ii++){
			this.nodes.push(new this.Node(geometry.vertices[ii].clone()));
		}
	}
	
	this.sanatizeConnections = function(){
		//this removes duplicate connections
		
		for(var ii=0;ii<this.nodes.length;ii++){
			for(var jj=0;jj<this.nodes[ii].connections.length-1;jj++){
				for(var kk=jj+1;kk<this.nodes[ii].connections.length;kk++){
					if(this.nodes[ii].connections[jj]==this.nodes[ii].connections[kk]){
						this.nodes[ii].connections.splice(kk--,1);
					}
				}
			}
		}
	}
	
	this.resetConnections = function(){
		//this deletes all connections
		
		for(var ii=0;ii<this.nodes.length;ii++){
			this.nodes[ii].connections = [];
		}
	}
	
	this.populateBox = function(height, width, depth, count){
		//create uniformly distributed nodes in a box
		
		var h,w,d;
		while(count>0){
			count--;
			
			h = (Math.random()-.5)*height;
			w = (Math.random()-.5)*width;
			d = (Math.random()-.5)*depth;
			
			this.nodes.push(new this.Node(new THREE.Vector3(h,w,d)));
		}
	}
	
	this.populateDisk = function(radius,height,count){
		//create uniformly distributed nodes in a disk
		
		var r,t,x,y,h;
		while(count>0){
			count--;
			r = Math.sqrt(Math.random())
			t = Math.random()*2*Math.PI;
			
			x = Math.cos(t)*r*radius
			h = (Math.random()-.5)*height;
			y = Math.sin(t)*r*radius
			this.nodes.push(new this.Node(new THREE.Vector3(x,h,y)));
		}
	}
	
	this.generateMST = function(){
		//generate a minimum spanning tree across the node graph from prims algorythm
		
		//arrays for storing connected and unconnected nodes by index
		var connected = [0];
		var unconnected = [];
		var ii,jj,min_i,min_j,min_distance,test_distance;
	
		for(ii=1;ii<this.nodes.length;ii++){
			unconnected.push(ii);
		}
		
		//keep going until all nodes have been connected
		while(unconnected.length>0){
			
			//find the closest node pair between the unconnected and connected sets
			min_distance = this.nodes[0].position.distanceTo(this.nodes[unconnected[0]].position);
			min_i = 0;
			min_j = unconnected[0];
			for(ii = 0; ii<connected.length; ii++){
				for(jj = 0; jj<unconnected.length; jj++){
					test_distance = this.nodes[connected[ii]].position.distanceTo(this.nodes[unconnected[jj]].position);
					if(test_distance<min_distance){
						min_i = ii;
						min_j = jj;
						min_distance = test_distance;
					}
				}
			}
			
			//connect these two nodes
			this.nodes[connected[min_i]].connections.push(unconnected[min_j]);
			this.nodes[unconnected[min_j]].connections.push(connected[min_i]);
			
			//migrate the now connected node to our connected nodes array
			connected.push(unconnected[min_j]);
			unconnected.splice(min_j,1)
		}
	}

	this.generateBeta = function(beta){
		//generate a beta-skeleton for the node graph
		//similar to relative neighbor, but based off angles, not distances
		//if beta = 1 this produces a gabriel graph
		
		var theta;
		if(beta>1){
			theta = Math.asin(1/beta);
		}else{
			theta = Math.PI - Math.asin(beta);
		}
		var valid,a,b,angle;
		for(var ii=0;ii<this.nodes.length-1;ii++){
			for(var jj=ii+1;jj<this.nodes.length;jj++){
				valid = true;
				for(var kk=0;kk<this.nodes.length;kk++){
					a = this.nodes[kk].position.clone().sub(this.nodes[ii].position)
					b = this.nodes[kk].position.clone().sub(this.nodes[jj].position)
					angle = a.angleTo(b);
					if(angle>theta){
						valid = false;
						break;
					}
				}
				if(valid){
					this.nodes[ii].connections.push(jj);
					this.nodes[jj].connections.push(ii);
				}
			}
		}
	}
	
	this.generateRelativeNeighbor = function(){
		//for every node pair a-b, if no point c is closer to a and b, than b is to a
		//create a connection
		
		//there is a better way to do this, but I do not yet understand it
		var valid,distance;
		for(var ii=0;ii<this.nodes.length-1;ii++){
			for(var jj=ii+1;jj<this.nodes.length;jj++){
				valid = true;
				distance = this.nodes[jj].position.distanceTo(this.nodes[ii].position)
				for(var kk=0;kk<this.nodes.length;kk++){
					if(this.nodes[kk].position.distanceTo(this.nodes[ii].position)<distance){
						if(this.nodes[kk].position.distanceTo(this.nodes[jj].position)<distance){
							valid = false;
							break;
						}
					}
				}
				if(valid){
					this.nodes[ii].connections.push(jj);
					this.nodes[jj].connections.push(ii);
				}
			}
		}
	}
	
	this.generateNearestNeighbor = function(threshold){
		//connect all nodes closer than the threshold
		var ii,jj;
		for(ii = 0; ii<this.nodes.length-1; ii++){
			for(jj = ii+1; jj<this.nodes.length; jj++){
				if(this.nodes[ii].position.distanceTo(this.nodes[jj].position)<threshold){
					this.nodes[ii].connections.push(jj);
					this.nodes[jj].connections.push(ii);
				}
			}
		}
	}

	this.draw = function(){
		this.sanatizeConnections();
		
		var lines = new THREE.Object3D();
		var line_geo;
		for(var ii=0;ii<this.nodes.length;ii++){
			for(var jj=0;jj<this.nodes[ii].connections.length;jj++){
				line_geo = new THREE.Geometry();
				line_geo.vertices.push(
					this.nodes[ii].position,
					this.nodes[this.nodes[ii].connections[jj]].position
				)
				lines.add(new THREE.Line(line_geo))
			}
		}
		return lines;
	}
}