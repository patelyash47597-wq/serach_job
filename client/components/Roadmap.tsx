import React, { useEffect, useState } from "react";
import yaml from "js-yaml";
import Sidebar from "./Sidebar";

interface Resource {
  title: string;
  type: string;
  url: string;
}

interface Node {
  id: string;
  label: string;
  position?: { x: number; y: number };
  resources?: Resource[];
  parent?: string;
}

interface Edge {
  from: string;
  to: string;
  style?: string;
}

interface RoadmapData {
  title: string;
  nodes: Node[];
  edges: Edge[];
}

export default function Roadmap({ yamlFile }: { yamlFile: string }) {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    fetch(`/${yamlFile}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${yamlFile}`);
        return res.text();
      })
      .then((text) => {
        const parsed = yaml.load(text) as RoadmapData;
        setData(parsed);
      })
      .catch((err) => console.error("Error loading YAML:", err));
  }, [yamlFile]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 text-slate-700">
        Loading roadmap...
      </div>
    );
  }

  const spacingY = 100;
  const startY = 100;
  const centerX = 500;
  const subnodeSpacing = 160;

  const positionedNodes = data.nodes.map((node, index) => ({
    ...node,
    position: node.position || { x: centerX, y: startY + index * spacingY },
  }));

  const getNodeById = (id: string) => positionedNodes.find((n) => n.id === id)!;

  return (
    <div className="w-full h-screen bg-[#111827] flex items-center justify-center">

      <h1 className="top-4 text-5xl font-bold text-white text-center drop-shadow-[0_0_20px_#2DD4BF]">

        {data.title}
      </h1>

      <svg
        className="w-full h-full mt-0 justify-center"
        viewBox="-200 -50 1600 1000"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="10"
            refX="6"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#2DD4BF" />

          </marker>
        </defs>

        {/* Edges */}
        {data.edges.map((edge, i) => {
          const from = getNodeById(edge.from);
          const to = getNodeById(edge.to);
          if (!from || !to) return null;

          const dashed = edge.style === "dashed";
          const color = dashed ? "#6366F1" : "#2DD4BF";


          return (
            <line
              key={i}
              x1={from.position.x}
              y1={from.position.y + 40}
              x2={to.position.x}
              y2={to.position.y}
              stroke={color}
              strokeWidth={2}
              strokeDasharray={dashed ? "6,3" : "0"}
              markerEnd="url(#arrow)"
            />
          );
        })}

        {/* Nodes */}
        {positionedNodes.map((node) => {
          let adjustedX = node.position.x;

          // Framework subnodes (horizontal layout)
          if (node.parent === "framework") {
            const subIndex = ["react", "vue", "angular", "solid"].indexOf(node.id);
            if (subIndex >= 0) {
              adjustedX = centerX - subnodeSpacing * 1.5 + subIndex * subnodeSpacing;
            }
          }

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          ctx!.font = "bold 20px sans-serif";
          const textWidth = ctx!.measureText(node.label).width;

          const paddingX = 30;
          const boxWidth = textWidth + paddingX * 4;
          const boxHeight = 60;

          const isDashedConnected = data.edges.some(
            (edge) => edge.style === "dashed" && edge.to === node.id
          );

          const fillColor = selectedNode?.id === node.id
            ? "#2DD4BF"
            : node.parent
              ? "#1F2937"
              : "#111827";


          return (
            <g
              key={node.id}
              transform={`translate(${adjustedX - boxWidth / 2}, ${node.position.y})`}
              onClick={() => setSelectedNode(node)}
              className="cursor-pointer "
            >
              <rect
                width={boxWidth}
                height={boxHeight}
                rx="10"
                fill={fillColor}
                stroke="#2DD4BF"
                strokeWidth={selectedNode?.id === node.id ? 3 : 1.5}
              />

              <text
                x={boxWidth / 2}
                y={boxHeight / 2 + 6}
                textAnchor="middle"
                fontWeight="bold"
                fontSize="20px"
                fill="#E5E7EB"

              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {selectedNode && <Sidebar node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  );
}
