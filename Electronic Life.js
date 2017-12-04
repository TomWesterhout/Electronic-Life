// Contains an array representing the world map.
var plan = ["############################",
            "#      #    #      o      ##",
            "#                          #",
            "#          #####           #",
            "##         #   #    ##     #",
            "###           ##     #     #",
            "#           ###      #     #",
            "#   ####                   #",
            "#   ##       o             #",
            "# o  #         o       ### #",
            "#    #                     #",
            "############################"];

// Represents coordinates used for example when requesting a square from a grid.
function Vector(x, y) {
	this.x = x;
	this.y = y;
}
Vector.prototype.plus = function(other) {
	return new Vector(this.x + other.x, this.y + other.y);
};

// Creates a Grid object which contains getter and setter properties for requesting or setting a square value in the corresponding array.
function Grid(width, height) {
	this.space = new Array(width * height);
	this.width = width;
	this.height = height;
}

Grid.prototype.isInside = function(vector) {
	return vector.x >= 0 && vector.x < this.width &&
		vector.y >= 0 && vector.y < this.height;
};

Grid.prototype.get = function(vector) {
	return this.space[vector.x + this.width * vector.y];
};

Grid.prototype.set = function(vector, value) {
	this.space[vector.x + this.width * vector.y] = value;
};

Grid.prototype.forEach = function(f, context) {
	for (var y = 0; y < this.height; y++) {
		for (var x = 0; x < this.width; x++) {
			var value = this.space[x + y * this.width];
			if (value != null)
				f.call(context, value, new Vector(x, y));
		}
	}
}

// Returns a random element from an array.
function randomElement(array) {
	return array[Math.floor(Math.random() * array.length)];
};

var directions = {
	"n": 	new Vector( 0, -1),
	"ne": new Vector( 1, -1),
	"e": 	new Vector( 1,  0),
	"se": new Vector( 1,  1),
	"s": 	new Vector( 0,  1),
	"sw": new Vector(-1,  1),
	"w": 	new Vector(-1,  0),
	"nw": new Vector(-1, -1),
};

var directionNames = "n ne e se s sw w nw".split(" ");

// Creates a simple critter object.
function BouncingCritter() {
	this.direction = randomElement(directionNames);
}

// Creates a wall object.
function Wall() {}

// Returns an action object containing a action type and added information based on the results of the look and/or find methods.
BouncingCritter.prototype.act = function (view) {
	if (view.look(this.direction) != " ")
		this.direction = view.find(" ") || "s";
	return { type: "move", direction: this.direction };
};

// Returns a legend object which contains the meaning of the characters used in a map.
function elementFromChar(legend, ch) {
	if (ch == " ")
		return null;
	var element = new legend[ch]();
	element.originChar = ch;
	return element;
}

// Returns the actual char contained by the given element.
function charFromElement(element) {
	if (element == null)
		return " ";
	else
		return element.originChar;
}

// Returns a World object which contains a Grid object and sets the Grid's space array.
function World(map, legend) {
	var grid = new Grid(map[0].length, map.length);
	this.grid = grid;
	this.legend = legend;

	map.forEach(function(line, y) {
		for ( var x = 0; x < line.length; x++) {
			grid.set(new Vector(x, y), 
				elementFromChar(legend, line[x]));
		}
	});
}

// Creates a string out of the current Grid state.
World.prototype.toString = function() {
	var output = "";
	for (var y = 0; y < this.grid.height; y++) {
		for (var x = 0; x < this.grid.width; x++) {
			var element = this.grid.get(new Vector(x, y));
			output += charFromElement(element);
		}
		output += "\n";
	}
	return output;
}

World.prototype.turn = function() {
	var acted = [];
	this.grid.forEach(function(critter, vector) {
		if (critter.act && acted.indexOf(critter) == -1)
			acted.push(critter);
			this.letAct(critter, vector);
	}, this);
};

World.prototype.letAct = function(critter, vector) {
	var action = critter.act(new View(this, vector));
	if (action && action.type == "move") {
		var dest = this.checkDestination(action, vector)
		if (dest && this.grid.get(dest) == null) {
			this.grid.set(vector, null)
			this.grid.set(dest, critter)
		}
	}
};

World.prototype.checkDestination = function(action, vector) {
	if (directions.hasOwnProperty(action.direction)) {
		var dest = vector.plus(directions[action.direction]);
		if (this.grid.isInside(dest))
			return dest;
	}
};

// Creates a View object.
function View(world, vector) {
	this.world = world;
	this.vector = vector;
}

// Returns the actual char corresponding to the given direction and bases on the current critters' position or a wall character if non is found. 
View.prototype.look = function(dir) {
	var target = this.vector.plus(directions[dir]);
	if (this.world.grid.isInside(target)
		return charFromElement(this.world.grid.get(target));
	else
		;return "#";
}

// Returns all coordinates corresponding to the given char argument based on the current critters' position.
View.prototype.findAll = function(ch) {
	var found = [];
	for (var dir in directions) {
		if (this.look(dir) == ch)
			found.push(dir);
	}
	return found;
};

// Returns a random coordinate if multiple coordinates are found which match the given char argument or null if none are found.
View.prototype.find = function(ch) {
	var found = this.findAll(ch);
	if (found.length == 0)
		return null;
	return randomElement(found);
};


var world = new World(plan, { "#": Wall, "o": BouncingCritter });
console.log(world.toString());



