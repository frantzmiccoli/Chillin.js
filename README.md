Chillin.js
==========
A layout engine on top of [impress.js](http://bartaz.github.io/impress.js/ "impress.js").

The global idea
---------------
Chillin.js provides a convenient way to position slides inside an impress.js presentation. It has two requirements: jQuery and impress.js (currently works with jQuery 1.9.1 and impress.js 0.5.3).

The problem to solve
--------------------
impress.js is a powerful way to convey ideas, nevertheless it can be a bit challenging to correctly position all your workflow.

For example, you can use impress.js to do impressive "combined" slides where you switch to an element of only one view at each slide. This is awesome, but two cases may occure:

* You may want to have two (or more) **sets of "combined" slides**, independent one from another
* You may want to keep the basic-and-old-school "one slide per slide", to make it more clear: **one visible content per slide**

In those two cases editing one single slide position may force you to update your whole presentation.

Moreover you may also, want to avoid positionning everything manually, anything simple would suit you.

How to use it?
--------------

### Simple setup
First you need to include `chillin.js` (the one in `bin`) and call it before calling impress.js.

    <script src="./lib/jquery-1.9.1.min.js"></script>
    <script src="./lib/impress.js"></script>
    <script src="./lib/chillin.js"></script>
    <script>
    	$(document).ready(function() {
	        $(document).chillin();
        	impress().init();
    	});
    </script>
    
### Chillin options

The most interesting option that can be pass to chillin might be `layoutAlgorithm`, its value is defining **how to position slides by default** (if not positionned in another way). Its possible values are: `inspiral` (default), `outspiral`, and side to side like `bottomtoprightleft` and `leftrightbottomtop` (from left to right and bottom to top).

To make it clear, this is how `inspiral` is positionning the slides:
    
    -----------------<
    |
    | ------------<- |
    | |              |
    | |   <-------   |
    | |           |  |
    | |--------<--   ^
    |________________|
    
An exemple to avoid misunderstanding.
    
    <script>
    	$(document).ready(function() {
	        $(document).chillin({
	            layoutAlgorithm: 'outspiral'
	        });
        	impress().init();
    	});
    </script>
    
Other options interesting options are:

* gridCellWidth (default 2500), gridCellHeight (default 2500) that define the size of the layout cells, increase this ones if you see some empty cell
* gridXMinLimit (default -10), gridXMaxLimit (default 10), gridYMinLimit (default -10), gridYMaxLimit (default 10): define the maximum size of the grid, if you have a lot of content you might want to increase this
* diveZDelta (default -500), diveScaleFactor (default 0.1), that configure the dive effect impact on respectively data-z and data-scale.

### Then a simple slide
A slide you don't want to position manually:

    <div id="simple-slide" class="step">
        <h3>My slide title</h3>
        <p>...</p>
    </div>

### Position relative to a previous slide
Somewhere after you want to add something a bit below the one previously mentionned:

    <div class="step" data-y="%+100" data-style="ref-simple-slide">
        <h3>My other slide title</h3>
        <p>...</p>
    </div>

The `%` indicates the previous value of the attribute in the reference element. **It should go first** and be used with `+`, `-`, `*` and `/`. You can use it on `data-x`, `data-y`, `data-rotate`, `data-scale` and `data-z`. The `data-syle="ref-some-id"` is optionnal, **a slide with an id `some-id` must exist previously in the DOM**, by default the previous slide is used as a reference.


### Same position

You want to keep the same position?

    <div class="step" data-style="same">
        <p>...</p>
    </div>

### Dive effect
If you want to make a `dive` effect on a slide:

    <div class="step" data-style="dive">
        <p>...</p>
    </div>
    
    <div class="step" data-style="back">
        <!-- we leave this one empty to go back on a previous position -->
    </div>
    
### Overview
Positionning the overview slide is also a difficult thing, don't worry, Chillin.js handles it to.

    <div class="step" data-style="overview">
    </div>
    
### Troubleshooting

If one of your combined slides zone is too big (many slide position relatively to one another) **you can break the global layout by consuming grid cells you shouldn't**. The solution is to work with larger grid cells.
    
    $(document).chillin({
        gridCellWidth: "10000",
        gridCellHeight: "10000",
    });
    
License
-------

Copyright 2013 Fräntz Miccoli

Released under the MIT