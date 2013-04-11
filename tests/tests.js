;(function() {
    /*global $, document, deepEqual, test, ok */
    "use strict";
    
    function ChillinTest() {
        
        this.run = function() {
            this.testGridGeneration();
        };
        
        this.testGridGeneration = function() {
            test( "OutSpiralLayoutAlgorithm", function() {
                var chillinPlugin = $(document).chillin("returnSelf", {}),
                    layout = chillinPlugin._layoutAlgorithms.outspiral;
               
                var expectedPositions = [{x:0, y:0},
                                           {x:1, y:0},
                                           {x:1, y:-1},
                                           {x:0, y:-1},
                                           {x:-1, y:-1},
                                           {x:-1, y:0},
                                           {x:-1, y:1},
                                           {x:0, y:1},
                                           {x:1, y:1}],
                   positions = layout(-1, 1, -1, 1);
                    
                deepEqual(positions, expectedPositions, "Spiral should match");
            });
            
            test( "InSpiralLayoutAlgorithm", function() {
                var chillinPlugin = $(document).chillin("returnSelf", {}),
                    layout = chillinPlugin._layoutAlgorithms.inspiral;
               
                var expectedPositions = [
                                           {x:-1, y:-1},
                                           {x:0, y:-1},
                                           {x:1, y:-1},
                                           {x:1, y:0},
                                           {x:0, y:0}
                                           ],
                   positions = layout(-1, 1, -1, 1, 5);
                    
                deepEqual(positions, expectedPositions, "Spiral should match");
            });

            test("SideToSideLayoutAlgorithm (multiple)", function() {
                var chillinPlugin = $(document).chillin("returnSelf", {}),
                    layout = chillinPlugin._layoutAlgorithms.leftrighttopbottom;
                    
                var expectedPositions = [
                                        {x: -1, y:-1},
                                        {x: 0, y:-1},
                                        {x: 1, y:-1},
                                        {x: 1, y:0},
                                        {x: 0, y:0},
                                        {x: -1, y:0},
                                        {x: -1, y:1}
                                        ],
                    positions = layout(-10, 10, -50, 50, 7).slice(0, 7);
                    
                deepEqual(positions, expectedPositions, "Positions should match");
                
                layout = chillinPlugin._layoutAlgorithms.bottomtoprightleft;
                expectedPositions = [
                                        {x: 1, y:1},
                                        {x: 1, y:0},
                                        {x: 1, y:-1},
                                        {x: 0, y:-1},
                                        {x: 0, y:0},
                                        {x: 0, y:1},
                                        {x: -1, y:1}],
                positions = layout(-10, 10, -50, 50, 7).slice(0, 7);
                    
                deepEqual(positions, expectedPositions, "Positions should match");
            });
            
            test("Engine", function() {
                $(document).chillin();
                
                var element1 = $("#no-position-1"),
                    element2 = $("#no-position-2"),
                    xElement1 = element1.attr("data-x"),
                    yElement1 = element1.attr("data-y"),
                    xElement2 = element2.attr("data-x"),
                    yElement2 = element2.attr("data-y"),
                    differentPosition = (xElement1 !== xElement2)
                                        || (yElement1 !== yElement2);
                
                ok(differentPosition, "Element whose positionning is left to "+
                                        " Chillin should have different "+
                                        "coordinates");
                
                var referenceElement = $("#no-position-2"),
                    diveElement = $("#dive-position"),
                    sameDivePositionXY = (referenceElement.attr("data-x") ===
                                            diveElement.attr("data-x"))
                                         &&
                                            (referenceElement.attr("data-y") ===
                                                diveElement.attr("data-y"));
                                                
                ok(sameDivePositionXY, "Dive should preserve x and y");
                
                var differentZ = (referenceElement.attr("data-z") !==
                                            diveElement.attr("data-z"));
                ok(differentZ, "Dive should change z");
                                            
                var backElement = $("#back-position");
                differentZ = (backElement.attr("data-z") !==
                                            diveElement.attr("data-z"));
                ok(differentZ, "Back should change z");
                
                var sameBackPositionXY = (backElement.attr("data-x") ===
                                            diveElement.attr("data-x"))
                                         &&
                                            (backElement.attr("data-y") ===
                                                diveElement.attr("data-y"));
                                                
                ok(sameBackPositionXY, "Back should preserve x and y");
                
                var refPositionElement1 = $("#ref-previous-position"),
                    sameY = backElement.attr("data-y")
                                === refPositionElement1.attr("data-y");
                    
                ok(sameY, "The reference positionned element should have "+
                                "the same y as the reference");
                    
                var deltaX200 = (refPositionElement1.attr("data-x") - backElement.attr("data-x"))
                                    === 200;
                
                ok(deltaX200, "The reference positionned element should have "+
                                "a difference of 200 with previous element x");
                
                var refPositionElement2 = $("#ref-no-position-1-position"),
                    sameX = element1.attr("data-x") === refPositionElement2.attr("data-x");
                
                ok(sameX, "The reference positionned element should have the same x as the reference");
                
                var deltaRotate90 = (refPositionElement2.attr("data-rotate") - 0) === 90;
                
                ok(deltaRotate90, "The difference of rotate should be 90");
                
                referenceElement = $("#ref-no-position-1-position");
                var samePositionElement = $("#same-position");
                sameX = referenceElement.attr("data-x") ===
                                samePositionElement.attr("data-x");
                sameY = referenceElement.attr("data-y") ===
                                samePositionElement.attr("data-y");
                var samePosition = sameX && sameY;
                                
                ok(samePosition, "The position should be the same as the previous one");
                
                var refWithNoFormula = $("#ref-with-no-formula");
                sameX = element2.attr("data-x") === refWithNoFormula.attr("data-x"),
                sameY = element2.attr("data-y") === refWithNoFormula.attr("data-y"),
                samePosition = sameX && sameY;
                    
                ok(samePosition , "The position should be the same as the reference");
            });
        };
        
        this.run();
    }
    
    $(document).ready(function() {
        new ChillinTest();
    });
})();