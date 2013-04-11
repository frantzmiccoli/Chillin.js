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
