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
};

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
};

// Returns an action object containing a action type and added information based on the results of the look and/or find methods.
BouncingCritter.prototype.act = function(view) {
  if (view.look(this.direction) != " ")
    this.direction = view.find(" ") || "s";
  return {type: "move", direction: this.direction};
};

// Creates a wall object.
function Wall() {}

// Returns a element object which contains the meaning of the characters used in a map.
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
    if (critter.act && acted.indexOf(critter) == -1) {
      acted.push(critter);
      this.letAct(critter, vector);
    }
  }, this);
};

World.prototype.letAct = function(critter, vector) {
  var action = critter.act(new View(this, vector));
  if (action && action.type == "move") {
    var dest = this.checkDestination(action, vector);
    if (dest && this.grid.get(dest) == null) {
      this.grid.set(vector, null);
      this.grid.set(dest, critter);
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
	if (this.world.grid.isInside(target))
		return charFromElement(this.world.grid.get(target));
	else
		return "#";
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

// Returns a direction bases on the original direction + n times.
function dirPlus(dir, n) {
	var index = directionNames.indexOf(dir);
	return directionNames[(index + n) % 8];
}

// Returns a WallFollower object that moves alongside the wall of the given map.
function WallFollower() {
	this.dir = "s";
}

// The critter looks around its environment (clockwise) until it reaches open space and stops if it reaches its origin direction.
// Lets the critter move in a straight line or scan to the left if there is an object left-right behind it.
WallFollower.prototype.act = function(view) {
	var start = this.dir;
	if (view.look(dirPlus(this.dir, -3)) != " ")
		start = this.dir = dirPlus(this.dir, -2);
	while (view.look(this.direction) != " ") {
		this.dir = dirPlus(this.dir, 1);
		if (this.dir == start) 
			break;
	}
	return {type: "move", direction: this.dir};
};

// Returns a LifelikeWorld object which contains all the attributes and methods of a World object.
function LifelikeWorld(map, legend) {
	World.call(this, map, legend);
}

LifelikeWorld.prototype = Object.create(World.prototype);

var actionTypes = Object.create(null);

// Checks whether it returned an action, if there is a available handler function for the returned action 
// and if it returned true after calling it.
// If none of the above is true the critter loses energy and is destroyed if its energy level reaches zero or below.
LifelikeWorld.prototype.letAct = function(critter, vector) {
  var action = critter.act(new View(this, vector));
  var handled = action &&
    action.type in actionTypes &&
    actionTypes[action.type].call(this, critter, vector, action);
  if (!handled) {
    critter.energy -= 0.2;
    if (critter.energy <= 0)
      this.grid.set(vector, null);
  }
};

// The critter rises in energy level and returns true.
actionTypes.grow = function(critter) {
	critter.energy += 0.5;
	return true;
};

// Returns false if there is no destination, the critters energy level is lower than 1 
// and there is an object in the destination square.
// Otherwise it moves the critter to the destination square and lowers its energy level by 1.
actionTypes.move = function(critter, vector, action) {
	var dest = this.checkDestination(action, vector);
	if (dest == null || 
			critter.energy <= 1 || 
			this.grid.get(dest) != null)
		return false;
	critter.energy -= 1;
	this.grid.set(vector, null);
	this.grid.set(dest, critter);
	return true;
};

// Checks if the destination square isn't blank (null) and returns the given object that fills the destination in the atDest var.
// Afterwards the function returns false if atDest isn't true and the object that fills the square has zero energy.
// If true, it transfers the atDest energy level to the critter performing the function and sets the destination square to zero.
actionTypes.eat = function(critter, vector, action) {
	var dest = this.checkDestination(action, vector);
	var atDest = dest != null && this.grid.get(dest);
	if (!atDest || atDest.energy == null)
		return false;
	critter.energy += atDest.energy;
	this.grid.set(dest, null);
	return true;
}

// Creates and sets an infant critter if there is a destination,
// the critters energy level is more than twice the infant energy level
// and the destination is not filled by another element.
actionTypes.reproduce = function(critter, vector, action) {
	var baby = elementFromChar(this.legend, critter.originChar);
	var dest = this.checkDestination(action, vector);
	if (dest == null ||
			critter.energy <= 2 * baby.energy ||
			this.grid.get(dest) != null )
		return false;
	critter.energy -= 2 * baby.energy;
	this.grid.set(dest, baby);
	return true;
};

// Returns a Plant object.
function Plant() {
	this.energy = 3 + Math.random() * 4;
}

// Returns a reproduce action if its energy level is higher than 15 and a grow action if lower than 20.
Plant.prototype.act = function(view) {
	if (this.energy > 20) {
		var space = view.find(" ");
		if (space)
			return {type: "reproduce", direction: space};
	}
	if (this.energy < 20)
		return {type: "grow"};
};

function SmartPlantEater() {
	this.energy = 20;
	this.direction = "s";
}

// Performs different actions based on the outcome of the defined conditionals.
SmartPlantEater.prototype.act = function(view) {
	var space = view.find(" ");
	var plants = view.findAll("*");
	if (this.energy > 80 && space) // If the critter's energy level is beyond 80 and there is available space it reproduces.
		return {type: "reproduce", direction: space};
	if (plants.length > 1) { // If there are multiple plants nearby and the counter reaches 1 or more the critter eats.
		return {type: "eat", direction: randomElement(plants)};
	}
	if (view.look(this.direction) != " ")
		this.direction = space || "s";
	return {type: "move", direction: this.direction};
};

// Creates a Predator object.
function Predator() {
	this.energy = 70;
	this.direction = "s";
	this.totalFood = [];
}

// Performs different actions based on the outcome of the defined conditionals.
Predator.prototype.act = function(view) {
	var space = view.find(" ");
	var critters = view.findAll("O");
	if (this.energy > 75 && space)
		return {type: "reproduce", direction: space};
	if (critters.length >= 1)
		return {type: "eat", direction: randomElement(critters)};
	if (view.look(this.direction) != " ")
		this.direction = space || "s";
	return {type: "move", direction: this.direction};
};



// Sets the refresh state to a default of false.
var mapRefreshState = false;

// Calls the turn function on the world variable and sets the world html id to the corresponding largeValley variable.
function refreshMap() {
	world.turn();
	document.getElementById("world").innerHTML = world.toString()
	.replace(new RegExp("\\*", "g"), "🌳")
	.replace(new RegExp("@", "g"), "🐅")
	.replace(new RegExp("O", "g"), "🐃")
	.replace(new RegExp("#", "g"), "🗻")
	.replace(new RegExp(" ", "g"), "🌱");
}

// calls the refreshMap function by an interval of 200ms and sets the refrsh state to true if false.
function setMapInterval() {
	if (!mapRefreshState)
		setInterval(refreshMap, 500);
		mapRefreshState = true;
}

// Starts the world.
setMapInterval();

var world = new LifelikeWorld(
  ["####################################################",
   "#                 ####         ****              ###",
   "#   *  @  ##                 ########       OO    ##",
   "#   *    ##        O O                 ****       *#",
   "#       ##*                        ##########     *#",
   "#      ##***  *         ****                     **#",
   "#* **  #  *  ***      #########                  **#",
   "#* **  #      *               #   *              **#",
   "#     ##              #   O   #  ***          ######",
   "#*            @       #       #   *        O  #    #",
   "#*                    #  ######                 ** #",
   "###          ****          ***                  ** #",
   "#       O                        @         O       #",
   "#   *     ##  ##  ##  ##               ###      *  #",
   "#   **         #              *       #####  O     #",
   "##  **  O   O  #  #    ***  ***        ###      ** #",
   "###               #   *****                    ****#",
   "####################################################"],
  {"#": Wall,
   "@": Predator,
   "O": SmartPlantEater,
   "*": Plant}
);