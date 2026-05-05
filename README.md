# Smart City MST Optimizer

A full-stack **Minimum Spanning Tree** simulator for Smart City network optimization.
Implements **Kruskal's** and **Prim's** algorithms with animated step-by-step visualization.

---

## Project Structure

```
smart-city-mst/
├── backend/
│   ├── server.js       ← Node.js + Express REST API
│   └── package.json
└── frontend/
    └── index.html      ← Full interactive visualizer (connects to backend)
```

---

## Backend Setup

```bash
cd backend
npm install
npm start
# Server runs at http://localhost:3001
```

### API Endpoints

| Method | Endpoint           | Description                          |
|--------|--------------------|--------------------------------------|
| GET    | /api/health        | Server health check                  |
| GET    | /api/presets       | List all preset city configurations  |
| GET    | /api/presets/:key  | Get full preset data (small/medium/large) |
| POST   | /api/validate      | Validate graph structure             |
| POST   | /api/stats         | Get graph statistics (density, hub, etc.) |
| POST   | /api/mst/kruskal   | Run Kruskal's algorithm              |
| POST   | /api/mst/prim      | Run Prim's algorithm                 |
| POST   | /api/mst/compare   | Compare both algorithms side by side |

### Request Body (for MST endpoints)

```json
{
  "nodes": [
    { "id": 0, "label": "A" },
    { "id": 1, "label": "B" }
  ],
  "edges": [
    { "id": 0, "n1": 0, "n2": 1, "weight": 5 }
  ]
}
```

---

## Frontend Usage

Open `frontend/index.html` in any modern browser.

### Features
- **Backend API integration** — click **PING** to connect; all simulations run server-side
- **Local fallback** — works fully offline when API is unavailable
- **Algorithm toggle** — switch between Kruskal's and Prim's
- **Edit modes** — add cities, draw edges with custom weights, remove elements
- **Step-by-step animation** — watch the MST build edge by edge
- **Compare mode** — run both algorithms via API and compare results
- **Graph stats** — density, hub node, degree distribution (API)
- **Presets** — Small City (6), Metro Area (9), Smart City (12 nodes)

### How to Connect Frontend to Backend
1. Start the backend server (`npm start`)
2. Open `index.html` in a browser
3. The app auto-pings `http://localhost:3001` on load
4. If the **API: ONLINE** chip appears green, you're connected
5. All simulations will now use the backend for computation

---

## Algorithms

### Kruskal's Algorithm
- Sort all edges by weight
- Greedily add the cheapest edge that doesn't form a cycle
- Uses **Union-Find** (Disjoint Set Union) with path compression + rank

### Prim's Algorithm
- Start from any node
- Greedily expand the MST by picking the minimum-weight edge to an unvisited node
- Runs until all nodes are included

Both algorithms guarantee the **globally optimal MST** for connected undirected weighted graphs.

---

## Real-World Application

This simulates **smart city cable/fiber network planning**:
- **Nodes** = city districts / infrastructure hubs
- **Edges** = possible cable routes
- **Weights** = installation cost / distance
- **MST** = minimum cost network that keeps all districts connected

The cost savings shown reflect how much cable infrastructure is avoided vs a fully-connected network.
