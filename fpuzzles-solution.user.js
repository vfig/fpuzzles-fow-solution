// ==UserScript==
// @name         Fpuzzles-Solution
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Can input a solution to a puzzle
// @author       Rangsk
// @match        https://*.f-puzzles.com/*
// @match        https://f-puzzles.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const numSolutionToolsRows = 4;

    const doShim = function() {
        // Additional import/export data
        const origExportPuzzle = window.exportPuzzle;
        window.exportPuzzle = function(includeCandidates) {
            const compressed = origExportPuzzle(includeCandidates);
            const puzzle = JSON.parse(compressor.decompressFromBase64(compressed));
            if (window.grid.solution) {
                puzzle.solution = window.grid.solution;
            }
            return compressor.compressToBase64(JSON.stringify(puzzle));
        }

        const origImportPuzzle = window.importPuzzle;
        window.importPuzzle = function(string, clearHistory) {
            origImportPuzzle(string, clearHistory);

            const puzzle = JSON.parse(compressor.decompressFromBase64(string));
            if (puzzle.solution) {
                window.grid.solution = puzzle.solution;
            } else if (window.grid.solution !== undefined) {
                delete window.grid.solution;
            }
        }

        const origCreateSidebars = window.createSidebars;
        window.createSidebars = function() {
            origCreateSidebars();

            const sidebar = window.sidebars[0];
            sidebar.show = function() {
                if (this.modes.includes(mode)) {
                    ctx.lineWidth = lineWW;
                    ctx.fillStyle = boolSettings['Dark Mode'] ? '#404040' : '#D0D0D0';
                    ctx.strokeStyle = boolSettings['Dark Mode'] ? '#202020' : '#808080';
                    ctx.fillRect(this.x - sidebarW / 2, gridY, sidebarW, gridSL + 35);
                    ctx.strokeRect(this.x - sidebarW / 2, gridY, sidebarW, gridSL + 35);

                    for (var a = 0; a < this.sections.length; a++)
                        this.sections[a].show();
                    for (var a = 0; a < this.buttons.length; a++)
                        this.buttons[a].show();
                }
            }

            const cosmeticToolsButton = sidebars[0].buttons.find(b => b.id === 'CosmeticTools');
            const solutionToolsX = cosmeticToolsButton.x;
            const solutionToolsY = cosmeticToolsButton.y + buttonSH + buttonGap;
            const solutionToolsButton = new button(solutionToolsX, solutionToolsY, buttonW, buttonSH, ['Setting'], 'SolutionTools', 'Solution Tools', true, true);
            sidebar.buttons.push(solutionToolsButton);
            solutionToolsButton.click = function() {
                if (!this.hovering() || !this.modes.includes(window.mode)) {
                    return;
                }
                togglePopup('SolutionTools');
            }

            const baseX = gridX - (sidebarDist + sidebarW / 2) + sidebarW;
            const baseY = gridY + gridSL + 35 - ((buttonSH * numSolutionToolsRows) + (buttonGap * (numSolutionToolsRows - 1)) + buttonMargin);
            const narrowButtonGap = 6;
            const narrowButtonW = buttonW / 2 - narrowButtonGap;
            const saveSolutionButton = new button(baseX, baseY + (buttonSH + buttonGap) * 0, buttonW, buttonSH, ['SolutionTools'], 'SaveSolution', 'Save Solution');
            const viewSolutionButton = new button(baseX, baseY + (buttonSH + buttonGap) * 1, buttonW, buttonSH, ['SolutionTools'], 'ViewSolution', 'View Solution');
            const clearSolutionButton = new button(baseX, baseY + (buttonSH + buttonGap) * 2, buttonW, buttonSH, ['SolutionTools'], 'ClearSolution', 'Clear Solution');

            const copySolutionButton = new button(baseX - narrowButtonW / 2 - narrowButtonGap, baseY + (buttonSH + buttonGap) * 3, narrowButtonW, buttonSH, ['SolutionTools'], 'CopySolution', 'Copy');
            const pasteSolutionButton = new button(baseX + narrowButtonW / 2 + narrowButtonGap, baseY + (buttonSH + buttonGap) * 3, narrowButtonW, buttonSH, ['SolutionTools'], 'PasteSolution', 'Paste');

            saveSolutionButton.click = function() {
                if (!this.hovering()) {
                    return;
                }
                let solution = [];
                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {
                        let value = window.grid[i][j].value;
                        if (value == 0) {
                            value = '.';
                        }
                        solution.push(value);
                    }
                }
                if(solution.every(value => value === '.')) {
                    // Solution is entirely blank
                    delete window.grid.solution;
                }
                else {
                    window.grid.solution = solution;
                }
                return true;
            }

            viewSolutionButton.click = function() {
                if (!this.hovering()) {
                    return;
                }
                if (window.grid.solution) {
                    const solution = window.grid.solution;
                    for (let i = 0; i < size; i++) {
                        for (let j = 0; j < size; j++) {
                            let value = solution[i * size + j];
                            if (value == '.') {
                                value = 0;
                            }
                            window.grid[i][j].value = value;
                        }
                    }
                }
                return true;
            }

            clearSolutionButton.click = function() {
                if (!this.hovering()) {
                    return;
                }
                delete window.grid.solution;
                return true;
            }

            copySolutionButton.click = function() {
                if (!this.hovering()) {
                    return;
                }

                var getCellSolution;
                if (window.grid.solution) {
                    const solution = window.grid.solution;
                    getCellSolution = function(i, j) {
                        let value = solution[i * size + j];
                        if (value == '.') {
                            value = 0;
                        }
                        return value;
                    }
                } else {
                    getCellSolution = function(i, j) {
                        return 0;
                    }
                }

                var solutionText = "";
                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {
                        solutionText += getCellSolution(i, j).toString();
                    }
                    solutionText += "\n";
                }

                navigator.clipboard.writeText(solutionText);

                return true;
            }

            pasteSolutionButton.click = function() {
                if (!this.hovering()) {
                    return;
                }

                navigator.clipboard.readText().then((solutionText) => {
                    // Strip whitespace and validate the clipboard text.
                    const pattern = /^[0-9 \t\r\n]+$/;
                    if (! pattern.test(solutionText)) {
                        alert("Paste error: text must be only digits 0-9.");
                        return false;
                    }
                    solutionText = solutionText.replaceAll(/[ \t\r\n]/g, '');
                    if (solutionText.length!==(size * size)) {
                        alert("Paste error: text must have exactly "+(size * size)+" digits.");
                        return false;
                    }

                    // Parse out the solution digits.
                    let solution = [];
                    const zeroCode = "0".charCodeAt(0);
                    for (let i = 0; i < size * size; i++) {
                        var digit = solutionText.charCodeAt(i) - zeroCode;
                        if (digit==0) {
                            solution.push('.');
                        } else {
                            solution.push(digit);
                        }
                    }
                    window.grid.solution = solution;

                    // View the solution, so it is clear the paste worked.
                    for (let i = 0; i < size; i++) {
                        for (let j = 0; j < size; j++) {
                            let value = solution[i * size + j];
                            if (value == '.') {
                                value = 0;
                            }
                            window.grid[i][j].value = value;
                        }
                    }
                });

                return true;
            }

            sidebar.buttons.push(saveSolutionButton);
            sidebar.buttons.push(viewSolutionButton);
            sidebar.buttons.push(clearSolutionButton);
            sidebar.buttons.push(copySolutionButton);
            sidebar.buttons.push(pasteSolutionButton);
        }

        const origDrawPopups = window.drawPopups;
        window.drawPopups = function(overlapSidebars) {
            origDrawPopups(overlapSidebars);

            if (overlapSidebars) {
                return;
            }

            if (popup === "SolutionTools") {
                ctx.lineWidth = lineWW;
                ctx.fillStyle = boolSettings['Dark Mode'] ? '#404040' : '#D0D0D0';
                ctx.strokeStyle = boolSettings['Dark Mode'] ? '#202020' : '#808080';
                ctx.fillRect(gridX - sidebarDist, gridY + gridSL + 35, sidebarW, -((buttonSH * numSolutionToolsRows) + (buttonGap * (numSolutionToolsRows - 1)) + (buttonMargin * 2)));
                ctx.strokeRect(gridX - sidebarDist, gridY + gridSL + 35, sidebarW, -((buttonSH * numSolutionToolsRows) + (buttonGap * (numSolutionToolsRows - 1)) + (buttonMargin * 2)));
            }
        }

        const origMouseMove = document.onmousemove;
        document.onmousemove = function(e) {
            origMouseMove(e);
            if (!testPaused() && !disableInputs) {
                if (sidebars.length) {
                    var hoveredButton = sidebars[sidebars.findIndex(a => a.title === 'Constraints')].buttons[sidebars[sidebars.findIndex(a => a.title === 'Constraints')].buttons.findIndex(a => a.id === 'SolutionTools')];
                    if (popup === 'SolutionTools' && (mouseX < hoveredButton.x - hoveredButton.w / 2 - buttonMargin || mouseX > hoveredButton.x + hoveredButton.w / 2 + buttonMargin || mouseY < hoveredButton.y - buttonMargin || mouseY > hoveredButton.y + buttonSH + buttonMargin) &&
                        (mouseX < gridX - sidebarDist || mouseX > gridX - sidebarDist + sidebarW + (buttonGap + buttonSH) * 2 || mouseY < gridY + gridSL + 35 - ((buttonSH * numSolutionToolsRows) + (buttonGap * (numSolutionToolsRows - 1)) + (buttonMargin * 2)) || mouseY > gridY + gridSL + 35)) {
                        closePopups();
                    }
                }
            }
        }

        const origCandidatePossibleInCell = window.candidatePossibleInCell;
        window.candidatePossibleInCell = function(n, cell, options) {
            if (n < 1 || n > size)
                return false;
            if (!options)
                options = {};
            if (!options.bruteForce && cell.value)
                return cell.value === n;

            // If there is no solution, then all candidates are possible
            if (!window.grid.solution) {
                return origCandidatePossibleInCell(n, cell, options);
            }

            // Cells that are set to 0 can be ignored
            const solutionVal = window.grid.solution[cell.i * size + cell.j];
            if (solutionVal === 0) {
                return origCandidatePossibleInCell(n, cell, options);
            }

            // Only use the solution if all cells are filled
            var allFilled = true;
            for (var i = 0; i < size; i++) {
                for (var j = 0; j < size; j++) {
                    if (grid[i][j].value === 0) {
                        allFilled = false;
                        break;
                    }
                }
            }
            if (!allFilled) {
                return origCandidatePossibleInCell(n, cell, options);
            }

            // Check against the solution
            return solutionVal === n;
        }

        if (window.sidebars && window.sidebars.length && window.boolConstraints) {
            createSidebars();
            onInputEnd();
        }

        if (window.boolConstraints) {
            let prevButtons = buttons.splice(0, buttons.length);
            window.onload();
            buttons.splice(0, buttons.length);
            for (let i = 0; i < prevButtons.length; i++) {
                buttons.push(prevButtons[i]);
            }
        }
    }

    let intervalId = setInterval(() => {
        if (typeof exportPuzzle === 'undefined' ||
            typeof importPuzzle === 'undefined' ||
            typeof createSidebars === 'undefined' ||
            typeof drawPopups === 'undefined' ||
            typeof candidatePossibleInCell === 'undefined') {
            return;
        }

        clearInterval(intervalId);
        doShim();
    }, 16);
})();