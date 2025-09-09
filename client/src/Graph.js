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

  const [healthCheckMap, setHealthCheckMap] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [newDependency, setNewDependency] = useState({
    inputs: [{ inputId: "", isRaw: false, customName: "" }],
  });

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
                strokeDasharray: "8 8",
              },
              markerEnd: { type: MarkerType.ArrowClosed, color: "red" },
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

  useEffect(() => {
    if (!productName || !startDate || !endDate) return;

    setLoading(true);
    setNodes([]);
    setEdges([]);
    setHealthCheckMap({});

    fetch(
      `${process.env.REACT_APP_API_URL}/tracium/productMapping/${productName}?startDate=${startDate}&endDate=${endDate}`
    )
      .then((res) => res.json())
      .then((data) => {
        setDependencies(data.dependencies || []);
        return fetch(
          `${process.env.REACT_APP_API_URL}/tracium/healthCheck/${productName}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ startDate, endDate }),
          }
        );
      })
      .then((res) => res.json())
      .then((hcData) => {
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

  useEffect(() => {
    if (dependencies.length === 0) return;

    const allNodeIds = new Set(
      dependencies
        .flatMap((d) => [d.view, d.input || d.raw_input])
        .filter((id) => id !== undefined && id !== null && id !== "")
    );
    
    // Ensure all views are included
    dependencies.forEach((d) => {
      if (d.view) allNodeIds.add(d.view);
      if (d.input) allNodeIds.add(d.input);
      if (d.raw_input) allNodeIds.add(d.raw_input);
    });
    
    const nodeIds = Array.from(allNodeIds);

    const rawNodes = nodeIds.map((id) => {
      const isRawInput = dependencies.some(
        (d) => d.raw_input && d.raw_input === id
      );
      const isUnhealthy = healthCheckMap[id]?.length > 0;

      return {
        id,
        data: {
          label: (
            <div
              title={id}
              style={{
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              {id}
            </div>
          ),
        },
        position: { x: 0, y: 0 },
        className: "reactflow-node",
        style: {
          padding: 10,
          background: isUnhealthy
            ? "#ff4545"
            : isRawInput
            ? "grey"
            : "lightgreen",
          color: "black",
          fontSize: 18,
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          transition: "all 0.25s ease-in-out",
          ...(isRawInput
            ? {
                width: 200,
                height: 200,
                borderRadius: "20px",
              }
            : {
                minWidth: 370,
                height: 100,
                borderRadius: "999px",
              }),
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


  const handleDependencySubmit = () => {
    if (!selectedNode) return;

    const confirmMsg = `Are you sure you want to update dependencies for "${selectedNode.id}"? 
  This will delete all existing dependencies for this node and cannot be undone.`;
  
    if (!window.confirm(confirmMsg)) {
      return; // User canceled
    }
  
    const inputViews = [];
    const rawInputs = [];
  
    newDependency.inputs.forEach(input => {
      if (input.inputId) {
        input.isRaw ? rawInputs.push(input.inputId) : inputViews.push(input.inputId);
      } else if (input.customName) {
        rawInputs.push(input.customName); // custom inputs are raw
      }
    });
  
    const payload = {
      inputViews: inputViews.join(","),
      rawInputs: rawInputs.join(","),
    };
  
    fetch(`${process.env.REACT_APP_API_URL}/tracium/update/view_dependency/${selectedNode.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        console.log("API Response:", data);
  
        // Update dependencies state
        setDependencies(prevDeps => {
          // Remove old dependencies for this node
          const filteredDeps = prevDeps.filter(dep => dep.view !== selectedNode.id);
  
          // Add new dependencies
          const newDeps = [
            ...inputViews.map(iv => ({ view: selectedNode.id, input: iv })),
            ...rawInputs.map(ri => ({ view: selectedNode.id, raw_input: ri }))
          ];
  
          return [...filteredDeps, ...newDeps];
        });
  
        // Reset form
        setIsEditing(false);
        setNewDependency({ inputs: [{ inputId: "", isRaw: false, customName: "" }] });
        setSelectedNode(null); // close popup if desired
      })
      .catch(err => {
        console.error("Error updating dependency:", err);
      });
  };
  
  

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
          <line x1="80" y1="20" x2="80" y2="140" stroke="#9ca3af" strokeWidth="2">
            <animate
              attributeName="stroke-opacity"
              values="0.3;1;0.3"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </line>
          <line x1="20" y1="80" x2="140" y2="80" stroke="#9ca3af" strokeWidth="2">
            <animate
              attributeName="stroke-opacity"
              values="0.3;1;0.3"
              dur="1.5s"
              begin="0.3s"
              repeatCount="indefinite"
            />
          </line>
          <circle cx="80" cy="20" r="10" fill="#3b82f6">
            <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
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
    <div style={{ width: "100vw", height: "92vh", position: "relative" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          setSelectedNode(node);
        }}
        onNodeMouseEnter={(_, node) => {
          onNodeClick(_, node);
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id
                ? {
                    ...n,
                    style: {
                      ...n.style,
                      boxShadow: "0 16px 20px rgba(0,0,0,0.25)",
                      transition: "all 0.2s ease-in-out",
                    },
                  }
                : n
            )
          );
        }}
        onNodeMouseLeave={(_, node) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id
                ? {
                    ...n,
                    style: {
                      ...n.style,
                      boxShadow: "none",
                      transition: "all 0.2s ease-in-out",
                    },
                  }
                : n
            )
          );
        }}
        minZoom={0.3}
        maxZoom={5}
        fitView
        nodesDraggable
      >
        <Controls />
        <Background
          color="grey"
          gap={16}
          size={2}
          style={{ backgroundColor: "#f9fafa" }}
        />
      </ReactFlow>

      {/* 🔴 Popup Modal */}
      {selectedNode && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
            minWidth: "400px",
            maxWidth: "600px",
            zIndex: 1000,
          }}
        >
          {!isEditing ? (
            <>
              <h2 style={{ marginBottom: "12px", fontWeight: "bold" }}>
                {selectedNode.id}
              </h2>
              <p style={{ fontSize: "14px", color: "#374151" }}>
                <strong>Absent Entries:</strong>
              </p>
              <ul
                style={{
                  marginTop: "6px",
                  paddingLeft: "20px",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {(healthCheckMap[selectedNode.id] || []).length > 0 ? (
                  healthCheckMap[selectedNode.id].map((entry, idx) => (
                    <li key={idx} style={{ fontSize: "14px", marginBottom: "4px" }}>
                      {entry}
                    </li>
                  ))
                ) : (
                  <li style={{ color: "green", fontWeight: "500" }}>
                    No Absent Entries ✅
                  </li>
                )}
              </ul>
                <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                  {!(selectedNode.style?.background === "grey") && (
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#10b981",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      Update Dependencies
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedNode(null)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#3b82f6",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
            </>
          ) : (
            <>
              <h2 style={{ marginBottom: "12px", fontWeight: "bold" }}>
                Update Dependency for {selectedNode.id}
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleDependencySubmit();
              }}>
                {newDependency.inputs.map((input, index) => {
                  const isCustom = input.isRaw && input.inputId === ""; // show textbox as soon as custom is selected
                  return (
                    <div key={index} style={{ marginBottom: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                      {isCustom ? (
                        <div style={{ flexGrow: 1 }}>
                          <input
                            type="text"
                            placeholder="Custom input name"
                            value={input.customName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewDependency(prev => {
                                const newInputs = [...prev.inputs];
                                newInputs[index] = { ...newInputs[index], customName: val };
                                return { ...prev, inputs: newInputs };
                              });
                            }}
                            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc", width: "95%" }}
                          />
                          <small style={{ display: "block", color: "#555", marginTop: "4px" }}>raw input</small>

                        </div>
                      ) : (
                        <select
                          value={input.inputId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewDependency(prev => {
                              const newInputs = [...prev.inputs];
                              if (val === "custom") {
                                newInputs[index] = { inputId: "", isRaw: true, customName: "" };
                              } else {
                                const selectedNodeObj = nodes.find(n => n.id === val);
                                const isRaw = selectedNodeObj && selectedNodeObj.style.background === "grey";
                                newInputs[index] = { inputId: val, isRaw, customName: "" };
                              }
                              return { ...prev, inputs: newInputs };
                            });
                          }}
                          style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc", flexGrow: 1 }}
                        >
                          <option value="">Select Input</option>
                          {nodes.filter(n => n.id !== selectedNode.id).map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.id} {n.style.background === "grey" ? "(Raw Input)" : ""}
                            </option>
                          ))}
                          <option value="custom">Custom Input</option>
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setNewDependency(prev => {
                            const newInputs = prev.inputs.filter((_, idx) => idx !== index);
                            return { ...prev, inputs: newInputs.length > 0 ? newInputs : [{ inputId: "", isRaw: false, customName: "" }] };
                          });
                        }}
                        style={{ padding: "8px 12px", borderRadius: "6px", border: "none", background: "#ef4444", color: "white", cursor: "pointer" }}

                      >
                        Remove
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setNewDependency(prev => ({
                      ...prev,
                      inputs: [...prev.inputs, { inputId: "", isRaw: false, customName: "" }]
                    }));
                  }}
                  disabled={
                    newDependency.inputs.some(input =>
                      !(input.inputId !== "" || (input.customName && input.customName.trim() !== ""))
                    )
                  }
                  style={{
                    marginBottom: "12px",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: newDependency.inputs.some(input =>
                      !(input.inputId !== "" || (input.customName && input.customName.trim() !== ""))
                    ) ? "#ccc" : "#3b82f6",
                    color: "white",
                    cursor: newDependency.inputs.some(input =>
                      !(input.inputId !== "" || (input.customName && input.customName.trim() !== ""))
                    ) ? "not-allowed" : "pointer"
                  }}
                >
                  Add Input
                </button>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button
                    type="submit"
                    disabled={
                      !newDependency.inputs.some(input =>
                        input.inputId !== "" || (input.customName && input.customName.trim() !== "")
                      )
                    }
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: newDependency.inputs.some(input =>
                        input.inputId !== "" || (input.customName && input.customName.trim() !== "")
                      ) ? "#10b981" : "#ccc",
                      color: "white",
                      cursor: newDependency.inputs.some(input =>
                        input.inputId !== "" || (input.customName && input.customName.trim() !== "")
                      ) ? "pointer" : "not-allowed"
                    }}
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setNewDependency({ inputs: [{ inputId: "", isRaw: false, customName: "" }] });
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#ef4444",
                      color: "white",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
