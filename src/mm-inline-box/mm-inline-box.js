/**
 * @license
 * Copyright (c) 2015 MediaMath Inc. All rights reserved.
 * This code may only be used under the BSD style license found at http://mediamath.github.io/strand/LICENSE.txt

*/
(function(scope) {

	scope.InlineBox = Polymer({
		is: 'mm-inline-box',
		LINE_HEIGHT: 18,

		iconMap: {
			info:    { type: "info" },
			success: { type: "success" },
			warning: { type: "warning" },
			error:   { type: "warning" }
		},

		properties: {
			type: {
				type: String,
				value: "info",
				reflectToAttribute: true
			},
			maxlines: {
				type: Number
			},
			icon: {
				type: Object,
				computed: 'getIconAttributes(type)'
			}
		},

		getContentStyle: function(maxlines) {
			var maxHeight = maxlines ? maxlines * this.LINE_HEIGHT + "px" : "none";
			return "max-height: " + maxHeight;
		},

		getIconAttributes: function(type) {
			return this.iconMap[type];
		}
	});

})(window.Strand = window.Strand || {});
