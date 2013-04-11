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
