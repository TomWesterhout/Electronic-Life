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

// Returns a random element from an array.
function randomElement(array) {
	return array[Math.floor(Math.random() * array.length)];
};

var directionNames = "n ne e se s sw w nw".split(" ");

// Creates a simple critter object.
function BouncingCritter() {
	this.direction = randomElement(directionNames);
}

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

// Returns a World object which contains a Grid object and sets the Grid's space array.
function World(map, legend) {
	var grid = new Grid(map[0].length, map.length);
	this.grid = grid;
	this.legend = legend;


}







