import React, { useEffect, useRef } from "react";

export default function DynamicSVGPlaceholderWithEdges() {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const numNodes = 20; // number of floating nodes
    const nodes = [];
    const edges = [];

    const width = svg.clientWidth;
    const height = svg.clientHeight;

    // Initialize nodes
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 5 + Math.random() * 5,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
      });
    }

    // Initialize edges between random nodes
    for (let i = 0; i < numNodes; i++) {
      const targetIndex = Math.floor(Math.random() * numNodes);
      if (targetIndex !== i) {
        edges.push({ source: i, target: targetIndex });
      }
    }

    let animationFrameId;

    const animate = () => {
      const svgChildren = svg.children;

      // Update node positions
      nodes.forEach((n) => {
        n.x += n.dx;
        n.y += n.dy;

        if (n.x < 0 || n.x > width) n.dx *= -1;
        if (n.y < 0 || n.y > height) n.dy *= -1;
      });

      // Update edges
      edges.forEach((e, idx) => {
        const line = svgChildren[idx];
        const source = nodes[e.source];
        const target = nodes[e.target];
        line.setAttribute("x1", source.x);
        line.setAttribute("y1", source.y);
        line.setAttribute("x2", target.x);
        line.setAttribute("y2", target.y);
      });

      // Update nodes
      nodes.forEach((n, idx) => {
        const circle = svgChildren[edges.length + idx];
        circle.setAttribute("cx", n.x);
        circle.setAttribute("cy", n.y);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <svg
      ref={svgRef}
      style={{ width: "100%", height: "81vh", background: "#f9f9f9" }}
    >
      {/* Edges */}
      {Array.from({ length: 20 }).map((_, i) => (
        <line
          key={i}
          x1={0}
          y1={0}
          x2={0}
          y2={0}
          stroke="rgba(100, 149, 237, 0.3)"
          strokeWidth={1}
        />
      ))}

      {/* Nodes */}
      {Array.from({ length: 20 }).map((_, i) => (
        <circle
          key={i}
          cx={0}
          cy={0}
          r={5}
          fill="rgba(100, 149, 237, 0.7)"
        />
      ))}
    </svg>
  );
}
