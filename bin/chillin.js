/**
 *
 * ChillinJS is just a small wrapper built on top of impress.js and JQuery
 *
 * ChillinJS is here to avoid the painless declaration of all coordinates
 * in impress.js, impress.js is really awesome, put losing hours positionning
 * slides and views is not. Especially when the main goal is about avoiding
 * overlapping slides.
 *
 * Extra things compare to impress.js:
 * data-style: let you define how your step should behave. Currently you
 *             can use "overview", "dive", "back", "same", "ref-some-id".
 *             Dive and back can be followed by a level, like "back-2" to
 *             indicate 2 level to go back.
 * data-reference: let you define a reference step through an idea, default
 *             means the previous step, note that reference must have been
 *             present first in the DOM
 * data-x, data-y : are now extended you can use the chillin % to refer to use
 *                  the reference step value, data-x=%+100 means 100 more on x
 *                  than reference. Same for data-rotate, data-scale and data-z.
 *
 * Based on boilerplate from http://jqueryboilerplate.com/
 */
;(function ( $, window, document, undefined ) {
    /*global jQuery, window, document */
    "use strict";

    var pluginName = "chillin",
        defaults = {
            gridCellWidth: "2500",
            gridCellHeight: "2500",
            defaultStepWidth: "1500",
            defaultStepHeight: "1500",
            gridXMinLimit: "-10",
            gridXMaxLimit: "10",
            gridYMinLimit: "-10",
            gridYMaxLimit: "10",
            diveZDelta: -500,
            diveScaleFactor: 0.1,
            overviewScaleAdjustementRatio: 1 / 875,
            layoutAlgorithm: "inspiral", // layout key or custom function
            stepsSelector: "#impress .step"
        };

    // The actual plugin constructor
    function Plugin( element, options ) {

        this.options = $.extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;
        
        // Default values added to position get from else where
        this._defaultsPositionData = {z: 0, scale: 1, rotate: 0};
        // The field in whom look for formula, these are data fields, e.g.: x
        // stands for "data-x"
        this._formulaFields = ["x", "y", "z", "scale", "rotate"];
        // Regular expression applied to look for formulas
        this._formulaRe = /%\s*([+-\/*])\s*(\d+)/;
        // Regular expression applied to look for dive in the data-style field
        this._diveRe = /dive-?(\d*)/;
        // Regular expression applied to look for back in the data-style field
        this._backRe = /back-?(\d*)/;
        // Regular expression applied to look for reference in the data-style
        // field
        this._refRe = /ref-?(.*)/;
        
        // state variables
        // Represents the grid on which elements are placed
        this._grid = {};
        // The previous JQuery element that have been processed
        this._predecessor = undefined;
        // The grid positions that will be used later
        this._potentialGridPositions = undefined;

        this.init();
    }

    Plugin.prototype = {
        _layoutAlgorithms: {},

        init: function() {
            this._positionSteps();
        },
        
        /**
         * Position each step
         */
        _positionSteps: function() {
            this._positionningInit();
            var objectRef = this;
            $(this.options.stepsSelector).each(function() {
                var stepElement = $(this);
                objectRef._positionStep(stepElement);
            });
            this._positionningClean();
        },
        
        /**
         * Initialised the positionning context
         */
        _positionningInit: function() {
            this._grid = {};
            // Will store a JQuery element
            this._predecessor = undefined;
            this._getPotentialGridPositions();
        },
        
        /**
         * Return potential grid positions, also happen to compute these
         * positions
         * @return {Array}
         */
        _getPotentialGridPositions: function() {
            if (typeof(this._potentialGridPositions) === "undefined") {
                var gridXMinLimit = parseInt(this.options.gridXMinLimit),
                    gridXMaxLimit = parseInt(this.options.gridXMaxLimit),
                    gridYMinLimit = parseInt(this.options.gridYMinLimit),
                    gridYMaxLimit = parseInt(this.options.gridYMaxLimit),
                    elementsToPositionCount = this._getWorkflowPositionningCount(),
                    generator;
                    
                if (typeof(this.options.layoutAlgorithm) === "string") {
                    generator = this._layoutAlgorithms[this.options.layoutAlgorithm];
                } else {
                    generator = this.options.layoutAlgorithm;
                }
                    
                    
                var gridPositions = generator(gridXMinLimit, gridXMaxLimit,
                                                gridYMinLimit, gridYMaxLimit,
                                                elementsToPositionCount);

                

                this._potentialGridPositions = gridPositions;
            }
            return this._potentialGridPositions;
        },
        
        /**
         * Clean the positionning context
         */
        _positionningClean: function() {
            this._potentialGridPositions = undefined;
        },
        
        /**
         * Position a step
         *
         * @param {JQuery} stepElement - The JQuery element to position
         */
        _positionStep: function(stepElement) {
            var width, height;
            
            // if any special width or height set it here
            if (typeof(width) === "undefined") {
                width = this.options.defaultStepWidth;
            }
            if (typeof(height) === "undefined") {
                height = this.options.defaultStepWidth;
            }
            
            var position;
            if (!this._hasPosition(stepElement)) {
                position = this._getPosition(stepElement, width, height);
                
                stepElement.attr("data-x", position.x);
                stepElement.attr("data-y", position.y);
                stepElement.attr("data-z", position.z);
                stepElement.attr("data-scale", position.scale);
                stepElement.attr("data-rotate", position.rotate);
            } else {
                // we do not position but get it to indicate grid consumption
                position = this._getPositionFromElement(stepElement);
            }
            
            this._consumeGridCells(position.x, position.y,
                                    width, height);
                                    
            this._predecessor = stepElement;
        },
        
        /**
         * Test wether or not the element has a defined position
         *
         * @param {JQuery} stepElement -
         * @return {boolean}
         */
        _hasPosition: function(stepElement) {
            var hasX = ((typeof(stepElement.attr("data-x")) !== "undefined")) &&
                        stepElement.attr("data-x").indexOf("%") === -1,
                hasY = ((typeof(stepElement.attr("data-y")) !== "undefined")) &&
                        stepElement.attr("data-y").indexOf("%") === -1;
            return hasX && hasY;
        },
        
        /**
         * Return the position of an element
         *
         * @param {JQuery} stepElement -
         * @return {Object}
         */
        _getPositionFromElement: function(stepElement) {
            var x = stepElement.attr("data-x"),
                y = stepElement.attr("data-y"),
                z = stepElement.attr("data-z"),
                scale = stepElement.attr("data-scale"),
                rotate = stepElement.attr("data-rotate"),
                position = $.extend({},
                                    this._defaultsPositionData);
            position.x = x;
            position.y = y;
            position.z = z;
            position.scale = scale;
            position.rotate = rotate;
            
            for (var field in position) {
                if (this._formulaRe.exec(position[field])) {
                    delete position[field];
                }
            }
            
            return position;
        },
        
        /**
         * Return the position of an element, applying different positionning
         * methods
         *
         * @param {JQuery} stepElement -
         * @param {int} width -
         * @param {int} height -
         * @return {Object}
         */
        _getPosition: function(stepElement, width, height) {
            var style = stepElement.attr('data-style'),
                position;
                
            var diveRe = this._diveRe,
                diveParsed = diveRe.exec(style);
            
            if (typeof(diveParsed) === "object" && diveParsed !== null) {
                position = this._getDivePosition(diveParsed[1]);
            }
            
            var backRe = this._backRe,
                backParsed = backRe.exec(style);
            
            if (typeof(backParsed) === "object" && backParsed !== null) {
                position = this._getBackPosition(backParsed[1]);
            }
            
            if (style === "same") {
                position = this._getSamePosition();
            }
            
            if (style === "overview") {
                position = this._getOverviewPosition();
            }
            
            var formulas = this._getFormulas(stepElement),
                refRe = this._refRe,
                refParsed = refRe.exec(style);
            if (Object.keys(formulas).length > 0 || (refParsed !== null)) {
                position = this._getRelativePosition(formulas, refParsed);
            }
            
            if (typeof(position) === "undefined") {
                position = this._findPosition(width, height);
            }
            
            // defined position override every other position
            position = $.extend(position, this._getPositionFromElement(stepElement));
            
            return position;
        },
        
        /**
         * Get the position in a dive style
         *
         * @param {int} diveLevel - can be undefined (we use 1 in this case)
         * @return {Object}
         */
        _getDivePosition: function(diveLevel) {
            var predecessorPosition = this._getPredecessorPosition(),
                position = $.extend({},
                                    this._defaultsPositionData,
                                    predecessorPosition);
            if ((typeof(diveLevel) === "undefined") || (diveLevel === "")) {
                diveLevel = 1;
            }
            while (diveLevel > 0) {
                position.z = parseInt(position.z) + parseInt(this.options.diveZDelta);
                position.scale *= this.options.diveScaleFactor;
                diveLevel--;
            }
            return position;
        },
        
        /**
         * Get the position in a back style
         *
         * @param {int} backLevel - can be undefined (we use 1 in this case)
         * @return {Object}
         */
        _getBackPosition: function(backLevel) {
            var predecessorPosition = this._getPredecessorPosition(),
                position = $.extend({},
                                    this._defaultsPositionData,
                                    predecessorPosition);
            if ((typeof(backLevel) === "undefined") || (backLevel === "")) {
                backLevel = 1;
            }
            while (backLevel > 0) {
                position.z = parseInt(position.z) - parseInt(this.options.diveZDelta);
                position.scale /= this.options.diveScaleFactor;
                backLevel--;
            }
            return position;
        },
        
        /**
         * Return a position identical to the one of the predecessor
         *
         * @param {Array} refParsed
         * @return {Object}
         */
        _getSamePosition: function(refParsed) {
            var referencePosition = this._getReferencePosition(refParsed),
                position = $.extend({},
                                    this._defaultsPositionData,
                                    referencePosition);
            return position;
        },
        
        /**
         * Return a position relative to a reference node by applying formula
         *
         * @param {Object} formulas - key indicates field and value the matching
         *   formula
         * @param {Array} refParsed - can be null which means that reference
         *   is the predecessor
         * @param {JQuery} stepElement - considered element
         * @return {Object}
         */
        _getRelativePosition: function(formulas, refParsed) {
            var referencePosition = this._getReferencePosition(refParsed),
                position = $.extend({},
                                    this._defaultsPositionData,
                                    referencePosition);

            for (var field in formulas) {
                var formula = formulas[field],
                    newValue = this._applyFormula(formula, position[field]);
                position[field] = newValue;
            }
            
            return position;
        },
        
        /**
         * Get the position of the overview step
         *
         * @return {Object}
         */
        _getOverviewPosition: function() {
            var position = $.extend({},
                                    this._defaultsPositionData),
                minX = 0, maxX = 0, minY = 0 , maxY = 0;
                
            $(this.options.stepsSelector).each(function() {
                var x = parseInt($(this).attr("data-x")),
                    y = parseInt($(this).attr("data-y"));
                if (x < minX) {
                    minX = x;
                }
                if (x > maxX) {
                    maxX = x;
                }
                if (y < minY) {
                    minY = y;
                }
                if (y > maxY) {
                    maxY = y;
                }
            });
            
            var xDelta = parseInt(maxX) - parseInt(minX)
                            + parseInt(this.options.defaultStepWidth)
                            + parseInt(this.options.gridCellWidth) / 2,
                yDelta = parseInt(maxY) - parseInt(minY)
                                   + parseInt(this.options.defaultStepHeight)
                                   + parseInt(this.options.gridCellHeight) / 2,
                maxDelta = Math.max(xDelta, yDelta),
                xAverage = (parseInt(maxX) + parseInt(minX)) / 2,
                yAverage = (parseInt(maxY) + parseInt(minY)) / 2;

            position.x = xAverage;
            position.y = yAverage;
            position.scale = maxDelta *
                                this.options.overviewScaleAdjustementRatio;
            return position;
        },
        
        /**
         * Find a position on the grid for the given width an height
         *
         * @param {int} width - The width of the element
         * @param {int} height - The height of the element
         * @@return {Object}
         */
        _findPosition: function(width, height) {
            while (true) {
                var gridPosition = this._findGridPosition(width, height);
                
                if (typeof(gridPosition) === "undefined") {
                    return;
                }
                     
                if (this._canUseGridPosition(gridPosition, width, height)) {
                    var position = this._getPositionFromGridPosition(gridPosition);
                    return position;
                }
            }
        },
        
        /**
         * Find a position for the given width and height
         * @param {int} width - The width of the element
         * @param {int} height - The height of the element
         * @return {object} - attributes are x and y
         */
        _findGridPosition: function(width, height) {
            var potentialGridPositions = this._getPotentialGridPositions(),
                potentialGridPosition, canUsePosition;
            while (potentialGridPositions.length > 0) {
                potentialGridPosition = potentialGridPositions.shift();
                canUsePosition = this._canUseGridPosition(potentialGridPosition,
                                                                width,
                                                                height);
                if (canUsePosition) {
                    return potentialGridPosition;
                }
            }
        },
        
        /**
         * Tell wether or not the given gridPosition can be used with the given
         * width and height
         *
         * @param {Object} gridPosition -
         * @param {width} width -
         * @param {height} height -
         * @return {boolean}
         */
        _canUseGridPosition: function(gridPosition, width, height) {
            var xGrid = gridPosition.x,
                yGrid = gridPosition.y,
                xGridMin = xGrid - Math.round(width / (2 * this.options.gridCellWidth)),
                yGridMin = yGrid - Math.round(height / (2 * this.options.gridCellHeight)),
                xGridMax = xGrid + Math.round(width / (2 * this.options.gridCellWidth)),
                yGridMax = yGrid + Math.round(height / (2 * this.options.gridCellHeight));
                
            for (var xIterator = xGridMin; xIterator <= xGridMax; xIterator++) {
                for (var yIterator = yGridMin; yIterator <= yGridMax; yIterator++) {
                    if (this._isGridCellUsed(xIterator, yIterator)) {
                        return false;
                    }
                }
            }
            return true;
        },
        
        /**
         * Register that some grid cell has been consumed, this aboid to use
         * some cell that might lead to overlapping
         *
         * @param {int} x - on the impress view
         * @param {int} y - on the impress view
         * @param {width} width -
         * @param {height} height -
         */
        _consumeGridCells: function(x, y, width, height) {
            var xGridMin = this._getXGridMin(x, width),
                yGridMin = this._getYGridMin(y, height),
                xGridMax = this._getXGridMax(x, width),
                yGridMax = this._getYGridMax(y, height);
                
            for (var xIterator = xGridMin; xIterator <= xGridMax; xIterator++) {
                for (var yIterator = yGridMin; yIterator <= yGridMax; yIterator++) {
                    this._markAsUsed(xIterator, yIterator);
                }
            }
        },
        
        /**
         * Reference that a grid cell has been consumed
         *
         * @param {int} xGrid -
         * @param {int} yGrid -
         */
        _markAsUsed: function(xGrid, yGrid) {
            if (!(xGrid in this._grid)) {
                this._grid[xGrid] = {};
            }
            if (!(yGrid in this._grid[xGrid])) {
                this._grid[xGrid][yGrid] = true;
            }
        },
        
        /**
         * Test if some coordinates on the grid are available
         *
         * @param {int} xGrid -
         * @param {int} yGrid -
         */
        _isGridCellUsed: function(xGrid, yGrid) {
            if (!(xGrid in this._grid)) {
                return false;
            }
            if ((yGrid in this._grid[xGrid])
                && this._grid[xGrid][yGrid]) {
                return true;
            }
            return false;
        },
        
        /**
         * Return the position of the predecessor
         *
         * @return {Object}
         */
        _getPredecessorPosition: function() {
            return this._extractPositionFrom(this._predecessor);
        },
        
        /**
         * Return the position of the reference step
         *
         * @return {Object}
         */
        _getReferencePosition: function(refParsed) {
            if (refParsed === null || typeof(refParsed) === "undefined") {
                return this._getPredecessorPosition();
            }
            var referenceId = refParsed[1],
                reference = $("#"+referenceId);
            return this._extractPositionFrom(reference);
        },
        
        /**
         * Return the position of an element
         *
         * @param {JQuery} element -
         * @return {Object}
         */
        _extractPositionFrom: function(element) {
            var x = element.attr('data-x'),
                y = element.attr('data-y'),
                z = element.attr('data-z'),
                scale = element.attr('data-scale'),
                rotate = element.attr('data-rotate');
            return {x: x, y: y, z: z, scale: scale, rotate: rotate};
        },
        
        /**
         * Apply a formula like "%-100" to a reference value
         *
         * @param {string} formula -
         * @param {Number} refValue -
         * @return {Number}
         */
        _applyFormula: function(formula, refValue) {
            var formulaAsArray = this._formulaRe.exec(formula),
                operation = formulaAsArray[1],
                arg = parseInt(formulaAsArray[2]);
            refValue = parseInt(refValue);
            switch (operation) {
                case "+":
                    return refValue + arg;
                case "-":
                    return refValue - arg;
                case "/":
                    return refValue / arg;
                case "*":
                    return refValue * arg;
            }
        },
        
        /**
         * Return the formulas defined on an element
         *
         * @param {JQuery} stepElement -
         * @return {Object}
         */
        _getFormulas: function(stepElement) {
            var formulas = {};
            for (var i = 0; i < this._formulaFields.length; i++) {
                var field = this._formulaFields[i],
                    dataField = "data-"+field,
                    formula = stepElement.attr(dataField);
                    
                if (this._formulaRe.exec(formula) === null) {
                    continue;
                }
                if ((typeof(formula) !== "undefined") && (formula !== "")) {
                    formulas[field] = formula;
                }
            }
            return formulas;
        },
        
        /**
         * Count number of element to position
         *
         * @return {int}
         */
        _getWorkflowPositionningCount: function() {
            var count = 0,
                objectRef = this;
            $(this.options.stepsSelector).each(function() {
                var element = $(this);
                    
                if (objectRef._hasValidStyle(element)) {
                    return true;
                }
                    
                var formulas = objectRef._getFormulas(element);
                if (Object.keys(formulas).length > 0) {
                    return true;
                }
                
                if (objectRef._hasPosition(element)) {
                    return true;
                }
                
                count += 1;
            });
            
            return count;
        },
        
        /**
         * Tell if element has a valid style
         *
         * @return {boolean}
         */
        _hasValidStyle: function(stepElement) {
            var style = stepElement.attr("data-style");
            if (style === "same" ||
                style === "overview" ||
                this._refRe.exec(style) ||
                this._backRe.exec(style) ||
                this._diveRe.exec(style)) {
                return true;
            }
            return false;
        },
        
        /**
         * Get a position in the impress context from a position on the grid
         *
         * @param {object} gridPosition - the position on the grid
         * @return {object}
         */
        _getPositionFromGridPosition: function(gridPosition) {
            var xGrid = gridPosition.x,
                yGrid = gridPosition.y,
                x = xGrid * this.options.gridCellWidth,
                y = yGrid * this.options.gridCellHeight;
            return {x: x, y: y};
        },
        
        _getXGridMin: function(x, width) {
            var xLeft = parseInt(x) - parseInt(width) / 2,
                xGridMin = Math.round(xLeft / this.options.gridCellWidth);
            return xGridMin;
        },
        
        _getXGridMax: function(x, width) {
            var xRight = parseInt(x) + parseInt(width) / 2,
                xGridMax = Math.round(xRight / this.options.gridCellWidth);
            return xGridMax;
        },
        
        _getYGridMin: function(y, height) {
            var yTop = parseInt(y) - parseInt(height) / 2,
                yGridMin = Math.round(yTop / this.options.gridCellHeight);
            return yGridMin;
        },
        
        _getYGridMax: function(y, height) {
            var yBottom = parseInt(y) + parseInt(height) / 2,
                yGridMax = Math.round(yBottom / this.options.gridCellHeight);
            return yGridMax;
        }
    };

    $.fn[pluginName] = function ( options, extra ) {
        if (options === "returnSelf") {
            // used mainly for unit testing
            return new Plugin();
        }
        var algorithm;
        if (options === "addLayoutAlgorithm") {
            if (!("name" in extra) || !("algorithm" in extra)) {
                throw "'name' and 'algorithm' should be defined";
            }
            var name = extra.name;
            algorithm = extra.algorithm;
            Plugin.prototype._layoutAlgorithms[name] = function(xMinLimit, xMaxLimit,
                                                                yMinLimit, yMaxLimit,
                                                                elementsCount) {
                return algorithm.generate(xMinLimit, xMaxLimit, yMinLimit, yMaxLimit, elementsCount);
            };
            return;
        }
        if (options === "generateGridPositions") {
            if (!("algorithm" in extra) || !("xMinLimit" in extra)
                || !("xMaxLimit" in extra) || !("yMinLimit" in extra)
                || !("yMaxLimit" in extra)) {
                throw "Missing value for generating grid positions";
            }
            algorithm = Plugin.prototype._layoutAlgorithms[extra.algorithm];
            var xMinLimit = extra.xMinLimit,
                xMaxLimit = extra.xMaxLimit,
                yMinLimit = extra.yMinLimit,
                yMaxLimit = extra.yMaxLimit,
                elementsCount;

            
            if ("elementsCount" in extra) {
                elementsCount = extra.elementsCount;
            }
            
            return algorithm(xMinLimit, xMaxLimit, yMinLimit, yMaxLimit,
                                                                elementsCount);
        }
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
    };
})( jQuery, window, document );
var NeighbourhoodIterationTemplateAlgorithm;

;(function() {
    /*global $*/
   "use strict";
   
    /**
     * All chillin's layouts are based on a grid
     *
     * Template algorithm that generate layout from a starting point and then
     * iterate on neighbors, behavior is customized by scoring those neighbors
     * according to their distance to center, and, x and y attributes. Changing
     * the weight, change the layout algorithm.
     *
     * @param {object} options
     */
    NeighbourhoodIterationTemplateAlgorithm = function (options) {
        
        this._init = function(options) {
            var defaults = {
                centerDistanceScoreWeight: 0,
                xScoreWeight: 0,
                yScoreWeight: 0,
                neighbourhood: "cross", // "cross", "square" or function
                initialPosition: {x: 0, y: 0}
            };
            
            this.options = $.extend({}, defaults, options);
        };
        
        /**
         * Generate an array of positions
         *
         * @return {Array}
         */
        this.generate = function(xMinLimit, xMaxLimit, yMinLimit, yMaxLimit) {
            var usedGridPositions = [], // <-- used to match used position
                generatedPositions = [], // <-- returned
                currentPosition;

            currentPosition = this.options.initialPosition;
            generatedPositions.push(currentPosition);
            usedGridPositions.push(currentPosition.x + '-' + currentPosition.y);
                
            while (true) {
                var neighbors = this._getNeighbourhood(currentPosition);
                var potentialPositions = this._filterGridPositionsWithLimit(
                                            neighbors, xMinLimit, xMaxLimit,
                                            yMinLimit, yMaxLimit);
                potentialPositions = this._filterGridPositionsFromUsedPositions(
                                         potentialPositions, usedGridPositions);
                currentPosition = this._pickBest(potentialPositions);
                
                if (typeof(currentPosition) === "undefined") {
                    break;
                }
                
                generatedPositions.push(currentPosition);
                    
                var x = currentPosition.x,
                    y = currentPosition.y;
                usedGridPositions.push(x + '-' + y);
            }
            
            return generatedPositions;
        };
        
        /**
         * Best here means :
         * 1/ Closest to the center {x:0, y:0}
         * 2/ Closest to the right (if 1 doesn't discriminate)
         * 3/ Closest to the top (if 2 doesn't discriminate)
         *
         * @param {Array} potentialPositions - the potential positions, these
         *      are neighbors of the current points
         * @return {Object}
         */
        this._pickBest = function(potentialPositions) {
            if (potentialPositions.length === 0) {
                return;
            }
            var scores = []; // indexed by index of potentialPositions
            for (var i = 0; i < potentialPositions.length; i++) {
                var potentialPosition = potentialPositions[i],
                    x = potentialPosition.x,
                    y = potentialPosition.y,
                    centerDistance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
                    score = 0;
                    
                // weight is use to ensure priority of criterions is preserved
                // 1/ Euclide as guest star
                score += this.options.centerDistanceScoreWeight * centerDistance;
                
                // 2/ with typical neighbourhood |Δx| <= 2
                score += this.options.xScoreWeight * x;
                
                // 3/ with typical neighbourhood |Δy| <= 2
                score += this.options.yScoreWeight * y;
                
                scores[i] = score;
            }

            var highestScore = scores.reduce(function(current, previousReturn) {
                                    return Math.max(current, previousReturn);
                                }),
                bestIndex = $.inArray(highestScore, scores),
                bestPosition = potentialPositions[bestIndex];
            
            return bestPosition;
        };
        
        /**
         * Remove used position from the potential positions
         *
         * @param {Array} potentialPositions - contains object like {x: 1, y:-2}
         * @param {Array} usedGridPositions - contains string like "1--2";
         * @return {Array}
         */
        this._filterGridPositionsFromUsedPositions = function(potentialPositions,
                                                            usedGridPositions) {
            var filteredPositions = [];
            for (var i = 0; i < potentialPositions.length; i++) {
                var potentialPosition = potentialPositions[i],
                    potentialPositionString = potentialPosition.x + '-' +
                                                potentialPosition.y,
                    inArray = $.inArray(potentialPositionString, usedGridPositions);
                if (inArray === -1) {
                    filteredPositions.push(potentialPosition);
                }
            }
            return filteredPositions;
        };
        
        /**
         * Remove off limit positions from potential positions
         *
         * @param {Array} potentialPositions -
         * @param {Number} xMinLimit -
         * @param {Number} xMaxLimit -
         * @param {Number} yMinLimit -
         * @param {Number} yMaxLimit -
         * @return {Array}
         */
        this._filterGridPositionsWithLimit = function(potentialPositions,
                                                    xMinLimit, xMaxLimit,
                                                    yMinLimit, yMaxLimit) {
            var filteredPositions = [];
            for (var i = 0; i < potentialPositions.length; i++) {
                var potentialPosition = potentialPositions[i],
                    x = potentialPosition.x,
                    y = potentialPosition.y;
                if ((x > xMaxLimit) || (x < xMinLimit)
                    || (y > yMaxLimit) || (y < yMinLimit)) {
                    continue;
                }
                filteredPositions.push(potentialPosition);
            }
            return filteredPositions;
        };
        
        this._getNeighbourhood = function(currentPosition) {
            var neighbourhood = this.options.neighbourhood;
            if (neighbourhood === "cross") {
                return this._getCrossNeighbourhood(currentPosition);
            }
            if (neighbourhood === "square") {
                return this._getSquareNeighbourhood(currentPosition);
            }
            return neighbourhood(currentPosition);
        };
        
        this._getCrossNeighbourhood = function(currentPosition) {
            var x = currentPosition.x,
                y = currentPosition.y;
            return [{'x': x+1, 'y': y},
                    {'x': x, 'y': y-1},
                    {'x': x-1, 'y': y},
                    {'x': x, 'y': y+1}];
        };
        
        this._getSquareNeighbourhood = function(currentPosition) {
            var x = currentPosition.x,
                y = currentPosition.y;
            return [{'x': x+1, 'y': y},
                    {'x': x+1, 'y': y-1},
                    {'x': x, 'y': y-1},
                    {'x': x-1, 'y': y-1},
                    {'x': x-1, 'y': y},
                    {'x': x-1, 'y': y+1},
                    {'x': x, 'y': y+1},
                    {'x': x+1, 'y': y+1}];
        };
        
        this._init(options);
    };
})();
/**
 * The "out spiral" positionning makes a spiral from the center of scene
 */
;(function() {
    /*global $, document, NeighbourhoodIterationTemplateAlgorithm*/
    "use strict";
    
    var options = {
                centerDistanceScoreWeight: -1000,
                xScoreWeight: 1,
                yScoreWeight: -0.0001,
                neighbourhood: "cross",
                initialPosition: {x: 0, y: 0}
                },
        outSpiralLayoutAlgorithm = new NeighbourhoodIterationTemplateAlgorithm(options);
    
    $(document).chillin("addLayoutAlgorithm",
                        {name: "outspiral",
                         algorithm: outSpiralLayoutAlgorithm});
})();
/**
 * The "in spiral" positionning makes a spiral to the center of scene from the
 * outside by reverting an "out spiral"
 */
;(function() {
    /*global $, document*/
    "use strict";
    
    function InSpiralLayoutAlgorithm() {
        this.generate = function(xMinLimit, xMaxLimit, yMinLimit, yMaxLimit,
                                elementsCount) {
                                    
            var outSpiralPotentialPositions = $(document).chillin("generateGridPositions",
                                            {algorithm: "outspiral",
                                             xMinLimit: xMinLimit,
                                             xMaxLimit: xMaxLimit,
                                             yMinLimit: yMinLimit,
                                             yMaxLimit: yMaxLimit,
                                             elementsCount: elementsCount}),
                maxPositions = outSpiralPotentialPositions.length,
                maxPositionIndexToConsider = Math.min(maxPositions, elementsCount - 1),
                potentialPositions = [];
            
            for (var i = maxPositionIndexToConsider; i >= 0 ; i--) {
                potentialPositions.push(outSpiralPotentialPositions[i]);
            }
            
            return potentialPositions;
        };
    }

    $(document).chillin("addLayoutAlgorithm",
                        {name: "inspiral",
                         algorithm: new InSpiralLayoutAlgorithm()});
    
})();
;(function() {
    /*global $, document, NeighbourhoodIterationTemplateAlgorithm*/
    "use strict";
    
    /**
     * A side to side layout feels lines of element and switch to the next line.
     * There are multiple instance of them, like "rightlefttopbottom" which
     * means from right to left and top to bottom, other examples:
     * "leftrighttopbottom" and "topbottomleftright".
     *
     * @param {Number} xScoreWeight
     * @param {Number} yScoreWeight
     */
    function SideToSideLayoutAlgorithm(xScoreWeight, yScoreWeight) {
        this._init = function(xScoreWeight, yScoreWeight) {
            this.options = {
                                centerDistanceScoreWeight: 0,
                                xScoreWeight: parseInt(xScoreWeight),
                                yScoreWeight: parseInt(yScoreWeight),
                                neighbourhood: "cross"
                            };
            this.layoutAlgorithm = new NeighbourhoodIterationTemplateAlgorithm(
                                                                this.options);
        };
        
        this.generate = function(xMinLimit, xMaxLimit, yMinLimit,
                                            yMaxLimit, elementsCount) {
            var restrictedLimit = this._getRestrictedLimits(parseInt(xMinLimit),
                                                parseInt(xMaxLimit),
                                                parseInt(yMinLimit),
                                                parseInt(yMaxLimit),
                                                elementsCount);
            xMinLimit = restrictedLimit.xMinLimit;
            xMaxLimit = restrictedLimit.xMaxLimit;
            yMinLimit = restrictedLimit.yMinLimit;
            yMaxLimit = restrictedLimit.yMaxLimit;
            var initialPosition = this._getInitialPosition(xMinLimit, xMaxLimit,
                                                          yMinLimit, yMaxLimit);
                
            this.layoutAlgorithm.options.initialPosition = initialPosition;
                                     
            return this.layoutAlgorithm.generate(xMinLimit, xMaxLimit,
                                                 yMinLimit, yMaxLimit,
                                                 elementsCount);
        };
        
        /**
         * Compute the initial position from the weight of given to each
         * dimension (will be called FROM the underlying layout, then "this"
         * might not be the object you think it is)
         *
         * @param {Number} xMinLimit
         * @param {Number} xMaxLimit
         * @param {Number} yMinLimit
         * @param {Number} yMaxLimit
         * @return {Object} - a position
         */
        this._getInitialPosition = function(xMinLimit, xMaxLimit, yMinLimit,
                                    yMaxLimit) {
            var xWeight = this.options.xScoreWeight,
                yWeight = this.options.yScoreWeight,
                x = xMinLimit,
                y = yMinLimit;
            if (xWeight > 0) {
                x = xMaxLimit;
            }
            if (yWeight > 0) {
                y = yMaxLimit;
            }
            return {x: x, y: y};
        };

        /**
         * Adapt the limit to a given element count
         *
         * @param {Number} xMinLimit
         * @param {Number} xMaxLimit
         * @param {Number} yMinLimit
         * @param {Number} yMaxLimit
         * @param {Number} elementsCount
         * @return {Object} - containing the various limit
         */
        this._getRestrictedLimits = function(xMinLimit, xMaxLimit,
                                                        yMinLimit, yMaxLimit,
                                                        elementsCount) {
            var gridSize = this._getGridSize(xMinLimit, xMaxLimit, yMinLimit,
                                      yMaxLimit),
                minSideSize = this._getMinSideSize(xMinLimit, xMaxLimit,
                                                   yMinLimit, yMaxLimit);
             
            // Used for map reduce
            function mathMax(current, previousResult) {
                return Math.max(current, previousResult);
            }
                
            while (gridSize - elementsCount > minSideSize) {
                var limits = [xMinLimit, xMaxLimit, yMinLimit, yMaxLimit],
                    maxAbsLimit = limits.map(Math.abs).reduce(mathMax);
                switch (maxAbsLimit) {
                    // We reduce firstly the height
                    case Math.abs(yMinLimit):
                        yMinLimit++;
                        break;
                    case yMaxLimit:
                        yMaxLimit--;
                        break;
                    // We reduce the width
                    case Math.abs(xMinLimit):
                        xMinLimit++;
                        break;
                    case xMaxLimit:
                        xMaxLimit--;
                        break;
                    default:
                        throw "Never enter here you should";
                }
                gridSize = this._getGridSize(xMinLimit, xMaxLimit, yMinLimit,
                                      yMaxLimit);
                minSideSize = this._getMinSideSize(xMinLimit, xMaxLimit,
                                                   yMinLimit, yMaxLimit);
            }
            return {xMinLimit: xMinLimit,
                    xMaxLimit: xMaxLimit,
                    yMinLimit: yMinLimit,
                    yMaxLimit: yMaxLimit};
        };
              
        /**
         * Return the size of the smallest side of the grid
         *
         * @param {Number} xMinLimit
         * @param {Number} xMaxLimit
         * @param {Number} yMinLimit
         * @param {Number} yMaxLimit
         * @return {Number}
         */
        this._getMinSideSize = function(xMinLimit, xMaxLimit,
                                                   yMinLimit, yMaxLimit) {
            var xSize = xMaxLimit - xMinLimit + 1,
                ySize = yMaxLimit - yMinLimit + 1;
                
            return Math.min(xSize, ySize);
        };
        
        this._getGridSize = function(xMinLimit, xMaxLimit,
                                                yMinLimit, yMaxLimit) {
            var xSize = xMaxLimit - xMinLimit + 1,
                ySize = yMaxLimit - yMinLimit + 1;
            return xSize * ySize;
        };
        
        this._init(xScoreWeight, yScoreWeight);
    }
    
    /**
     * The following is just building all the different side to side layout
     * and inject them into chillin. It could be hardcoded in a clearer way
     * but it would be less fun.
     */
    var horizontals = ["leftright", "rightleft"],
        verticals = ["topbottom", "bottomtop"];
    
    function generateLayout(side1, side2) {
        var xScale = 1,
            yScale = 1;
        if ($.inArray(side1, horizontals) !== -1) {
            yScale = 1000;
        } else {
            xScale = 1000;
        }
        var xWeight = xScale,
            yWeight = yScale;
        if (($.inArray(side1, horizontals) === 0)
            || ($.inArray(side2, horizontals) === 0)) {
            xWeight *= -1;
        }
        if (($.inArray(side1, verticals) === 0)
            || ($.inArray(side2, verticals) === 0)) {
            yWeight *= -1;
        }
        
        var key = side1 + side2,
            sideToSideAlgorithm = new SideToSideLayoutAlgorithm(xWeight,
                                                                yWeight);
                                                                
        $(document).chillin("addLayoutAlgorithm",
                        {name: key,
                         algorithm: sideToSideAlgorithm});
    }
    
    for (var i in horizontals) {
        var horizontal = horizontals[i];
        for (var j in verticals) {
            var vertical = verticals[j];
            generateLayout(horizontal, vertical);
            generateLayout(vertical, horizontal);
        }
    }
    
})();
