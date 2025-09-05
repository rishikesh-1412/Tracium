import React, { useState, useEffect, useCallback } from "react";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

// ---- DAGRE SETUP ----
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 320;
const nodeHeight = 80;

// ---- DAGRE LAYOUT ----
const getLayoutedElements = (nodes, edges) => {
  dagreGraph.setGraph({ rankdir: "TB", ranksep: 350, nodesep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPos = dagreGraph.node(node.id);
    if (!nodeWithPos) return;
    node.position = {
      x: nodeWithPos.x - nodeWidth / 2,
      y: nodeWithPos.y - nodeHeight / 2,
    };
    node.draggable = true;
  });

  return { nodes, edges };
};

// ---- UTILS FOR HIGHLIGHT ----
const buildParentMap = (edges) => {
  const parentMap = {};
  edges.forEach((e) => {
    if (!parentMap[e.target]) parentMap[e.target] = [];
    parentMap[e.target].push(e.source);
  });
  return parentMap;
};

const getAllAncestors = (nodeId, parentMap) => {
  const visited = new Set();
  const stack = [nodeId];
  const ancestorEdges = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const parents = parentMap[current] || [];
    parents.forEach((p) => {
      ancestorEdges.push({ source: p, target: current });
      if (!visited.has(p)) {
        visited.add(p);
        stack.push(p);
      }
    });
  }

  return ancestorEdges;
};

// ---- GRAPH COMPONENT ----
export default function Graph({ productName, startDate, endDate }) {
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 🔴 Health check results map (jobName → absentEntries)
  const [healthCheckMap, setHealthCheckMap] = useState({});

  const parentMap = buildParentMap(edges);

  const onNodeClick = useCallback(
    (_, node) => {
      const ancestorEdges = getAllAncestors(node.id, parentMap);

      setEdges((eds) =>
        eds.map((e) => {
          const isHighlighted = ancestorEdges.some(
            (ae) => ae.source === e.source && ae.target === e.target
          );

          if (isHighlighted) {
            return {
              ...e,
              animated: true,
              style: {
                stroke: "red",
                strokeWidth: 6,
                strokeDasharray: "5 5",
              },
              markerEnd: { type: MarkerType.ArrowClosed, color: "violet" },
            };
          }

          return {
            ...e,
            animated: false,
            style: { stroke: "grey", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "grey" },
          };
        })
      );
    },
    [setEdges, parentMap]
  );

  // Fetch API data when productName changes
  useEffect(() => {
    if (!productName || !startDate || !endDate) return;

    setLoading(true);
    setNodes([]);
    setEdges([]);
    setHealthCheckMap({});

    // First fetch dependencies
    fetch(
      `http://localhost:5000/datatrail/productMapping/${productName}?startDate=${startDate}&endDate=${endDate}`
    )
      .then((res) => res.json())
      .then((data) => {
        setDependencies(data.dependencies || []);

        // 🔴 Then fetch health check in parallel
        return fetch(
          `http://localhost:5000/datatrail/healthCheck/${productName}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ startDate, endDate }),
          }
        );
      })
      .then((res) => res.json())
      .then((hcData) => {
        // Convert results into a lookup map
        const hcMap = {};
        hcData.results?.forEach((job) => {
          hcMap[job.jobName] = job.absentEntries || [];
        });
        setHealthCheckMap(hcMap);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [productName, startDate, endDate, setNodes, setEdges]);

  // Build nodes & edges once dependencies are fetched
  useEffect(() => {
    if (dependencies.length === 0) return;

    const nodeIds = [
      ...new Set(
        dependencies
          .flatMap((d) => [d.view, d.input || d.raw_input])
          .filter((id) => id !== undefined && id !== null && id !== "")
      ),
    ];

    const rawNodes = nodeIds.map((id) => {
      const isRawInput = dependencies.some(
        (d) => d.raw_input && d.raw_input === id
      );

      // 🔴 Check health map for this node
      const isUnhealthy = healthCheckMap[id]?.length > 0;

      return {
        id,
        data: { label: id },
        position: { x: 0, y: 0 },
        className: "reactflow-node", 
        style: {
          padding: 10,
          borderRadius: 8,
          background: isUnhealthy
            ? "linear-gradient(135deg,rgb(242, 190, 199) 0%,rgb(238, 16, 24) 100%)"
            : isRawInput
            ? "linear-gradient(135deg,rgba(232, 234, 236, 0.27) 0%,rgba(29, 29, 29, 0.31) 100%)"
            : "linear-gradient(135deg,rgb(221, 242, 223) 0%,rgb(7, 188, 76) 100%)",
          color: "black",
          fontSize: 18,
          fontWeight: 600,
          minWidth: 370,
          height: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflowX: "auto",
          whiteSpace: "nowrap",
          cursor: "grab",
          transition: "all 0.25s ease-in-out", // smooth transition
        },
      };
    });

    const rawEdges = dependencies.map((d) => ({
      id: `e-${d.input || d.raw_input}->${d.view}`,
      source: d.input || d.raw_input,
      target: d.view,
      animated: false,
      style: { stroke: "grey", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "grey" },
    }));

    const { nodes: initialNodes, edges: initialEdges } = getLayoutedElements(
      rawNodes,
      rawEdges
    );

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [dependencies, healthCheckMap, setNodes, setEdges]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "81vh",
          background: "#f9fafb",
        }}
      >
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Edges */}
          <line
            x1="80"
            y1="20"
            x2="80"
            y2="140"
            stroke="#9ca3af"
            strokeWidth="2"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.3;1;0.3"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </line>
          <line
            x1="20"
            y1="80"
            x2="140"
            y2="80"
            stroke="#9ca3af"
            strokeWidth="2"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.3;1;0.3"
              dur="1.5s"
              begin="0.3s"
              repeatCount="indefinite"
            />
          </line>
  
          {/* Nodes */}
          <circle cx="80" cy="20" r="10" fill="#3b82f6">
            <animate
              attributeName="r"
              values="8;12;8"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="80" cy="140" r="10" fill="#10b981">
            <animate
              attributeName="r"
              values="8;12;8"
              dur="1.5s"
              begin="0.3s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="20" cy="80" r="10" fill="#8b5cf6">
            <animate
              attributeName="r"
              values="8;12;8"
              dur="1.5s"
              begin="0.6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="140" cy="80" r="10" fill="#ec4899">
            <animate
              attributeName="r"
              values="8;12;8"
              dur="1.5s"
              begin="0.9s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
  
        <p style={{ marginTop: "20px", fontSize: "18px", fontWeight: "600", color: "#374151" }}>
          Rendering Graph...
        </p>
      </div>
    );
  }
  
  return (
    <div style={{ width: "100vw", height: "81vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        minZoom={0.3}
        maxZoom={5}
        fitView
        nodesDraggable
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
