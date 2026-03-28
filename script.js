let GOAL_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const GRID_SIZE = 3;
let currentBoard = [...GOAL_STATE];

// DOM Elements
const boardEl = document.getElementById('game-board');
const goalBoardEl = document.getElementById('goal-board');

const btnSolve = document.getElementById('btn-solve');
const btnAuto = document.getElementById('btn-auto');
const btnNext = document.getElementById('btn-next');
const btnRandomize = document.getElementById('btn-randomize');
const btnRandomizeGoal = document.getElementById('btn-randomize-goal');
const btnReset = document.getElementById('btn-reset');
const inputState = document.getElementById('input-state');
const btnSetState = document.getElementById('btn-set-state');

const statMoves = document.getElementById('stat-moves');
const statExplored = document.getElementById('stat-explored');
const statCost = document.getElementById('stat-cost');
const pathList = document.getElementById('path-list');
const msgBox = document.getElementById('message-box');

let tiles = [];
let goalTiles = [];

// State management
let solutionPath = [];
let currentStepIndex = 0;
let autoPlayInterval = null;
let isSolving = false;
let isManualTracking = false;

// --- Initialization ---

function init() {
    createGoalBoard();
    createBoard();
    updateBoardVisuals();
    attachEventListeners();
    showMessage("Ready to play. Click tiles to solve manually, or use 'Solve Puzzle via AI'!", "info");
}

function createGoalBoard() {
    goalBoardEl.innerHTML = '';
    goalTiles = [];
    for (let i = 0; i < 9; i++) {
        let tile = document.createElement('div');
        tile.classList.add('tile');
        if (i === 0) {
            tile.classList.add('blank');
        } else {
            tile.textContent = i;
        }
        goalBoardEl.appendChild(tile);
        goalTiles[i] = tile;
    }
    
    // Position goal tiles statically
    for (let i = 0; i < GOAL_STATE.length; i++) {
        let val = GOAL_STATE[i];
        let tile = goalTiles[val];
        let col = i % GRID_SIZE;
        let row = Math.floor(i / GRID_SIZE);
        // Using `left` and `top` internally instead of transform for separation
        tile.style.left = `${col * 102 + 4}px`;
        tile.style.top = `${row * 102 + 4}px`;
    }
    inputState.value = currentBoard.join(',');
}

function createBoard() {
    boardEl.innerHTML = '';
    tiles = [];
    for (let i = 0; i < 9; i++) {
        let tile = document.createElement('div');
        tile.classList.add('tile');
        if (i === 0) {
            tile.classList.add('blank');
        } else {
            tile.textContent = i;
            // Add interaction: manual play
            tile.addEventListener('click', () => handleTileClick(i));
        }
        boardEl.appendChild(tile);
        tiles[i] = tile;
    }
}

function handleTileClick(tileValue) {
    if (isSolving || autoPlayInterval) return; // Prevent during animation
    
    let blankIdx = currentBoard.indexOf(0);
    let tileIdx = currentBoard.indexOf(tileValue);
    
    let bRow = Math.floor(blankIdx / 3);
    let bCol = blankIdx % 3;
    let tRow = Math.floor(tileIdx / 3);
    let tCol = tileIdx % 3;
    
    if (Math.abs(bRow - tRow) + Math.abs(bCol - tCol) === 1) {
        
        let prefix = "";
        if (tRow < bRow) prefix = "Down"; 
        else if (tRow > bRow) prefix = "Up";
        else if (tCol < bCol) prefix = "Right";
        else if (tCol > bCol) prefix = "Left";

        // Swap
        currentBoard[blankIdx] = tileValue;
        currentBoard[tileIdx] = 0;
        
        // Manual move implies tracking manual path
        if (!isManualTracking) {
            clearSolution();
            isManualTracking = true;
            solutionPath = [{ board: [...currentBoard], move: "Start", f: getManhattanDistance(currentBoard) }];
            currentStepIndex = 0;
            pathList.innerHTML = '';
        }
        
        currentStepIndex++;
        let currentF = currentStepIndex + getManhattanDistance(currentBoard);
        
        solutionPath.push({
            board: [...currentBoard],
            move: `Move ${tileValue} ${prefix} (Manual)`,
            f: currentF
        });

        statMoves.textContent = currentStepIndex;
        updateBoardVisuals();
        
        // Log manual move to UI
        let div = document.createElement('div');
        div.className = 'path-item active';
        document.querySelectorAll('.path-item').forEach(el => el.classList.remove('active'));
        div.innerHTML = `<span class="path-step">${currentStepIndex}. Move ${tileValue} ${prefix} (Manual)</span><span class="path-cost">f: ${currentF}</span>`;
        pathList.appendChild(div);
        div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        if (currentBoard.toString() === GOAL_STATE.toString()) {
            showMessage("🎉 You Solved the Puzzle Manually! Brilliant! 🎉", "success");
        } else {
            hideMessage();
        }
    }
}

function updateBoardVisuals() {
    for (let i = 0; i < currentBoard.length; i++) {
        let val = currentBoard[i];
        let tile = tiles[val];
        
        let col = i % GRID_SIZE;
        let row = Math.floor(i / GRID_SIZE);
        
        tile.style.left = `${col * 102 + 4}px`;
        tile.style.top = `${row * 102 + 4}px`;
    }
    
    let g = currentStepIndex;
    let h = getManhattanDistance(currentBoard);
    statCost.textContent = g + h;
}

function attachEventListeners() {
    btnRandomize.addEventListener('click', randomizeState);
    if(btnRandomizeGoal) btnRandomizeGoal.addEventListener('click', randomizeGoal);
    btnReset.addEventListener('click', resetBoard);
    btnSetState.addEventListener('click', parseInputState);
    btnSolve.addEventListener('click', () => {
        if (!isSolving) {
            startSolver();
        }
    });
    btnNext.addEventListener('click', playNextMove);
    btnAuto.addEventListener('click', toggleAutoPlay);
}

// --- Logic functions ---

function getInversions(board) {
    let inversions = 0;
    for (let i = 0; i < board.length - 1; i++) {
        for (let j = i + 1; j < board.length; j++) {
            if (board[i] !== 0 && board[j] !== 0 && board[i] > board[j]) {
                inversions++;
            }
        }
    }
    return inversions;
}

function isSolvable(board) {
    return getInversions(board) % 2 === 0;
}

function getManhattanDistance(board) {
    let dist = 0;
    for (let i = 0; i < board.length; i++) {
        let val = board[i];
        if (val !== 0) {
            let targetIdx = GOAL_STATE.indexOf(val);
            let targetX = targetIdx % 3;
            let targetY = Math.floor(targetIdx / 3);
            let currentX = i % 3;
            let currentY = Math.floor(i / 3);
            dist += Math.abs(currentX - targetX) + Math.abs(currentY - targetY);
        }
    }
    return dist;
}

// --- UI Interaction ---

function showMessage(msg, type) {
    msgBox.textContent = msg;
    msgBox.className = `message-box ${type}`;
    msgBox.classList.remove('hidden');
}

function hideMessage() {
    msgBox.classList.add('hidden');
}

function resetBoard() {
    stopAutoPlay();
    currentBoard = [...GOAL_STATE];
    inputState.value = GOAL_STATE.join(',');
    clearSolution();
    updateBoardVisuals();
    showMessage("Board reset to goal state.", "info");
}

function randomizeGoal() {
    stopAutoPlay();
    let oldGoalState = [...GOAL_STATE];
    do {
        GOAL_STATE = [...GOAL_STATE].sort(() => Math.random() - 0.5);
    } while (GOAL_STATE.toString() === oldGoalState.toString());
    
    createGoalBoard();
    
    // Check if the current board is mutually solvable with the new goal
    if (getInversions(currentBoard) % 2 !== getInversions(GOAL_STATE) % 2) {
        fixParity(currentBoard);
        updateBoardVisuals();
    }
    
    clearSolution();
    showMessage("Goal state randomized! (Current board adjusted if necessary to remain solvable).", "info");
}

function fixParity(board) {
    let idx1 = -1, idx2 = -1;
    for (let i = 0; i < board.length; i++) {
        if (board[i] !== 0) {
            if (idx1 === -1) idx1 = i;
            else if (idx2 === -1) { idx2 = i; break; }
        }
    }
    let temp = board[idx1];
    board[idx1] = board[idx2];
    board[idx2] = temp;
}

function randomizeState() {
    stopAutoPlay();
    let iter = 0;
    do {
        currentBoard = [...currentBoard].sort(() => Math.random() - 0.5);
        iter++;
    } while (getInversions(currentBoard) % 2 !== getInversions(GOAL_STATE) % 2 || currentBoard.toString() === GOAL_STATE.toString());
    
    inputState.value = currentBoard.join(',');
    clearSolution();
    updateBoardVisuals();
    showMessage("Board shuffled. Try to solve it manually, or use the A* Solver!", "info");
}

function parseInputState() {
    stopAutoPlay();
    let val = inputState.value.trim();
    let parts = val.split(',').map(x => parseInt(x.trim()));
    
    if (parts.length === 9 && new Set(parts).size === 9 && parts.every(x => x >= 0 && x <= 8)) {
        if (getInversions(parts) % 2 !== getInversions(GOAL_STATE) % 2) {
            showMessage("This puzzle state is UNSOLVABLE against the current Goal State.", "error");
            return;
        }
        currentBoard = parts;
        clearSolution();
        updateBoardVisuals();
        showMessage("Custom state loaded successfully.", "success");
    } else {
        showMessage("Invalid input. Must be 9 unique numbers 0-8 comma-separated.", "error");
    }
}

function clearSolution() {
    solutionPath = [];
    currentStepIndex = 0;
    isManualTracking = false;
    statMoves.textContent = "0";
    statExplored.textContent = "0";
    pathList.innerHTML = '<div class="empty-path">Play manually by clicking tiles! <br><br> Or click Solve to see AI path.</div>';
    
    btnAuto.disabled = true;
    btnNext.disabled = true;
    btnSolve.disabled = false;
    btnSolve.textContent = "Solve Puzzle via AI";
}

// --- A* Solver ---

class PriorityQueue {
    constructor() { this.heap = []; }
    push(node) { this.heap.push(node); this.bubbleUp(this.heap.length - 1); }
    pop() {
        if (this.heap.length === 0) return null;
        const min = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length > 0) { this.heap[0] = end; this.sinkDown(0); }
        return min;
    }
    bubbleUp(index) {
        let node = this.heap[index];
        while (index > 0) {
            let parentIndex = Math.floor((index - 1) / 2);
            let parent = this.heap[parentIndex];
            if (node.f >= parent.f) break;
            this.heap[index] = parent;
            this.heap[parentIndex] = node;
            index = parentIndex;
        }
    }
    sinkDown(index) {
        let node = this.heap[index];
        let length = this.heap.length;
        while (true) {
            let leftChildIdx = 2 * index + 1;
            let rightChildIdx = 2 * index + 2;
            let swap = null;
            if (leftChildIdx < length && this.heap[leftChildIdx].f < node.f) { swap = leftChildIdx; }
            if (rightChildIdx < length) {
                if ((swap === null && this.heap[rightChildIdx].f < node.f) ||
                    (swap !== null && this.heap[rightChildIdx].f < this.heap[leftChildIdx].f)) {
                    swap = rightChildIdx;
                }
            }
            if (swap === null) break;
            this.heap[index] = this.heap[swap];
            this.heap[swap] = node;
            index = swap;
        }
    }
    isEmpty() { return this.heap.length === 0; }
}

function getNeighbors(board) {
    let neighbors = [];
    let zeroIdx = board.indexOf(0);
    let row = Math.floor(zeroIdx / 3);
    let col = zeroIdx % 3;
    let moves = [
        { dRow: -1, dCol: 0, prefix: "Up" },
        { dRow: 1, dCol: 0, prefix: "Down" },
        { dRow: 0, dCol: -1, prefix: "Left" },
        { dRow: 0, dCol: 1, prefix: "Right" }
    ];
    for (let m of moves) {
        let nRow = row + m.dRow;
        let nCol = col + m.dCol;
        if (nRow >= 0 && nRow < 3 && nCol >= 0 && nCol < 3) {
            let nIdx = nRow * 3 + nCol;
            let newBoard = [...board];
            let swappedVal = newBoard[nIdx];
            newBoard[zeroIdx] = swappedVal;
            newBoard[nIdx] = 0;
            neighbors.push({ board: newBoard, move: `Move ${swappedVal} ${getOppositeDir(m.prefix)}` });
        }
    }
    return neighbors;
}

function getOppositeDir(dir) {
    if (dir === "Up") return "Down";
    if (dir === "Down") return "Up";
    if (dir === "Left") return "Right";
    return "Left";
}

function startSolver() {
    if (currentBoard.toString() === GOAL_STATE.toString()) {
        showMessage("Puzzle is already solved!", "success");
        return;
    }
    if (getInversions(currentBoard) % 2 !== getInversions(GOAL_STATE) % 2) {
        showMessage("This puzzle state is UNSOLVABLE strictly against this Goal.", "error");
        return;
    }
    
    isSolving = true;
    isManualTracking = false;
    btnSolve.disabled = true;
    btnSolve.textContent = "Running A*...";
    showMessage("Running A* Search...", "info");
    
    setTimeout(() => {
        let result = solveAStar(currentBoard);
        isSolving = false;
        if (result) {
            buildSolutionPath(result.node);
            statExplored.textContent = result.exploredCount;
            showMessage(`AI Found solution in ${solutionPath.length - 1} moves. Click Auto Play!`, "success");
            
            btnSolve.disabled = true;
            btnNext.disabled = false;
            btnAuto.disabled = false;
            
            renderPathList();
        } else {
            showMessage("Could not find a solution.", "error");
            btnSolve.disabled = false;
            btnSolve.textContent = "Solve Puzzle via AI";
        }
    }, 50);
}

function solveAStar(initialBoard) {
    let pq = new PriorityQueue();
    let startNode = {
        board: initialBoard, g: 0, f: getManhattanDistance(initialBoard), parent: null, move: "Start"
    };
    pq.push(startNode);
    let explored = new Set();
    let exploredCount = 0;
    let gMap = new Map();
    gMap.set(initialBoard.toString(), 0);
    
    while (!pq.isEmpty()) {
        let current = pq.pop();
        let boardStr = current.board.toString();
        if (explored.has(boardStr)) continue;
        exploredCount++;
        if (boardStr === GOAL_STATE.toString()) return { node: current, exploredCount: exploredCount };
        explored.add(boardStr);
        let neighbors = getNeighbors(current.board);
        for (let n of neighbors) {
            let nStr = n.board.toString();
            if (explored.has(nStr)) continue;
            let tentativeG = current.g + 1;
            if (!gMap.has(nStr) || tentativeG < gMap.get(nStr)) {
                gMap.set(nStr, tentativeG);
                let h = getManhattanDistance(n.board);
                let f = tentativeG + h;
                pq.push({ board: n.board, g: tentativeG, f: f, parent: current, move: n.move });
            }
        }
    }
    return null;
}

function buildSolutionPath(endNode) {
    let path = [];
    let curr = endNode;
    while (curr) { path.push(curr); curr = curr.parent; }
    solutionPath = path.reverse();
    currentStepIndex = 0;
    statMoves.textContent = "0"; // Reset moves for the playback
}

function renderPathList() {
    pathList.innerHTML = '';
    solutionPath.forEach((node, idx) => {
        let div = document.createElement('div');
        div.className = 'path-item';
        div.id = `path-item-${idx}`;
        div.innerHTML = `<span class="path-step">${idx}. ${node.move}</span><span class="path-cost">f: ${node.f}</span>`;
        pathList.appendChild(div);
    });
    highlightCurrentStep();
}

function highlightCurrentStep() {
    document.querySelectorAll('.path-item').forEach(el => el.classList.remove('active'));
    let activeItem = document.getElementById(`path-item-${currentStepIndex}`);
    if (activeItem) {
        activeItem.classList.add('active');
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function playNextMove() {
    if (currentStepIndex < solutionPath.length - 1) {
        isSolving = true;
        currentStepIndex++;
        currentBoard = solutionPath[currentStepIndex].board;
        statMoves.textContent = currentStepIndex;
        updateBoardVisuals();
        highlightCurrentStep();
        if (currentStepIndex === solutionPath.length - 1) {
            btnNext.disabled = true;
            stopAutoPlay();
            isSolving = false;
            showMessage("Goal Reached automatically!", "success");
        }
        setTimeout(() => isSolving = false, 300); // Wait for CSS transition
    }
}

function toggleAutoPlay() {
    if (autoPlayInterval) {
        stopAutoPlay();
    } else {
        if (currentStepIndex >= solutionPath.length - 1) {
            currentStepIndex = 0;
            currentBoard = solutionPath[0].board;
            statMoves.textContent = "0";
            updateBoardVisuals();
            highlightCurrentStep();
            hideMessage();
        }
        btnAuto.textContent = "Stop Auto";
        btnAuto.classList.add('btn-primary');
        btnNext.disabled = true;
        
        autoPlayInterval = setInterval(() => {
            playNextMove();
        }, 500);
    }
}

function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
        btnAuto.textContent = "Auto Play";
        btnAuto.classList.remove('btn-primary');
        if (currentStepIndex < solutionPath.length - 1 && solutionPath.length > 0) {
            btnNext.disabled = false;
        }
    }
}

// Start
init();

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => console.log('SW Registered!')).catch(err => console.log('SW failed: ', err));
    });
}
