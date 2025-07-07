import React, { useEffect, useState } from 'react';
import './App.css';

const ROWS = 20;
const COLS = 40;
const START_NODE = { row: 10, col: 5 };
const END_NODE = { row: 10, col: 35 };

function App() {
  const [grid, setGrid] = useState([]);
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [algorithm, setAlgorithm] = useState('dijkstra');
  const [stats, setStats] = useState({ visited: 0, path: 0, time: 0 });
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setGrid(createGrid());
  }, [theme]);

  const createGrid = () => {
    const g = [];
    for (let row = 0; row < ROWS; row++) {
      const current = [];
      for (let col = 0; col < COLS; col++) {
        current.push(createNode(row, col));
      }
      g.push(current);
    }
    return g;
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

  const handleMouseUp = () => setMouseIsPressed(false);

  const toggleWall = (grid, row, col) => {
    const newGrid = grid.slice();
    const node = newGrid[row][col];
    if (node.isStart || node.isEnd) return newGrid;
    newGrid[row][col] = { ...node, isWall: !node.isWall };
    return newGrid;
  };

  const getAllNodes = (grid) => grid.flat();

  const getUnvisitedNeighbors = (node, grid) => {
    const { row, col } = node;
    const neighbors = [];
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < ROWS - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < COLS - 1) neighbors.push(grid[row][col + 1]);
    return neighbors.filter(n => !n.isVisited && !n.isWall);
  };

  const dijkstra = (grid, start, end) => {
    const visited = [];
    start.distance = 0;
    const unvisited = getAllNodes(grid);

    while (unvisited.length) {
      unvisited.sort((a, b) => a.distance - b.distance);
      const closest = unvisited.shift();
      if (closest.isWall) continue;
      if (closest.distance === Infinity) return visited;
      closest.isVisited = true;
      visited.push(closest);
      if (closest === end) return visited;

      const neighbors = getUnvisitedNeighbors(closest, grid);
      for (const neighbor of neighbors) {
        if (closest.distance + 1 < neighbor.distance) {
          neighbor.distance = closest.distance + 1;
          neighbor.previousNode = closest;
        }
      }
    }
    return visited;
  };

  const bfs = (grid, start, end) => {
    const queue = [start];
    const visited = [];
    start.isVisited = true;

    while (queue.length) {
      const node = queue.shift();
      visited.push(node);
      if (node === end) return visited;

      const neighbors = getUnvisitedNeighbors(node, grid);
      for (const neighbor of neighbors) {
        neighbor.isVisited = true;
        neighbor.previousNode = node;
        queue.push(neighbor);
      }
    }
    return visited;
  };

  const dfs = (grid, start, end) => {
    const stack = [start];
    const visited = [];

    while (stack.length) {
      const node = stack.pop();
      if (node.isVisited || node.isWall) continue;
      node.isVisited = true;
      visited.push(node);
      if (node === end) return visited;

      const neighbors = getUnvisitedNeighbors(node, grid).reverse();
      for (const neighbor of neighbors) {
        neighbor.previousNode = node;
        stack.push(neighbor);
      }
    }
    return visited;
  };

  const aStar = (grid, start, end) => {
    const openSet = [start];
    start.g = 0;
    start.h = heuristic(start, end);
    start.f = start.h;

    const visited = [];

    while (openSet.length) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      if (current.isWall) continue;

      current.isVisited = true;
      visited.push(current);
      if (current === end) return visited;

      const neighbors = getUnvisitedNeighbors(current, grid);
      for (const neighbor of neighbors) {
        const tempG = current.g + 1;
        if (tempG < neighbor.g) {
          neighbor.g = tempG;
          neighbor.h = heuristic(neighbor, end);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.previousNode = current;
          if (!openSet.includes(neighbor)) openSet.push(neighbor);
        }
      }
    }
    return visited;
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
    path.forEach((node, i) => {
      setTimeout(() => {
        const el = document.getElementById(`node-${node.row}-${node.col}`);
        if (el && !node.isStart && !node.isEnd) el.className = 'node node-path';
      }, 30 * i);
    });
  };

  const animate = (visited, path, time) => {
    visited.forEach((node, i) => {
      setTimeout(() => {
        const el = document.getElementById(`node-${node.row}-${node.col}`);
        if (el && !node.isStart && !node.isEnd) el.className = 'node node-visited';
      }, 10 * i);

      if (i === visited.length - 1) {
        setTimeout(() => {
          animatePath(path);
          setStats({ visited: visited.length, path: path.length, time });
        }, 10 * i + 100);
      }
    });
  };

  const visualize = () => {
    const freshGrid = grid.map(row =>
      row.map(n => ({
        ...n,
        isVisited: false,
        distance: Infinity,
        previousNode: null,
        f: Infinity,
        g: Infinity,
        h: 0
      }))
    );
    setGrid(freshGrid);

    const startNode = freshGrid[START_NODE.row][START_NODE.col];
    const endNode = freshGrid[END_NODE.row][END_NODE.col];

    const startTime = performance.now();
    let visited = [];
    switch (algorithm) {
      case 'dijkstra': visited = dijkstra(freshGrid, startNode, endNode); break;
      case 'bfs': visited = bfs(freshGrid, startNode, endNode); break;
      case 'dfs': visited = dfs(freshGrid, startNode, endNode); break;
      case 'astar': visited = aStar(freshGrid, startNode, endNode); break;
      default: break;
    }
    const path = getShortestPath(endNode);
    const endTime = performance.now();
    animate(visited, path, (endTime - startTime).toFixed(2));
  };

  const clearGrid = () => {
    const freshGrid = grid.map(row =>
      row.map(node => {
        const el = document.getElementById(`node-${node.row}-${node.col}`);
        if (el) {
          el.className = 'node';
          if (node.isStart) el.classList.add('node-start');
          if (node.isEnd) el.classList.add('node-end');
        }
        return createNode(node.row, node.col);
      })
    );
    setGrid(freshGrid);
    setStats({ visited: 0, path: 0, time: 0 });
  };

  const generateMaze = () => {
    const newGrid = grid.map(row =>
      row.map(node => {
        if (!node.isStart && !node.isEnd) {
          return { ...node, isWall: Math.random() < 0.3 };
        }
        return node;
      })
    );
    setGrid(newGrid);
  };

  return (
    <div className="App">
      <h1>🧭 Pathfinding Visualizer</h1>

      <div className="controls">
        <select value={algorithm} onChange={e => setAlgorithm(e.target.value)}>
          <option value="dijkstra">Dijkstra</option>
          <option value="bfs">Breadth-First Search (BFS)</option>
          <option value="dfs">Depth-First Search (DFS)</option>
          <option value="astar">A*</option>
        </select>

        <button onClick={visualize}>Visualize</button>
        <button onClick={generateMaze}>Generate Maze</button>
        <button onClick={clearGrid}>Clear Grid</button>

      </div>

      <div className="stats">
        <span>Visited: {stats.visited}</span>
        <span> | Path: {stats.path}</span>
        <span> | Time: {stats.time} ms</span>
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
