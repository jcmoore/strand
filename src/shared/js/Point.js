/**
 * @license
 * Copyright (c) 2015 MediaMath Inc. All rights reserved.
 * This code may only be used under the BSD style license found at http://mediamath.github.io/strand/LICENSE.txt

*/
function Point (x, y) {
	this.x = x;
	this.y = y;
}

Point.prototype = {

	add: function(point) {
		this.x += point.x;
		this.y += point.y;
		return this;
	},

	scale: function(scalar) {
		this.x *= scalar;
		this.y *= scalar;
		return this;
	},

	clone: function() {
		return new Point(this.x, this.y);
	}

};