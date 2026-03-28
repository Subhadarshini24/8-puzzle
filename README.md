# 8-Puzzle Game Solver using A*

An interactive **8-puzzle game solver** built using the **A\*** search algorithm.  
The project solves the classic puzzle by finding the best path from the initial state to the goal state using a heuristic-based approach.

* Problem Statement

The 8-puzzle consists of a **3×3 board** with 8 numbered tiles and one blank space.  
The goal is to arrange the tiles in the correct order by moving the blank tile one step at a time.

* Goal State
1 2 3
4 5 6
7 8 0
Here, 0 represents the blank tile.

Features:
--> Solves the 8-puzzle using A* algorithm
--> Uses Manhattan Distance as the heuristic
--> Checks whether the puzzle is solvable before solving
--> Displays the step-by-step solution path
--> Shows the number of moves required
--> Helps understand AI search techniques in a simple and practical way

Algorithm Used:
  This project uses the A* search algorithm:
              f(n) = g(n) + h(n)Heuristic
                                      Where:
                                          g(n) = cost from the start state
                                          h(n) = heuristic cost to the goal state
                                          f(n) = total estimated cost

                                          
The heuristic used in this project is Manhattan Distance.For each tile, it calculates how far the tile is from its correct position in the goal state.

Solvability Check:
Before solving the puzzle, the program checks whether the given state is solvable using inversion count.

--> If inversion count is even → the puzzle is solvable
--> If inversion count is odd → the puzzle is not solvable

How It Works:
--> Take the initial puzzle state
--> Check if the puzzle is solvable
--> Use A* search to explore possible moves
--> Select the state with the lowest f(n) value
--> Continue until the goal state is reached
--> Display the full solution path
                                     
