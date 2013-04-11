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
