import React, { useState, useEffect, useRef, useContext } from 'react';
import * as d3 from 'd3';
import { Paper } from '@mui/material';

import BiolinkContext from '../../../context/biolink';
import dragUtils from '../../../utils/d3/drag';
import graphUtils from '../../../utils/d3/graph';
import edgeUtils from '../../../utils/d3/edges';
import queryGraphUtils from '../../../utils/queryGraph';
import stringUtils from '../../../utils/strings';
import Loading from '../../../components/loading/Loading';

import './queryGraph.css';

const nodeRadius = 48;
const edgeLength = 225;

// Types for query graph nodes and edges
// These match the output of getNodeAndEdgeListsForDisplay
interface DisplayNode {
  id: string;
  name: string;
  categories?: string[];
  is_set?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface DisplayEdge {
  id: string;
  predicates?: string[];
  source: string | DisplayNode;
  target: string | DisplayNode;
  numEdges?: number;
  index?: number;
  strokeWidth?: number;
}

// Biolink predicate type
interface BiolinkPredicate {
  predicate: string;
  domain: string;
  range: string;
  symmetric: boolean;
}

// Context type
interface BiolinkContextType {
  colorMap?: (categories: string | string[]) => [string | null, string];
  hierarchies?: Record<string, any>;
  predicates?: BiolinkPredicate[];
}

// QueryGraph prop type
interface QueryGraphProps {
  query_graph: {
    nodes: Record<string, any>;
    edges: Record<string, any>;
  };
}

// Strict types for D3
interface StrictDisplayNode {
  id: string;
  name: string;
  categories: string[];
  is_set: boolean;
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

interface StrictDisplayEdge {
  id: string;
  predicates: string[];
  source: string | StrictDisplayNode;
  target: string | StrictDisplayNode;
  numEdges?: number;
  index?: number;
  strokeWidth?: number;
}

/**
 * Query Graph Display
 * @param {object} query_graph - query graph object
 */
export default function QueryGraph({ query_graph }: QueryGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { colorMap, predicates = [] } = useContext(BiolinkContext) as BiolinkContextType;
  const [drawing, setDrawing] = useState(false);
  const symmetricPredicates = predicates
    .filter((predicate) => predicate.symmetric)
    .map((predicate) => predicate.predicate);

  /**
   * Initialize the svg size
   */
  function setSvgSize() {
    const svgElem = svgRef.current;
    if (!svgElem) return;
    const svg = d3.select(svgElem);
    const { width, height } = (
      svg.node()?.parentNode as HTMLElement
    )?.getBoundingClientRect() as any;
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', [0, 0, width, height]);
  }

  useEffect(() => {
    setSvgSize();
  }, []);

  function drawQueryGraph() {
    let { nodes, edges } = queryGraphUtils.getNodeAndEdgeListsForDisplay(query_graph);
    const svg = d3.select(svgRef.current);
    const { width, height } = (
      svg.node()?.parentNode as HTMLElement
    )?.getBoundingClientRect() as any;
    // clear the graph for redraw
    svg.selectAll('*').remove();
    const defs = svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', [0, 0, 20, 13])
      .attr('refX', 20)
      .attr('refY', 6.5)
      .attr('markerWidth', 6.5)
      .attr('markerHeight', 25)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr(
        'd',
        d3.line()([
          [0, 0],
          [0, 13],
          [25, 6.5],
        ]) as string
      )
      .attr('fill', '#999');
    let node = svg
      .append('g')
      .attr('id', 'nodeContainer')
      .selectAll<SVGGElement, StrictDisplayNode>('g');
    let edge = svg
      .append('g')
      .attr('id', 'edgeContainer')
      .selectAll<SVGGElement, StrictDisplayNode>('g');
    nodes = nodes.map((d) => ({ ...d, x: Math.random() * width, y: Math.random() * height }));
    const simulation = d3
      .forceSimulation(nodes as any)
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.5))
      // .force('forceX', d3.forceX(width / 2).strength(0.02))
      .force('forceY', d3.forceY(height / 2).strength(0.2))
      .force('collide', d3.forceCollide().radius(nodeRadius * 2))
      .force(
        'link',
        d3
          .forceLink(edges as any)
          .id((d: any) => d.id)
          .distance(edgeLength)
          .strength(0)
      )
      .on('tick', () => {
        node.attr('transform', (d: any) => {
          let padding = nodeRadius;
          // 70% of padding so a dragged node can push into the graph bounds a little
          if (d.fx !== null && d.fx !== undefined) {
            padding *= 0.5;
          }
          // assign d.x and d.y so edges know the bounded positions
          d.x = graphUtils.getBoundedValue(d.x, width - padding, padding);
          d.y = graphUtils.getBoundedValue(d.y, height - padding, padding);
          return `translate(${d.x}, ${d.y})`;
        });

        edge.select('.edge').attr('d', (d: any) => {
          const { x1, y1, qx, qy, x2, y2 } = graphUtils.getCurvedEdgePos(
            d.source.x,
            d.source.y,
            d.target.x,
            d.target.y,
            d.numEdges,
            d.index,
            nodeRadius
          );
          return `M${x1},${y1}Q${qx},${qy} ${x2},${y2}`;
        });
        edge.select('.edgeTransparent').attr('d', (d: any) => {
          const { x1, y1, qx, qy, x2, y2 } = graphUtils.getCurvedEdgePos(
            d.source.x,
            d.source.y,
            d.target.x,
            d.target.y,
            d.numEdges,
            d.index,
            nodeRadius
          );
          // if necessary, flip transparent path so text is always right side up
          const leftNode = x1 > x2 ? `${x2},${y2}` : `${x1},${y1}`;
          const rightNode = x1 > x2 ? `${x1},${y1}` : `${x2},${y2}`;
          return `M${leftNode}Q${qx},${qy} ${rightNode}`;
        });
      });

    node = node
      .data(nodes as any)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(dragUtils.dragNode(simulation) as any)
      .call((n) =>
        n
          .append('circle')
          .attr('r', nodeRadius)
          .attr('fill', (d: any) => colorMap!(d.categories)[1])
          .call((nCircle) => nCircle.append('title').text((d: any) => d.name))
      )
      .call((n) =>
        n
          .append('text')
          .attr('class', 'nodeLabel')
          .style('pointer-events', 'none')
          .attr('text-anchor', 'middle')
          .style('font-weight', 600)
          .attr('alignment-baseline', 'middle')
          .text((d: any) => {
            const { name } = d;
            return name || 'Any';
          })
          .each(graphUtils.fitTextIntoCircle)
      ) as any;

    edges = edgeUtils.addEdgeCurveProperties(edges);
    edge = edge
      .data(edges as any)
      .enter()
      .append('g')
      .call((e) =>
        e
          .append('path')
          .attr('stroke', '#999')
          .attr('fill', 'none')
          .attr('stroke-width', (d: any) => d.strokeWidth)
          .attr('class', 'edge')
          .attr('marker-end', (d: any) =>
            graphUtils.shouldShowArrow(d, symmetricPredicates) ? 'url(#arrow)' : ''
          )
      )
      .call((e) =>
        e
          .append('path')
          .attr('stroke', 'transparent')
          .attr('fill', 'none')
          .attr('stroke-width', 10)
          .attr('class', 'edgeTransparent')
          .attr('id', (d: any) => `edge${d.id}`)
          .call(() =>
            e
              .append('text')
              .attr('class', 'edgeText')
              .attr('pointer-events', 'none')
              .style('text-anchor', 'middle')
              .attr('dy', (d: any) => -d.strokeWidth)
              .append('textPath')
              .attr('pointer-events', 'none')
              .attr('xlink:href', (d: any) => `#edge${d.id}`)
              .attr('startOffset', '50%')
              .text((d: any) =>
                d.predicates
                  ? d.predicates.map((p: any) => stringUtils.displayPredicate(p)).join(' or ')
                  : ''
              )
          )
          .call((eLabel: any) =>
            eLabel
              .append('title')
              .text((d: any) =>
                d.predicates
                  ? d.predicates.map((p: any) => stringUtils.displayPredicate(p)).join(' or ')
                  : ''
              )
          )
      ) as any;

    simulation.alpha(1).restart();
  }

  useEffect(() => {
    if (query_graph) {
      drawQueryGraph();
    }
  }, [query_graph, colorMap]);

  useEffect(() => {
    let timer: any;
    function handleResize() {
      const svg = d3.select(svgRef.current);
      // clear the graph
      svg.selectAll('*').remove();
      setDrawing(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSvgSize();
        drawQueryGraph();
        setDrawing(false);
      }, 1000);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [query_graph]);

  return (
    <Paper id="queryGraphContainer" elevation={3}>
      <h5 className="cardLabel">Question Graph</h5>
      {drawing && <Loading positionStatic message="Redrawing question graph..." />}
      <svg ref={svgRef} />
    </Paper>
  );
}
