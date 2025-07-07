import React, { useState, useEffect } from 'react';
import './App.css';

const ROWS = 20;
const COLS = 40;
const START_NODE = { row: 10, col: 5 };
const END_NODE = { row: 10, col: 35 };

function App() {
  const [grid, setGrid] = useState([]);
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [algorithm, setAlgorithm] = useState('dijkstra');

  useEffect(() => {
    setGrid(createGrid());
  }, []);

  const createGrid = () => {
    const initialGrid = [];
    for (let row = 0; row < ROWS; row++) {
      const currentRow = [];
      for (let col = 0; col < COLS; col++) {
        currentRow.push(createNode(row, col));
      }
      initialGrid.push(currentRow);
    }
    return initialGrid;
  };

  const createNode = (row, col) => ({
    row,
    col,
    isStart: row === START_NODE.row && col === START_NODE.col,
    isEnd: row === END_NODE.row && col === END_NODE.col,
    isWall: false,
    isVisited: false,
    distance: Infinity,
    previousNode: null,
    f: Infinity,
    g: Infinity,
    h: 0,
  });

  const toggleWall = (grid, row, col) => {
    const newGrid = grid.slice();
    const node = newGrid[row][col];
    if (node.isStart || node.isEnd) return newGrid;
    const newNode = { ...node, isWall: !node.isWall };
    newGrid[row][col] = newNode;
    return newGrid;
  };

  const handleMouseDown = (row, col) => {
    const newGrid = toggleWall(grid, row, col);
    setGrid(newGrid);
    setMouseIsPressed(true);
  };

  const handleMouseEnter = (row, col) => {
    if (!mouseIsPressed) return;
    const newGrid = toggleWall(grid, row, col);
    setGrid(newGrid);
  };

  const handleMouseUp = () => {
    setMouseIsPressed(false);
  };

  const getAllNodes = (grid) => {
    const nodes = [];
    for (const row of grid) {
      for (const node of row) {
        nodes.push(node);
      }
    }
    return nodes;
  };

  const getUnvisitedNeighbors = (node, grid) => {
    const { row, col } = node;
    const neighbors = [];
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < ROWS - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < COLS - 1) neighbors.push(grid[row][col + 1]);
    return neighbors.filter(n => !n.isVisited && !n.isWall);
  };

  const dijkstra = (grid, startNode, endNode) => {
    const visitedNodes = [];
    startNode.distance = 0;
    const unvisited = getAllNodes(grid);

    while (unvisited.length) {
      unvisited.sort((a, b) => a.distance - b.distance);
      const closest = unvisited.shift();
      if (closest.isWall) continue;
      if (closest.distance === Infinity) return visitedNodes;

      closest.isVisited = true;
      visitedNodes.push(closest);
      if (closest === endNode) return visitedNodes;

      const neighbors = getUnvisitedNeighbors(closest, grid);
      for (const neighbor of neighbors) {
        const alt = closest.distance + 1;
        if (alt < neighbor.distance) {
          neighbor.distance = alt;
          neighbor.previousNode = closest;
        }
      }
    }

    return visitedNodes;
  };

  const bfs = (grid, startNode, endNode) => {
    const queue = [startNode];
    const visitedNodes = [];
    startNode.isVisited = true;

    while (queue.length) {
      const node = queue.shift();
      visitedNodes.push(node);
      if (node === endNode) return visitedNodes;

      const neighbors = getUnvisitedNeighbors(node, grid);
      for (const neighbor of neighbors) {
        neighbor.isVisited = true;
        neighbor.previousNode = node;
        queue.push(neighbor);
      }
    }

    return visitedNodes;
  };

  const dfs = (grid, startNode, endNode) => {
    const stack = [startNode];
    const visitedNodes = [];

    while (stack.length) {
      const node = stack.pop();
      if (node.isVisited || node.isWall) continue;
      node.isVisited = true;
      visitedNodes.push(node);
      if (node === endNode) return visitedNodes;

      const neighbors = getUnvisitedNeighbors(node, grid).reverse();
      for (const neighbor of neighbors) {
        if (!neighbor.isVisited) {
          neighbor.previousNode = node;
          stack.push(neighbor);
        }
      }
    }

    return visitedNodes;
  };

  const aStar = (grid, startNode, endNode) => {
    const openSet = [startNode];
    startNode.g = 0;
    startNode.h = heuristic(startNode, endNode);
    startNode.f = startNode.h;

    const visitedNodes = [];

    while (openSet.length) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      if (current.isWall) continue;

      current.isVisited = true;
      visitedNodes.push(current);

      if (current === endNode) return visitedNodes;

      const neighbors = getUnvisitedNeighbors(current, grid);
      for (const neighbor of neighbors) {
        const tentativeG = current.g + 1;
        if (tentativeG < neighbor.g) {
          neighbor.g = tentativeG;
          neighbor.h = heuristic(neighbor, endNode);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.previousNode = current;
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    return visitedNodes;
  };

  const heuristic = (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

  const getShortestPath = (endNode) => {
    const path = [];
    let current = endNode;
    while (current !== null) {
      path.unshift(current);
      current = current.previousNode;
    }
    return path;
  };

  const animatePath = (path) => {
    for (let i = 0; i < path.length; i++) {
      setTimeout(() => {
        const node = path[i];
        const el = document.getElementById(`node-${node.row}-${node.col}`);
        if (el && !node.isStart && !node.isEnd)
          el.className = 'node node-path';
      }, 30 * i);
    }
  };

  const animate = (visitedNodes, path) => {
    for (let i = 0; i <= visitedNodes.length; i++) {
      if (i === visitedNodes.length) {
        setTimeout(() => {
          animatePath(path);
        }, 10 * i);
        return;
      }
      setTimeout(() => {
        const node = visitedNodes[i];
        const el = document.getElementById(`node-${node.row}-${node.col}`);
        if (el && !node.isStart && !node.isEnd)
          el.className = 'node node-visited';
      }, 10 * i);
    }
  };

  const visualize = () => {
    const newGrid = grid.slice().map(row =>
      row.map(node => ({
        ...node,
        isVisited: false,
        distance: Infinity,
        previousNode: null,
        f: Infinity,
        g: Infinity,
        h: 0,
      }))
    );
    setGrid(newGrid);

    const startNode = newGrid[START_NODE.row][START_NODE.col];
    const endNode = newGrid[END_NODE.row][END_NODE.col];

    let visited;
    switch (algorithm) {
      case 'dijkstra':
        visited = dijkstra(newGrid, startNode, endNode);
        break;
      case 'bfs':
        visited = bfs(newGrid, startNode, endNode);
        break;
      case 'dfs':
        visited = dfs(newGrid, startNode, endNode);
        break;
      case 'astar':
        visited = aStar(newGrid, startNode, endNode);
        break;
      default:
        visited = [];
    }
    const path = getShortestPath(endNode);
    animate(visited, path);
  };

  const clearGrid = () => {
    const newGrid = grid.map((row) =>
      row.map((node) => {
        const el = document.getElementById(`node-${node.row}-${node.col}`);
        if (el) {
          el.className = 'node';
          if (node.isStart) el.classList.add('node-start');
          else if (node.isEnd) el.classList.add('node-end');
        }

        return {
          ...node,
          isVisited: false,
          isPath: false,
          isWall: false,
          distance: Infinity,
          previousNode: null,
          f: Infinity,
          g: Infinity,
          h: 0,
        };
      })
    );
    setGrid(newGrid);
  };

  return (
    <div className="App">
      <h1>Pathfinding Visualizer</h1>
      <div style={{ marginBottom: '10px' }}>
        <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
          <option value="dijkstra">Dijkstra</option>
          <option value="bfs">BFS</option>
          <option value="dfs">DFS</option>
          <option value="astar">A*</option>
        </select>
        <button onClick={visualize}>Visualize</button>
        <button onClick={clearGrid}>Clear</button>
      </div>
      <div className="grid">
        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="grid-row">
            {row.map((node, nodeIdx) => {
              const { row, col, isStart, isEnd, isWall } = node;
              let className = 'node';
              if (isStart) className += ' node-start';
              else if (isEnd) className += ' node-end';
              else if (isWall) className += ' node-wall';
              return (
                <div
                  key={nodeIdx}
                  id={`node-${row}-${col}`}
                  className={className}
                  onMouseDown={() => handleMouseDown(row, col)}
                  onMouseEnter={() => handleMouseEnter(row, col)}
                  onMouseUp={handleMouseUp}
                ></div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
