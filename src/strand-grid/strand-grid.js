/**
 * @license
 * Copyright (c) 2015 MediaMath Inc. All rights reserved.
 * This code may only be used under the BSD style license found at http://mediamath.github.io/strand/LICENSE.txt

*/
(function(scope) {

	function arrayToMap(arr, key){
		return arr.reduce(function(map, obj) {
			map[ obj[key] ] = obj;
			return map;
		}, {});
	}

	scope.Grid = Polymer({

		is: 'strand-grid',

		properties: {
			gpu: {
				type: String,
				value: "2d",
			},
			data: Array,
			scope: {
				type: Object,
				notify: true,
				value: function() {
					return this;
				}
			},
			index: Number,
			_selectAllState: {
				type: String,
				value: 'unchecked'
			},
			sortField: String,
			sortOrder: {
				type: Number,
				value: 1
			},
			indicate: {
				type: String,
				value: "loading  measuring  deferring  initializing",
			},
			_indications: {
				type: Object,
				value: null,
				computed: "_computeIndications(indicate)",
			},
			_loaderStyle: {
				type: String,
				computed: "_styleLoader(_indications, isLoading, _measuring, _deferring, _initializing)",
			},
			isLoading: {
				type: Boolean,
				value: false
			},
			_measuring: {
				type: Boolean,
				observer: "_fulfillColumnResizing",
			},
			_deferring: {
				type: Boolean,
				value: false,
			},
			_initializing: {
				type: Boolean,
				value: false,
			},
			_vScrollbarWidth: {
				type: Number,
				observer: "_delayedColumnResizing",
			},
			expanded: {
				type: Boolean,
				value: false,
			},
			selectable: {
				type: Boolean,
				value: false,
				observer: "_selectableChanged",
			},
			expandable: {
				type: Boolean,
				value: false,
				observer: "_expandableChanged",
			},
			_columns: {
				type: Array,
				value: function() {
					return [];
				},
				notify: true,
				observer: "_columnsChanged",
			},
			mutationTarget: {
				type: Object,
				value: function () {
					return this.$.columnContainer;
				},
			},
			icon: {
				type:String,
				value:null,
				notify: true
			}
		},

		behaviors: [
			StrandTraits.Resolvable,
			StrandTraits.MixinFindable,
			StrandTraits.TemplateFindable,
			StrandTraits.Refable,
			StrandTraits.DomMutable,
		],
		
		listeners: {
			'column-resize-start': '_onColumnResizeStart',
			'column-resize': '_onColumnResize',
			'column-resize-end': '_onColumnResizeEnd',
			'column-sort': "_onColumnSort",
			'item-selected': '_onItemSelected',
			'added': '_initialize',
			'removed': '_initialize',
			'modified': '_initialize',
		},

		observers: [
			"_expansionChanged(expanded)",
			"_onSortChanged(sortField, sortOrder)",
		],

		_expansionChanged: function (expanded) {
			this.toggleClass("expanded", !!expanded, this.$.carat);
		},

		attached: function() {
			this._initializing = true;
			this.async(this._initialize);
		},

		_initialize: function() {
			this._initializeColumns();
		},

		_initializeColumns: function() {
			var nodes = Polymer.dom(this.$.columns).getDistributedNodes();
			if(nodes.length > 0) {
				this._columns = Array.prototype.slice.call(nodes);
				this._columnsMap = arrayToMap(this._columns, "field");
			}
		},

		_columnsChanged: function() {
			this._columnsMap = arrayToMap(this._columns, "field");
			this.notifyPath("scope._columns", this._columns);
		},

		_selectableChanged: function () {
			this.notifyPath("scope.selectable", this.selectable);
		},

		_expandableChanged: function () {
			this.notifyPath("scope.expandable", this.expandable);
		},

		////// Selection //////
		_onItemSelected: function(e, d, sender) {
			var selected = this.selected,
				model = d,
				index = Array.isArray(this.data) ? this.data.indexOf(model) : -1,
				state = "unchecked";

			if(selected.length > 0) {
				state = "partial";
			}

			if(selected.length === this.data.length) {
				state = "checked";
			}

			if (model && index > -1) {
				this.set("data."+index+".selected", model.selected);
			}

			this._selectAllState = state;
		},

		_toggleAllSelections: function(e) {
			this.setAllSelections(e.target.checked);
		},

		setAllSelections: function (checked) {
			var value = !!checked;
			this._selectAllState = value ? "checked" : "unchecked";
			if (this.data) {
				this.data.forEach(function(item, i) {
					var path = 'data.'+i+'.selected';
					this.set(path, value);
				}, this);
			}
		},

		get selected() {
			return this.data && this.data.filter(function(item) {
				return item.selected;
			});
		},

		_hasColumn: function (column) {
			return 0|(column && this._columnsMap && this._columnsMap[column.field] === column);
		},

		////// Resizing //////
		_onColumnResizeStart: function(e) {
			if (this._hasColumn(e.target)) {
				this._columnOffset = e.detail.val;
			}
		},

		_onColumnResize: function(e){
			var x = this._columnOffset + e.detail.val - this.$.viewport.sliderLeft;
			if (this._hasColumn(e.target)) {
				this.translate3d(x + "px", 0, 0, this.$.separator);
				this._showSeparator();
			}
		},

		_showSeparator: function() {
			this.$.separator.classList.add("visible");
			document.body.style.cursor = "col-resize";
		},

		_hideSeparator: function() {
			this.$.separator.classList.remove("visible");
			document.body.style.cursor = "";
		},

		_onColumnResizeEnd: function(e) {
			if (this._hasColumn(e.target)) {
				this._resizeColumns(e.detail.field, e.detail.val);
				this._hideSeparator();
			}
		},

		_delayedColumnResizing: function () {
			this.async(this._resizeColumns, 1);
		},

		_fulfillColumnResizing: function () {
			if (this._deferring) {
				this._deferring = false;
				this.async(this._resizeColumns);
			}
		},

		_resizeColumns: function(field, val) {
			var target = this._columnsMap[field];
			var targetIndex = this._columns.indexOf(target);

			if (!this._measuring) {
				////// Overflow Resizing //////
				this._columns.forEach(function(column, index) {
					if(column.width.indexOf("%") !== -1){
						column.set('width', column.offsetWidth + 'px');
					}
					this.notifyPath("scope._columns."+index+".width", column.width);
				}, this);

				this.$.viewport.modifying = false;
				this._initializing = false;
				this._deferring = false;
			} else {
				this._deferring = true;
			}

			this.$.viewport.async(this.$.viewport.validateWidths);
		},

		////// Sorting //////
		_onSortChanged: function() {
			this.sortBy(this.sortField, this.sortOrder);
		},

		_onColumnSort: function(e) {
			this.sortField = e.detail.field;
			this.sortOrder = e.detail.val;
		},

		sortBy: function(field, order) {
			var sortOrder = arguments.length > 1 ? order : null;
			this._columns.forEach(function(column){
				column.sortOrder = column.SORT_DEFAULT;

				if (column.sortField === field) {
					if (sortOrder === column.SORT_ASCENDING ||
						sortOrder === column.SORT_DESCENDING) {
						column.sortOrder = sortOrder;
					} else if (sortOrder === null) {
						column.sortOrder = column.SORT_ASCENDING;
					}
				}
			});
		},

		////// Toggle //////
		_toggleAllExpansions: function(e, d, sender) {
			this.setAllExpansions(!this.expanded);
		},

		setAllExpansions: function (expanded) {
			var value = !!expanded;
			this.set("expanded", value);
			this.$.viewport.inferOffviewHeightsAfterNextMutation();
			if (this.data) {
				this.data.forEach(function(item, index) {
					this.set("data." + index + ".expanded", this.expanded);
				}, this);
			}
		},

		_computeIndications: function () {
			var list = (this.indicate || "").split(/\s+/);

			return list.reduce(function (indications, key) {
				indications[key] = 0|true;
				return indications;
			}, {});
		},

		_styleLoader: function (_indications, isLoading, _measuring, _deferring, _initializing) {
			var show = "";
			var hide = "display: none;";
			var style = (isLoading && _indications.loading) ?
				show : (_measuring && _indications.measuring) ?
				show : (_deferring && _indications.deferring) ?
				show : (_initializing && _indications.initializing) ?
				show : hide;

			return style;
		},

		_stylizeWidth: function (_vScrollbarWidth) {
			this._delayedColumnResizing();
			return "width: "+_vScrollbarWidth+"px; ";
		},

		requestInitialization: function () {
			return this.$.viewport.initialize();
		},

		////// Util //////
		createId: function(string, id) {
			return string + id;
		}
	});

})(window.Strand = window.Strand || {});