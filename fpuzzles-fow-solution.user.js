// ==UserScript==
// @name         Fpuzzles-FOW-Solution
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Adds Fog of War solving f-puzzles. Requires Fpuzzles-FOW, Fpuzzles-Solution
// @author       vfig
// @match        https://*.f-puzzles.com/*
// @match        https://f-puzzles.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==
//
// Requires the following userscripts to be active:
//   - Fpuzzles-FOW:  (https://github.com/yusitnikov/fpuzzles-fow-bulb/raw/main/fpuzzles-fow-bulb.user.js)
//   - Fpuzzles-Solution: (https://gist.github.com/dclamage/63cc6241752dbeb1214328f4ae655cf7)
//
// As soon as a solution is set, the fog of war will be active. In 'Setting'
// mode it will be almost transparent. Bulb cosmetics and correct digits will
// lift the fog of war in adjacent cells.

(() => {
    const doShim = () => {
        const origDrawGrid = drawGrid;
        drawGrid = function() {
            origDrawGrid();

            if (grid.solution===undefined)
                return;
            if (cosmetics.fogofwarbulb===undefined)
                return;

            let gridWidth = grid[0].length;
            let gridHeight = grid.length;

            var bulbs = {};
            if (cosmetics.fogofwarbulb!==undefined) {
                for (var b of cosmetics.fogofwarbulb) {
                    let n = b.cell.i*gridWidth+b.cell.j;
                    bulbs[n] = true;
                }
            }

            let cellIsLit = function(i,j) {
                if (i<0||i>=gridWidth) return false;
                if (j<0||j>=gridHeight) return false;
                let n = j*gridWidth+i;
                if (bulbs[n]) return true;
                var cellValue = grid[j][i].value;
                var cellSolution = grid.solution[n];
                return (cellValue===cellSolution);
            };

            ctx.save();
            // ctx.translate(gridX, gridY);
            // ctx.scale(cellSL, cellSL);
            for (var y=0; y<grid.length; ++y) {
                var row = grid[y];
                for (var x=0; x<row.length; ++x) {
                    var lit = false;
                    for (var dy=-1; dy<=1; ++dy)
                        for (var dx=-1; dx<=1; ++dx)
                            if (cellIsLit(x+dx,y+dy))
                                lit = true;
                    if (!lit) {
                        let c = grid[y][x];
                        if (mode==="Solving") {
                            ctx.fillStyle = '#888';
                            ctx.fillRect(c.x, c.y, cellSL, cellSL);
                            if(c.highlight){
                                ctx.globalAlpha = 0.5;
                                ctx.fillStyle = highlightCs[previewMode ? 0 : c.highlight];
                                ctx.fillRect(c.x, c.y, cellSL, cellSL);
                                ctx.globalAlpha = 1.0;
                            }
                            c.showTop();
                        } else {
                            ctx.globalAlpha = 0.2;
                            ctx.fillStyle = '#888';
                            ctx.fillRect(c.x, c.y, cellSL, cellSL);
                            ctx.globalAlpha = 1.0;
                        }
                    }
                }
            }
            ctx.restore();
            // BUG: this script causes the tab to run out of memory eventually!
            //      its unclear to me why? i am saving+restoring.

            for (var y=0; y<grid.length; ++y) {
                var row = grid[y];
                for (var x=0; x<row.length; ++x) {
                    let c = grid[y][x];
                    c.showSelection();
                    c.showOutline();
                }
            }
        }
    };

    const intervalId = setInterval(() => {
        if (typeof grid === 'undefined' ||
            typeof drawGrid === 'undefined') {
            return;
        }

        clearInterval(intervalId);
        doShim();
    }, 16);
})();
