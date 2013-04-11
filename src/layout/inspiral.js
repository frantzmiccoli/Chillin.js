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
