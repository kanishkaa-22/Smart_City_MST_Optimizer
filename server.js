/**
 * Smart City MST Optimizer — Backend Server
 * Node.js + Express REST API
 * 
 * Endpoints:
 *   POST /api/mst/kruskal   — Run Kruskal's algorithm
 *   POST /api/mst/prim      — Run Prim's algorithm
 *   POST /api/validate      — Validate graph connectivity
 *   GET  /api/presets       — Return built-in city presets
 *   POST /api/stats         — Compute graph statistics
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Union-Find (Disjoint Set) for Kruskal ───────────────────────────────────

function makeUnionFind(size) {
  const parent = Array.from({ length: size }, (_, i) => i);
  const rank = new Array(size).fill(0);

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]); // path compression
    return parent[x];
  }

  function union(a, b) {
    a = find(a); b = find(b);
    if (a === b) return false;
    if (rank[a] < rank[b]) [a, b] = [b, a];
    parent[b] = a;
    if (rank[a] === rank[b]) rank[a]++;
    return true;
  }

  return { find, union };
}

// ─── Kruskal's Algorithm ──────────────────────────────────────────────────────

function kruskal(nodes, edges) {
  const steps = [];
  const idMap = {};
  nodes.forEach((n, i) => (idMap[n.id] = i));

  const sorted = [...edges].sort((a, b) => a.weight - b.weight);
  const uf = makeUnionFind(nodes.length);

  const mstEdges = [];
  const rejectedEdges = [];
  let totalMstCost = 0;
  let totalCost = edges.reduce((s, e) => s + e.weight, 0);

  steps.push({
    type: 'init',
    msg: `KRUSKAL: Sorting ${sorted.length} edges by weight ascending...`,
    sortedEdges: sorted.map(e => e.id),
  });

  for (const e of sorted) {
    const a = idMap[e.n1];
    const b = idMap[e.n2];

    if (a === undefined || b === undefined) continue;

    const canAdd = uf.find(a) !== uf.find(b);
    const n1Label = nodes.find(n => n.id === e.n1)?.label ?? e.n1;
    const n2Label = nodes.find(n => n.id === e.n2)?.label ?? e.n2;

    if (canAdd) {
      uf.union(a, b);
      mstEdges.push(e);
      totalMstCost += e.weight;
      steps.push({
        type: 'accept',
        edge: e,
        msg: `ACCEPT: ${n1Label} ↔ ${n2Label} (w=${e.weight}) — No cycle formed`,
        mstCostSoFar: totalMstCost,
      });
    } else {
      rejectedEdges.push(e);
      steps.push({
        type: 'reject',
        edge: e,
        msg: `REJECT: ${n1Label} ↔ ${n2Label} (w=${e.weight}) — Would form a cycle`,
      });
    }
  }

  steps.push({
    type: 'done',
    msg: `KRUSKAL complete! MST has ${mstEdges.length} edges. Cost: ${totalMstCost}`,
    totalCost,
    mstCost: totalMstCost,
    savings: totalCost - totalMstCost,
    savingsPct: totalCost > 0 ? Math.round(((totalCost - totalMstCost) / totalCost) * 100) : 0,
  });

  return {
    algorithm: 'kruskal',
    steps,
    mstEdges,
    rejectedEdges,
    mstCost: totalMstCost,
    totalCost,
    savings: totalCost - totalMstCost,
    savingsPct: totalCost > 0 ? Math.round(((totalCost - totalMstCost) / totalCost) * 100) : 0,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };
}

// ─── Prim's Algorithm ─────────────────────────────────────────────────────────

function prim(nodes, edges) {
  const steps = [];
  if (nodes.length === 0) return { algorithm: 'prim', steps, mstEdges: [], mstCost: 0 };

  const visited = new Set();
  const mstEdges = [];
  const rejectedEdges = [];
  let totalMstCost = 0;
  const totalCost = edges.reduce((s, e) => s + e.weight, 0);

  const start = nodes[0];
  visited.add(start.id);

  steps.push({
    type: 'init',
    msg: `PRIM: Starting from ${start.label}. Greedily expanding MST...`,
  });

  while (visited.size < nodes.length) {
    // All candidate edges (one end in visited, other not)
    let best = null;
    for (const e of edges) {
      const n1In = visited.has(e.n1);
      const n2In = visited.has(e.n2);
      if ((n1In && !n2In) || (!n1In && n2In)) {
        if (!best || e.weight < best.weight) best = e;
      }
    }

    if (!best) break; // graph is disconnected

    const newNodeId = visited.has(best.n1) ? best.n2 : best.n1;
    const newNode = nodes.find(n => n.id === newNodeId);
    visited.add(newNodeId);
    mstEdges.push(best);
    totalMstCost += best.weight;

    const n1Label = nodes.find(n => n.id === best.n1)?.label ?? best.n1;
    const n2Label = nodes.find(n => n.id === best.n2)?.label ?? best.n2;

    steps.push({
      type: 'accept',
      edge: best,
      msg: `ACCEPT: ${n1Label} ↔ ${n2Label} (w=${best.weight}) — Min edge to unvisited node ${newNode?.label}`,
      mstCostSoFar: totalMstCost,
      visitedCount: visited.size,
    });

    // Mark edges where both ends are now visited (not in MST) as rejected
    for (const e of edges) {
      if (
        visited.has(e.n1) &&
        visited.has(e.n2) &&
        !mstEdges.some(m => m.id === e.id) &&
        !rejectedEdges.some(r => r.id === e.id)
      ) {
        rejectedEdges.push(e);
        const l1 = nodes.find(n => n.id === e.n1)?.label ?? e.n1;
        const l2 = nodes.find(n => n.id === e.n2)?.label ?? e.n2;
        steps.push({
          type: 'reject',
          edge: e,
          msg: `SKIP: ${l1} ↔ ${l2} (w=${e.weight}) — Both endpoints already in MST`,
        });
      }
    }
  }

  steps.push({
    type: 'done',
    msg: `PRIM complete! MST has ${mstEdges.length} edges. Cost: ${totalMstCost}`,
    totalCost,
    mstCost: totalMstCost,
    savings: totalCost - totalMstCost,
    savingsPct: totalCost > 0 ? Math.round(((totalCost - totalMstCost) / totalCost) * 100) : 0,
  });

  return {
    algorithm: 'prim',
    steps,
    mstEdges,
    rejectedEdges,
    mstCost: totalMstCost,
    totalCost,
    savings: totalCost - totalMstCost,
    savingsPct: totalCost > 0 ? Math.round(((totalCost - totalMstCost) / totalCost) * 100) : 0,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };
}

// ─── Graph Validation ─────────────────────────────────────────────────────────

function validateGraph(nodes, edges) {
  const errors = [];
  const warnings = [];

  if (nodes.length < 2) errors.push('Need at least 2 city nodes.');
  if (edges.length < 1) errors.push('Need at least 1 edge connection.');

  // Check connectivity via BFS
  if (nodes.length >= 2 && edges.length >= 1) {
    const adj = {};
    nodes.forEach(n => (adj[n.id] = []));
    edges.forEach(e => {
      adj[e.n1]?.push(e.n2);
      adj[e.n2]?.push(e.n1);
    });

    const visited = new Set();
    const queue = [nodes[0].id];
    visited.add(nodes[0].id);
    while (queue.length) {
      const cur = queue.shift();
      for (const nb of (adj[cur] || [])) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }

    if (visited.size < nodes.length) {
      const unreachable = nodes.filter(n => !visited.has(n.id)).map(n => n.label);
      errors.push(`Graph is disconnected. Unreachable cities: ${unreachable.join(', ')}`);
    }
  }

  // Duplicate edges
  const seen = new Set();
  edges.forEach(e => {
    const key = [e.n1, e.n2].sort().join('-');
    if (seen.has(key)) warnings.push(`Duplicate edge detected between nodes ${e.n1} and ${e.n2}.`);
    seen.add(key);
  });

  // Self-loops
  edges.forEach(e => {
    if (e.n1 === e.n2) errors.push(`Self-loop detected on node ${e.n1}.`);
  });

  // Invalid weights
  edges.forEach(e => {
    if (!Number.isFinite(e.weight) || e.weight <= 0) {
      errors.push(`Edge ${e.id} has invalid weight: ${e.weight}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };
}

// ─── Graph Stats ──────────────────────────────────────────────────────────────

function computeStats(nodes, edges) {
  const degrees = {};
  nodes.forEach(n => (degrees[n.id] = 0));
  edges.forEach(e => {
    if (degrees[e.n1] !== undefined) degrees[e.n1]++;
    if (degrees[e.n2] !== undefined) degrees[e.n2]++;
  });

  const degreeValues = Object.values(degrees);
  const maxDeg = Math.max(...degreeValues, 0);
  const minDeg = Math.min(...degreeValues, 0);
  const avgDeg = degreeValues.length ? (degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length).toFixed(2) : 0;

  const weights = edges.map(e => e.weight);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const maxWeight = Math.max(...weights, 0);
  const minWeight = Math.min(...weights, 0);
  const avgWeight = weights.length ? (totalWeight / weights.length).toFixed(2) : 0;

  const density = nodes.length > 1
    ? (edges.length / (nodes.length * (nodes.length - 1) / 2)).toFixed(3)
    : 0;

  const hubNode = nodes.reduce((best, n) => (degrees[n.id] > degrees[best?.id ?? -1] ? n : best), nodes[0]);

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    totalWeight,
    maxWeight,
    minWeight,
    avgWeight: parseFloat(avgWeight),
    maxDegree: maxDeg,
    minDegree: minDeg,
    avgDegree: parseFloat(avgDeg),
    density: parseFloat(density),
    hubNode: hubNode ? { id: hubNode.id, label: hubNode.label, degree: degrees[hubNode.id] } : null,
    degreeDistribution: degrees,
  };
}

// ─── Preset City Configurations ───────────────────────────────────────────────

const PRESETS = {
  small: {
    name: 'Small City',
    description: '6 districts — perfect for learning',
    nodes: [
      { id: 0, label: 'A' }, { id: 1, label: 'B' }, { id: 2, label: 'C' },
      { id: 3, label: 'D' }, { id: 4, label: 'E' }, { id: 5, label: 'F' },
    ],
    edges: [
      { id: 0, n1: 0, n2: 1, weight: 4 }, { id: 1, n1: 0, n2: 5, weight: 2 },
      { id: 2, n1: 1, n2: 2, weight: 6 }, { id: 3, n1: 1, n2: 5, weight: 5 },
      { id: 4, n1: 2, n2: 3, weight: 8 }, { id: 5, n1: 2, n2: 4, weight: 7 },
      { id: 6, n1: 3, n2: 4, weight: 9 }, { id: 7, n1: 4, n2: 5, weight: 3 },
      { id: 8, n1: 0, n2: 3, weight: 11 }, { id: 9, n1: 1, n2: 4, weight: 10 },
    ],
  },
  medium: {
    name: 'Metro Area',
    description: '9 districts — intermediate complexity',
    nodes: [
      { id: 0, label: 'A' }, { id: 1, label: 'B' }, { id: 2, label: 'C' },
      { id: 3, label: 'D' }, { id: 4, label: 'E' }, { id: 5, label: 'F' },
      { id: 6, label: 'G' }, { id: 7, label: 'H' }, { id: 8, label: 'I' },
    ],
    edges: [
      { id: 0, n1: 0, n2: 1, weight: 4 }, { id: 1, n1: 1, n2: 2, weight: 8 },
      { id: 2, n1: 2, n2: 3, weight: 7 }, { id: 3, n1: 3, n2: 4, weight: 9 },
      { id: 4, n1: 4, n2: 5, weight: 10 }, { id: 5, n1: 5, n2: 6, weight: 2 },
      { id: 6, n1: 6, n2: 7, weight: 6 }, { id: 7, n1: 7, n2: 0, weight: 1 },
      { id: 8, n1: 8, n2: 0, weight: 5 }, { id: 9, n1: 8, n2: 1, weight: 3 },
      { id: 10, n1: 8, n2: 2, weight: 11 }, { id: 11, n1: 8, n2: 3, weight: 4 },
      { id: 12, n1: 8, n2: 4, weight: 6 }, { id: 13, n1: 8, n2: 5, weight: 7 },
      { id: 14, n1: 8, n2: 6, weight: 8 }, { id: 15, n1: 8, n2: 7, weight: 2 },
      { id: 16, n1: 0, n2: 2, weight: 12 }, { id: 17, n1: 1, n2: 3, weight: 5 },
    ],
  },
  large: {
    name: 'Smart City',
    description: '12 districts — full city network',
    nodes: [
      { id: 0, label: 'A' }, { id: 1, label: 'B' }, { id: 2, label: 'C' },
      { id: 3, label: 'D' }, { id: 4, label: 'E' }, { id: 5, label: 'F' },
      { id: 6, label: 'G' }, { id: 7, label: 'H' }, { id: 8, label: 'I' },
      { id: 9, label: 'J' }, { id: 10, label: 'K' }, { id: 11, label: 'L' },
    ],
    edges: [
      { id: 0, n1: 0, n2: 1, weight: 3 }, { id: 1, n1: 1, n2: 2, weight: 5 },
      { id: 2, n1: 2, n2: 3, weight: 4 }, { id: 3, n1: 3, n2: 4, weight: 6 },
      { id: 4, n1: 4, n2: 5, weight: 8 }, { id: 5, n1: 5, n2: 6, weight: 7 },
      { id: 6, n1: 6, n2: 7, weight: 9 }, { id: 7, n1: 7, n2: 8, weight: 2 },
      { id: 8, n1: 8, n2: 9, weight: 4 }, { id: 9, n1: 9, n2: 0, weight: 6 },
      { id: 10, n1: 0, n2: 2, weight: 11 }, { id: 11, n1: 1, n2: 3, weight: 9 },
      { id: 12, n1: 2, n2: 4, weight: 7 }, { id: 13, n1: 3, n2: 5, weight: 10 },
      { id: 14, n1: 4, n2: 6, weight: 5 }, { id: 15, n1: 5, n2: 7, weight: 8 },
      { id: 16, n1: 6, n2: 8, weight: 12 }, { id: 17, n1: 7, n2: 9, weight: 6 },
      { id: 18, n1: 8, n2: 0, weight: 7 }, { id: 19, n1: 9, n2: 1, weight: 5 },
      { id: 20, n1: 10, n2: 0, weight: 4 }, { id: 21, n1: 10, n2: 1, weight: 6 },
      { id: 22, n1: 10, n2: 2, weight: 3 }, { id: 23, n1: 10, n2: 3, weight: 5 },
      { id: 24, n1: 11, n2: 7, weight: 4 }, { id: 25, n1: 11, n2: 8, weight: 3 },
      { id: 26, n1: 11, n2: 9, weight: 7 }, { id: 27, n1: 11, n2: 6, weight: 6 },
      { id: 28, n1: 10, n2: 11, weight: 2 },
    ],
  },
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Get all presets
app.get('/api/presets', (req, res) => {
  const summary = Object.entries(PRESETS).map(([key, p]) => ({
    key,
    name: p.name,
    description: p.description,
    nodeCount: p.nodes.length,
    edgeCount: p.edges.length,
  }));
  res.json({ presets: summary });
});

// Get a specific preset with full data
app.get('/api/presets/:key', (req, res) => {
  const preset = PRESETS[req.params.key];
  if (!preset) return res.status(404).json({ error: `Preset '${req.params.key}' not found.` });
  res.json(preset);
});

// Validate graph
app.post('/api/validate', (req, res) => {
  const { nodes, edges } = req.body;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return res.status(400).json({ error: 'Request must include nodes[] and edges[] arrays.' });
  }
  res.json(validateGraph(nodes, edges));
});

// Graph statistics
app.post('/api/stats', (req, res) => {
  const { nodes, edges } = req.body;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return res.status(400).json({ error: 'Request must include nodes[] and edges[] arrays.' });
  }
  res.json(computeStats(nodes, edges));
});

// Run Kruskal's algorithm
app.post('/api/mst/kruskal', (req, res) => {
  const { nodes, edges } = req.body;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return res.status(400).json({ error: 'Request must include nodes[] and edges[] arrays.' });
  }

  const validation = validateGraph(nodes, edges);
  if (!validation.valid) {
    return res.status(422).json({ error: 'Invalid graph.', details: validation.errors });
  }

  const result = kruskal(nodes, edges);
  res.json(result);
});

// Run Prim's algorithm
app.post('/api/mst/prim', (req, res) => {
  const { nodes, edges } = req.body;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return res.status(400).json({ error: 'Request must include nodes[] and edges[] arrays.' });
  }

  const validation = validateGraph(nodes, edges);
  if (!validation.valid) {
    return res.status(422).json({ error: 'Invalid graph.', details: validation.errors });
  }

  const result = prim(nodes, edges);
  res.json(result);
});

// Run both and compare
app.post('/api/mst/compare', (req, res) => {
  const { nodes, edges } = req.body;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return res.status(400).json({ error: 'Request must include nodes[] and edges[] arrays.' });
  }

  const validation = validateGraph(nodes, edges);
  if (!validation.valid) {
    return res.status(422).json({ error: 'Invalid graph.', details: validation.errors });
  }

  const kruskalResult = kruskal(nodes, edges);
  const primResult = prim(nodes, edges);

  res.json({
    kruskal: {
      mstCost: kruskalResult.mstCost,
      mstEdgeCount: kruskalResult.mstEdges.length,
      stepCount: kruskalResult.steps.length,
    },
    prim: {
      mstCost: primResult.mstCost,
      mstEdgeCount: primResult.mstEdges.length,
      stepCount: primResult.steps.length,
    },
    totalCost: kruskalResult.totalCost,
    savings: kruskalResult.savings,
    savingsPct: kruskalResult.savingsPct,
    note: kruskalResult.mstCost === primResult.mstCost
      ? 'Both algorithms produce the same MST cost (optimal).'
      : 'Results differ — check for negative weights or disconnected graph.',
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n  Smart City MST Backend`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  Server running at http://localhost:${PORT}`);
  console.log(`  Endpoints:`);
  console.log(`    GET  /api/health`);
  console.log(`    GET  /api/presets`);
  console.log(`    GET  /api/presets/:key`);
  console.log(`    POST /api/validate`);
  console.log(`    POST /api/stats`);
  console.log(`    POST /api/mst/kruskal`);
  console.log(`    POST /api/mst/prim`);
  console.log(`    POST /api/mst/compare`);
  console.log(`  ─────────────────────────────────────\n`);
});
