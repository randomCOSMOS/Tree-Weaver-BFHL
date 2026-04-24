const VALID_EDGE_REGEX = /^[A-Z]->[A-Z]$/;

const USER_PROFILE = {
  user_id: "srijanthakur_18112004",
  email_id: "st7851@srmist.edu.in",
  college_roll_number: "RA2311047010081"
};

function sanitizeEntry(entry) {
  if (typeof entry !== "string") {
    return String(entry ?? "");
  }

  return entry.trim();
}

function parseInput(data) {
  if (!Array.isArray(data)) {
    return {
      edges: [],
      invalidEntries: [],
      duplicateEdges: []
    };
  }

  const invalidEntries = [];
  const duplicateEdges = [];
  const duplicateTracker = new Set();
  const uniqueEdges = new Set();
  const childOwners = new Map();
  const edges = [];

  for (const rawEntry of data) {
    const entry = sanitizeEntry(rawEntry);

    if (!VALID_EDGE_REGEX.test(entry)) {
      invalidEntries.push(entry);
      continue;
    }

    const [parent, child] = entry.split("->");

    if (parent === child) {
      invalidEntries.push(entry);
      continue;
    }

    if (uniqueEdges.has(entry)) {
      if (!duplicateTracker.has(entry)) {
        duplicateEdges.push(entry);
        duplicateTracker.add(entry);
      }
      continue;
    }

    uniqueEdges.add(entry);

    if (childOwners.has(child)) {
      continue;
    }

    childOwners.set(child, parent);
    edges.push({ parent, child, raw: entry });
  }

  return { edges, invalidEntries, duplicateEdges };
}

function buildAdjacency(edges) {
  const adjacency = new Map();
  const allNodes = new Set();

  for (const { parent, child } of edges) {
    if (!adjacency.has(parent)) {
      adjacency.set(parent, []);
    }

    adjacency.get(parent).push(child);
    allNodes.add(parent);
    allNodes.add(child);
  }

  for (const node of allNodes) {
    if (!adjacency.has(node)) {
      adjacency.set(node, []);
    }
  }

  return { adjacency, allNodes };
}

function buildUndirected(adjacency) {
  const undirected = new Map();

  for (const [node, children] of adjacency.entries()) {
    if (!undirected.has(node)) {
      undirected.set(node, new Set());
    }

    for (const child of children) {
      if (!undirected.has(child)) {
        undirected.set(child, new Set());
      }

      undirected.get(node).add(child);
      undirected.get(child).add(node);
    }
  }

  return undirected;
}

function findComponents(adjacency) {
  const undirected = buildUndirected(adjacency);
  const visited = new Set();
  const components = [];

  for (const node of undirected.keys()) {
    if (visited.has(node)) {
      continue;
    }

    const queue = [node];
    const component = [];
    visited.add(node);

    while (queue.length) {
      const current = queue.shift();
      component.push(current);

      for (const neighbor of undirected.get(current)) {
        if (visited.has(neighbor)) {
          continue;
        }

        visited.add(neighbor);
        queue.push(neighbor);
      }
    }

    components.push(component);
  }

  return components;
}

function findRoot(component, childSet) {
  const candidates = component.filter((node) => !childSet.has(node)).sort();
  return candidates[0] ?? component.slice().sort()[0];
}

function detectCycle(root, adjacency, componentSet) {
  const visiting = new Set();
  const visited = new Set();

  function walk(node) {
    if (visiting.has(node)) {
      return true;
    }

    if (visited.has(node)) {
      return false;
    }

    visiting.add(node);

    for (const child of adjacency.get(node) ?? []) {
      if (!componentSet.has(child)) {
        continue;
      }

      if (walk(child)) {
        return true;
      }
    }

    visiting.delete(node);
    visited.add(node);
    return false;
  }

  for (const node of componentSet) {
    if (walk(node)) {
      return true;
    }
  }

  return false;
}

function buildTreeNode(node, adjacency) {
  const children = adjacency.get(node) ?? [];
  const branch = {};
  let depth = 1;

  for (const child of children) {
    const built = buildTreeNode(child, adjacency);
    branch[child] = built.branch;
    depth = Math.max(depth, 1 + built.depth);
  }

  return { branch, depth };
}

function buildHierarchies(edges) {
  if (!edges.length) {
    return [];
  }

  const { adjacency } = buildAdjacency(edges);
  const childSet = new Set(edges.map((edge) => edge.child));
  const components = findComponents(adjacency);

  return components.map((component) => {
    const componentSet = new Set(component);
    const root = findRoot(component, childSet);
    const hasCycle = detectCycle(root, adjacency, componentSet);

    if (hasCycle) {
      return {
        root,
        tree: {},
        has_cycle: true
      };
    }

    const built = buildTreeNode(root, adjacency);

    return {
      root,
      tree: {
        [root]: built.branch
      },
      depth: built.depth
    };
  });
}

function buildSummary(hierarchies) {
  const validTrees = hierarchies.filter((item) => !item.has_cycle);
  const cyclicGroups = hierarchies.filter((item) => item.has_cycle);

  let largestTreeRoot = "";
  let largestDepth = -1;

  for (const tree of validTrees) {
    if (
      tree.depth > largestDepth ||
      (tree.depth === largestDepth && tree.root.localeCompare(largestTreeRoot) < 0)
    ) {
      largestDepth = tree.depth;
      largestTreeRoot = tree.root;
    }
  }

  return {
    total_trees: validTrees.length,
    total_cycles: cyclicGroups.length,
    largest_tree_root: largestTreeRoot
  };
}

function processBfhlData(data) {
  const { edges, invalidEntries, duplicateEdges } = parseInput(data);
  const hierarchies = buildHierarchies(edges);

  return {
    ...USER_PROFILE,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: buildSummary(hierarchies)
  };
}

module.exports = {
  processBfhlData,
  USER_PROFILE
};
