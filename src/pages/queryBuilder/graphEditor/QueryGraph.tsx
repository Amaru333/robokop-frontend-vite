import React, { useEffect, useContext, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import graphUtils from '../../../utils/d3/graph';
import nodeUtils from '../../../utils/d3/nodes';
import edgeUtils from '../../../utils/d3/edges';
import highlighter from '../../../utils/d3/highlighter';
import BiolinkContext from '../../../context/biolink';
import { useQueryBuilderContext } from '../../../context/queryBuilder';
import queryGraphUtils from '../../../utils/queryGraph';

const nodeRadius = 48;
const edgeLength = 225;

// Type definitions
interface BiolinkPredicate {
  predicate: string;
  domain: string;
  range: string;
  symmetric: boolean;
}

interface BiolinkContextType {
  colorMap?: (categories: string | string[]) => [string | null, string];
  hierarchies?: Record<string, any>;
  predicates?: BiolinkPredicate[];
  ancestorsMap?: Record<string, string[]>;
}

interface QueryGraphNode {
  id: string;
  name?: string;
  categories?: string[];
  is_set?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  [key: string]: any;
}

interface QueryGraphEdge {
  id: string;
  subject: string;
  object: string;
  predicates?: string[];
  source: QueryGraphNode;
  target: QueryGraphNode;
  numEdges?: number;
  index?: number;
  strokeWidth?: string;
  symmetric?: string[];
  x?: number;
  y?: number;
  [key: string]: any;
}

interface QueryGraph {
  nodes: Record<string, QueryGraphNode>;
  edges: Record<string, QueryGraphEdge>;
}

interface ClickState {
  clickedId: string;
  creatingConnection: boolean;
  [key: string]: any;
}

interface QueryGraphProps {
  height: number;
  width: number;
  clickState: ClickState;
  updateClickState: (action: { type: string; payload: any }) => void;
}

interface NodeArgs {
  nodeRadius: number;
  colorMap: (categories: any) => any[];
}

/**
 * Main D3 query graph component
 * @param {int} height - height of the query graph element
 * @param {int} width - width of the query graph element
 * @param {obj} clickState - dict of graph click state properties
 * @param {func} updateClickState - reducer to update graph click state
 */
export default function QueryGraph({
  height,
  width,
  clickState,
  updateClickState,
}: QueryGraphProps) {
  const { colorMap, predicates = [] } = useContext(BiolinkContext) as BiolinkContextType;
  const symmetricPredicates = predicates
    ?.filter((predicate: BiolinkPredicate) => predicate?.symmetric)
    ?.map((predicate: BiolinkPredicate) => predicate?.predicate);
  const queryBuilder = useQueryBuilderContext();
  const { query_graph } = queryBuilder;
  const { nodes, edges } = useMemo(
    () => queryGraphUtils.getNodeAndEdgeListsForDisplay(query_graph),
    [queryBuilder.state]
  );
  const node = useRef<any>(null);
  const edge = useRef<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const svg = useRef<any>(null);
  const simulation = useRef<any>(null);
  /**
   * Node args
   * @property {int} nodeRadius - radius of node circles
   * @property {func} colorMap - function to get node background color
   */
  const nodeArgs: NodeArgs = {
    nodeRadius,
    colorMap: colorMap || (() => ['', '']),
  };

  /**
   * Initialize the svg
   */
  useEffect(() => {
    svg.current = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('border', '1px solid black')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', [0, 0, width, height]);
  }, []);

  /**
   * Initialize node and edge containers
   */
  useEffect(() => {
    if (svg.current.select('#nodeContainer').empty()) {
      svg.current.append('g').attr('id', 'nodeContainer');
    }
    if (svg.current.select('#edgeContainer').empty()) {
      svg.current.append('g').attr('id', 'edgeContainer');
    }
    edge.current = svg.current.select('#edgeContainer').selectAll('g');
    node.current = svg.current.select('#nodeContainer').selectAll('g');
  }, []);

  /**
   * Create special svg effects on initialization
   *
   * - Edge arrows
   * - Shading for 'Set' nodes
   */
  useEffect(() => {
    if (svg.current.select('defs').empty()) {
      // edge arrow
      const defs = svg.current.append('defs');
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
          ])
        )
        .attr('fill', '#999');
      // set nodes shadow
      // http://bl.ocks.org/cpbotha/5200394
      const shadow = defs
        .append('filter')
        .attr('id', 'setShadow')
        .attr('width', '250%')
        .attr('height', '250%');
      shadow
        .append('feGaussianBlur')
        .attr('in', 'SourceAlpha')
        .attr('stdDeviation', 5)
        .attr('result', 'blur');
      shadow
        .append('feOffset')
        .attr('in', 'blur')
        .attr('dx', 0)
        .attr('dy', 0)
        .attr('result', 'offsetBlur');
      let feMerge = shadow.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'offsetBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      const buttonShadow = defs
        .append('filter')
        .attr('id', 'buttonShadow')
        .attr('width', '130%')
        .attr('height', '130%');
      buttonShadow
        .append('feGaussianBlur')
        .attr('in', 'SourceAlpha')
        .attr('stdDeviation', 1)
        .attr('result', 'blur');
      buttonShadow
        .append('feOffset')
        .attr('in', 'blur')
        .attr('dx', 2)
        .attr('dy', 2)
        .attr('result', 'offsetBlur');
      feMerge = buttonShadow.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'offsetBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    }
  }, []);

  /**
   * Base d3 force simulation initialization
   */
  useEffect(() => {
    simulation.current = d3
      .forceSimulation()
      .force('collide', d3.forceCollide().radius(nodeRadius))
      .force(
        'link',
        d3
          .forceLink<QueryGraphNode, QueryGraphEdge>()
          .id((d: QueryGraphNode) => d.id)
          .distance(edgeLength)
          .strength(1)
      )
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
      .on('tick', ticked);
  }, []);

  /**
   * Move all nodes and edges on each simulation 'tick'
   */
  function ticked() {
    if (node.current) {
      node.current.attr('transform', (d: QueryGraphNode) => {
        let padding = nodeRadius;
        // 70% of node radius so a dragged node can push into the graph bounds a little
        if (d.fx !== null && d.fx !== undefined) {
          padding *= 0.5;
        }
        d.x = graphUtils.getBoundedValue(d.x || 0, width - padding, padding);
        d.y = graphUtils.getBoundedValue(d.y || 0, height - padding, padding);
        return `translate(${d.x},${d.y})`;
      });
    }

    if (edge.current) {
      edge.current.select('.edgePath').attr('d', (d: QueryGraphEdge) => {
        const { x1, y1, qx, qy, x2, y2 } = graphUtils.getCurvedEdgePos(
          d.source?.x || 0,
          d.source?.y || 0,
          d.target?.x || 0,
          d.target?.y || 0,
          d.numEdges || 1,
          d.index || 0,
          nodeRadius
        );
        return `M${x1},${y1}Q${qx},${qy} ${x2},${y2}`;
      });

      edge.current.select('.edgeTransparent').attr('d', (d: QueryGraphEdge) => {
        const { x1, y1, qx, qy, x2, y2 } = graphUtils.getCurvedEdgePos(
          d.source?.x || 0,
          d.source?.y || 0,
          d.target?.x || 0,
          d.target?.y || 0,
          d.numEdges || 1,
          d.index || 0,
          nodeRadius
        );
        // if necessary, flip transparent path so text is always right side up
        const leftNode = x1 > x2 ? `${x2},${y2}` : `${x1},${y1}`;
        const rightNode = x1 > x2 ? `${x1},${y1}` : `${x2},${y2}`;
        return `M${leftNode}Q${qx},${qy} ${rightNode}`;
      });

      edge.current
        .select('.source')
        .attr('cx', (d: QueryGraphEdge) => {
          const { x1 } = graphUtils.getCurvedEdgePos(
            d.source?.x || 0,
            d.source?.y || 0,
            d.target?.x || 0,
            d.target?.y || 0,
            d.numEdges || 1,
            d.index || 0,
            nodeRadius
          );
          const boundedVal = graphUtils.getBoundedValue(x1, width);
          // set internal x value of edge end
          d.x = boundedVal;
          return boundedVal;
        })
        .attr('cy', (d: QueryGraphEdge) => {
          const { y1 } = graphUtils.getCurvedEdgePos(
            d.source?.x || 0,
            d.source?.y || 0,
            d.target?.x || 0,
            d.target?.y || 0,
            d.numEdges || 1,
            d.index || 0,
            nodeRadius
          );
          const boundedVal = graphUtils.getBoundedValue(y1, height);
          // set internal y value of edge end
          d.y = boundedVal;
          return boundedVal;
        });

      edge.current
        .select('.target')
        .attr('cx', (d: QueryGraphEdge) => {
          const { x2 } = graphUtils.getCurvedEdgePos(
            d.source?.x || 0,
            d.source?.y || 0,
            d.target?.x || 0,
            d.target?.y || 0,
            d.numEdges || 1,
            d.index || 0,
            nodeRadius
          );
          const boundedVal = graphUtils.getBoundedValue(x2, width);
          // set internal x value of edge end
          d.x = boundedVal;
          return boundedVal;
        })
        .attr('cy', (d: QueryGraphEdge) => {
          const { y2 } = graphUtils.getCurvedEdgePos(
            d.source?.x || 0,
            d.source?.y || 0,
            d.target?.x || 0,
            d.target?.y || 0,
            d.numEdges || 1,
            d.index || 0,
            nodeRadius
          );
          const boundedVal = graphUtils.getBoundedValue(y2, height);
          // set internal y value of edge end
          d.y = boundedVal;
          return boundedVal;
        });

      edge.current.select('.edgeButtons').attr('transform', (d: QueryGraphEdge) => {
        const { x, y } = graphUtils.getEdgeMidpoint(d);
        return `translate(${x},${y})`;
      });
    }
  }

  /**
   * Update displayed query graph
   */
  useEffect(() => {
    // preserve node position by using the already existing nodes
    const oldNodes = new Map(
      node.current.data().map((d: QueryGraphNode) => [d.id, { x: d.x, y: d.y }])
    );
    const newNodes = nodes.map((d: QueryGraphNode) =>
      Object.assign(
        oldNodes.get(d.id) || { x: Math.random() * width, y: Math.random() * height },
        d
      )
    );
    // edges need to preserve some internal properties
    const newEdges = edges.map((d: any) => ({ ...d }));

    // simulation adds x and y properties to nodes
    simulation.current.nodes(newNodes);
    // simulation converts source and target properties of
    // edges to node objects
    simulation.current.force('link')?.links(newEdges);
    simulation.current.alpha(1).restart();

    node.current = node.current
      .data(newNodes, (d: QueryGraphNode) => d.id)
      .join(
        (n: any) => nodeUtils.enter(n, nodeArgs),
        (n: any) => nodeUtils.update(n, nodeArgs),
        (n: any) => nodeUtils.exit(n)
      );

    // edge ends need the x and y of their attached nodes
    // must come after simulation
    const edgesWithCurves = edgeUtils.addEdgeCurveProperties(newEdges);
    // add symmetricPredicates to each edgesWithCurves
    edgesWithCurves.forEach((e: QueryGraphEdge) => {
      e.symmetric = symmetricPredicates;
    });

    edge.current = edge.current
      .data(edgesWithCurves, (d: QueryGraphEdge) => d.id)
      .join(edgeUtils.enter, edgeUtils.update, edgeUtils.exit);
  }, [nodes, edges]);

  function updateEdge(edgeId: string, endpoint: string, nodeId: string) {
    queryBuilder.dispatch({ type: 'editEdge', payload: { edgeId, endpoint, nodeId } });
    if (!queryBuilder.state.isValid) {
      // hacky, calls the tick function which moves the edge ends back
      simulation.current?.alpha(0.001).restart();
    }
  }

  /**
   * Set click and hover listeners when clickState or query graph changes
   */
  useEffect(() => {
    if (clickState.creatingConnection) {
      // creating a new edge
      const addNodeToConnection = (id: string) =>
        updateClickState({ type: 'connectTerm', payload: { id } });
      nodeUtils.attachConnectionClick(addNodeToConnection);
      nodeUtils.removeMouseHover();
      // edges shouldn't react when creating a new edge
      edgeUtils.removeClicks();
      edgeUtils.removeMouseHover();
    } else {
      const { clickedId } = clickState;
      const setClickedId = (id: string) => updateClickState({ type: 'click', payload: { id } });
      const openEditor = (id: string, anchor: any, type: string) =>
        updateClickState({ type: 'openEditor', payload: { id, anchor, type } });
      nodeUtils.attachNodeClick(clickedId, setClickedId);
      nodeUtils.attachEditClick(openEditor, setClickedId);
      nodeUtils.attachDeleteClick(
        (id: string) => queryBuilder.dispatch({ type: 'deleteNode', payload: { id } }),
        setClickedId
      );
      nodeUtils.attachMouseHover(clickedId);
      nodeUtils.attachDrag(simulation.current, width, height, nodeRadius);

      edgeUtils.attachEdgeClick(clickedId, setClickedId);
      edgeUtils.attachEditClick(openEditor, setClickedId);
      edgeUtils.attachDeleteClick(
        (id: string) => queryBuilder.dispatch({ type: 'deleteEdge', payload: { id } }),
        setClickedId
      );
      edgeUtils.attachMouseHover(clickedId);
      edgeUtils.attachDrag(simulation.current, width, height, nodeRadius, updateEdge);
    }
    // set svg global click listener for highlighting
    svg.current.on('click', (e: any) => {
      d3.selectAll('.deleteRect,.deleteLabel,.editRect,.editLabel').style('display', 'none');
      d3.select('#edgeContainer').raise();
      highlighter.clearAllNodes();
      highlighter.clearAllEdges();
      if (clickState.clickedId !== '') {
        updateClickState({ type: 'click', payload: { id: '' } });
      }
      // stop click events from leaving svg area.
      // clicks were closing any alerts immediately.
      e.stopPropagation();
    });
  }, [clickState, nodes, edges]);

  return <svg ref={svgRef} />;
}
