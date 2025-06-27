import * as d3 from 'd3';

/**
 * Get the opposite edge end name
 * @param {string} edgeEnd - edge end, either source or target
 * @returns other edge end
 */
function getOtherEdgeEnd(edgeEnd: string) {
  return edgeEnd === 'target' ? 'source' : 'target';
}

/**
 * Get angle of line connecting points, in radians
 * @param {int} x1 x of first point
 * @param {int} y1 y of first point
 * @param {int} x2 x of second point
 * @param {int} y2 y of second point
 */
function getAngle(x1: number, y1: number, x2: number, y2: number) {
  const delta_x = x2 - x1;
  const delta_y = y2 - y1;
  const theta_radians = Math.atan2(delta_y, delta_x);
  return theta_radians;
}

/**
 * Calculate the x and y of both edge ends as well as the quadratic curve point
 * to make the edge curve
 * @param {int} sourceX x of source node
 * @param {int} sourceY y of source node
 * @param {int} targetX x of target node
 * @param {int} targetY y of target node
 * @param {int} numEdges number of total edges
 * @param {int} index index of edge to find its curve position
 * @param {int} nodeRadius node radius
 * @returns {obj} all the necessary points to make a curvy edge
 */
function getCurvedEdgePos(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  numEdges: any,
  index: number,
  nodeRadius: number
) {
  const arcWidth = Math.PI / 3;
  const edgeStep = arcWidth / 5;
  // get angle between nodes
  const theta = getAngle(sourceX, sourceY, targetX, targetY);
  // get adjusted angle based on edge index
  const arc_p1 = theta + edgeStep * index;
  const arc_p2 = theta + Math.PI - edgeStep * index;
  // compute x's and y's
  const x1 = sourceX + Math.cos(arc_p1) * nodeRadius;
  const y1 = sourceY + Math.sin(arc_p1) * nodeRadius;
  const x2 = targetX + Math.cos(arc_p2) * nodeRadius;
  const y2 = targetY + Math.sin(arc_p2) * nodeRadius;
  const alpha = 50; // tuning param
  let l = index * 0.1 + index * 0.3; // num of edge
  // move first arced edges out just a smidge
  if (index === 1 || index === -1) {
    l += index * 0.4;
  }
  const bx = (x1 + x2) / 2;
  const by = (y1 + y2) / 2;
  const vx = x2 - x1;
  const vy = y2 - y1;

  const norm_v = Math.sqrt(vx ** 2 + vy ** 2);
  const vx_norm = vx / norm_v;
  const vy_norm = vy / norm_v;
  const vx_perp = -vy_norm;
  const vy_perp = vx_norm;
  const qx = bx + alpha * l * vx_perp;
  const qy = by + alpha * l * vy_perp;
  return {
    x1,
    y1,
    qx,
    qy,
    x2,
    y2,
  };
}

/**
 * Get x and y positions of shortened line end
 *
 * Given a line, we will find the new line end according
 * to the line angle and offset
 * @param {int} x1 - line start x
 * @param {int} y1 - line start y
 * @param {int} x2 - line end x
 * @param {int} y2 - line end y
 * @param {int} offset - offset for current line end
 * @returns {obj} x and y postions of new line end
 */
function getShortenedLineEnd(x1: number, y1: number, x2: any, y2: any, offset: number) {
  const angle = getAngle(x1, y1, x2, y2);
  const x = x1 + Math.cos(angle) * offset;
  const y = y1 + Math.sin(angle) * offset;
  return { x, y };
}

/**
 * Find bounded value within a lower and upper bound
 * @param {int} value - value to bound
 * @param {int} upperBound - upper bound of value
 * @param {int} lowerBound - lower bound of value; default: 0
 * @returns {int} bounded value
 */
function getBoundedValue(value: number, upperBound: number, lowerBound = 0) {
  return Math.max(lowerBound, Math.min(value, upperBound));
}

function fitTextWithEllipsis(
  text:
    | string
    | number
    | boolean
    | d3.ValueFn<SVGTextElement, unknown, string | number | boolean | null>
    | null,
  el: d3.Selection<any, unknown, null, undefined>,
  nodeRadius: string | number,
  fontSize:
    | string
    | number
    | boolean
    | readonly (string | number)[]
    | d3.ValueFn<
        SVGTextElement,
        unknown,
        string | number | boolean | readonly (string | number)[] | null
      >
    | null,
  dy: string
) {
  // Only handle string text for ellipsis logic
  const textStr = typeof text === 'string' ? text : String(text ?? '');
  // Set up the SVG and circle
  const svg = d3.select('body').append('svg').attr('width', 300).attr('height', 300);
  const tempText = svg
    .append('text')
    .attr('font-size', fontSize)
    .style('visibility', 'hidden') // Hide temp text
    .text(textStr);

  const targetLength = Number(nodeRadius) * 2 * 0.9;
  let finalText: string = textStr;
  let textLength = 0;
  const tempTextNode = tempText.node();
  if (tempTextNode) {
    textLength = tempTextNode.getComputedTextLength();
    if (textLength > Number(nodeRadius) * 2 * 1.25) {
      while (textLength > targetLength && finalText.length > 0) {
        finalText = finalText.slice(0, -1);
        tempText.text(`${finalText.slice(0, -1)}...`);
        textLength = tempTextNode.getComputedTextLength();
      }
      finalText = `${finalText}...`;
    }
  }
  tempText.remove();
  svg.remove();
  el.append('tspan').attr('x', 0).attr('dy', dy).text(finalText);
}

function fitTextIntoCircle(this: SVGTextElement) {
  // Ensure 'this' is an SVGTextElement
  const el = d3.select<SVGTextElement, unknown>(this);
  const node = el.node();
  if (!node) return;

  // getComputedTextLength is available on SVGTextElement
  const textLength = node.getComputedTextLength();
  const text = el.text();

  // grab the parent g tag
  const parent = node.parentNode as SVGGElement | null;
  if (!parent) return;

  // grab the corresponding circle
  const circle = d3.select(parent).select('circle');
  const nodeRadiusStr = circle.attr('r');
  const nodeRadius = Number(nodeRadiusStr);
  if (isNaN(nodeRadius)) return;

  const maxFontSize = nodeRadius * 0.4;
  const minFontSize = 9;
  const diameter = nodeRadius * 2;
  const fontSize = `${Math.max(
    minFontSize,
    Math.min(maxFontSize, diameter / Math.sqrt(Math.max(textLength, 1)))
  )}px`;
  el.style('font-size', fontSize);
  el.text('');
  const words = text.split(' ');
  if (words.length === 1 || textLength < 10) {
    fitTextWithEllipsis(
      text,
      el as unknown as d3.Selection<any, unknown, null, undefined>,
      nodeRadius,
      fontSize,
      '0em'
    );
  } else {
    // Split into two lines
    const middle = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, middle).join(' ');
    const secondLine = words.slice(middle).join(' ');
    fitTextWithEllipsis(
      firstLine,
      el as unknown as d3.Selection<any, unknown, null, undefined>,
      nodeRadius,
      fontSize,
      '-0.4em'
    );
    fitTextWithEllipsis(
      secondLine,
      el as unknown as d3.Selection<any, unknown, null, undefined>,
      nodeRadius,
      fontSize,
      '1.2em'
    );
  }
}

/**
 * Trim and add an ellipsis to the end of long node labels
 */
function ellipsisOverflow(this: {
  getOtherEdgeEnd: (edgeEnd: any) => 'target' | 'source';
  getCurvedEdgePos: (
    sourceX: any,
    sourceY: any,
    targetX: any,
    targetY: any,
    numEdges: any,
    index: any,
    nodeRadius: any
  ) => { x1: any; y1: any; qx: number; qy: number; x2: any; y2: any };
  getShortenedLineEnd: (x1: any, y1: any, x2: any, y2: any, offset: any) => { x: any; y: any };
  getBoundedValue: (value: any, upperBound: any, lowerBound?: number) => number;
  ellipsisOverflow: () => void;
  getEdgeMidpoint: (edge: any) => { x: number; y: number };
  fitTextIntoCircle: () => void;
  isInside: (x: any, y: any, cx: any, cy: any, r: any) => boolean;
  shouldShowArrow: (edge: any, symmetricPredicates?: string[]) => any;
  showElement: () => void;
  hideElement: () => void;
}) {
  const el = d3.select(this as unknown as SVGTextElement);
  const node = el.node() as SVGTextElement | null;
  if (!node) return;
  let textLength = node.getComputedTextLength();
  let text = el.text();
  // grab the parent g tag
  const parent = node.parentNode as SVGGElement | null;
  if (!parent) return;
  // grab the corresponding circle
  const circle = d3.select(parent).select('circle');
  // get circle radius
  const nodeRadiusStr = circle.attr('r');
  const nodeRadius = Number(nodeRadiusStr);
  if (isNaN(nodeRadius)) return;
  const diameter = nodeRadius * 2;
  // give the text a little padding
  const targetLength = diameter * 0.9;
  while (textLength > targetLength && text.length > 0) {
    text = text.slice(0, -1);
    el.text(`${text}...`);
    const updatedNode = el.node() as SVGTextElement | null;
    textLength = updatedNode ? updatedNode.getComputedTextLength() : 0;
  }
}

/**
 * Get the middle of two points
 * @param {obj} edge edge object
 * @returns {obj} the x and y of the middle of two points
 */
function getEdgeMidpoint(edge: { source: any; target: any }) {
  const { source, target } = edge;
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  return { x: midX, y: midY };
}

/**
 * Determine if point is within a circle
 * @param {int} x x position of point
 * @param {int} y y position of point
 * @param {int} cx center x of circle
 * @param {int} cy center y of circle
 * @param {int} r radius of circle
 * @returns {bool} Is point within circle
 */
function isInside(x: number, y: number, cx: number, cy: number, r: number) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2;
}

/**
 * Should an edge have an arrow
 * @param {obj} edge edge object
 * @returns {str} url(#arrow) or empty string
 */
function shouldShowArrow(
  edge: { predicates: any[]; predicate: string },
  symmetricPredicates = ['biolink:related_to']
) {
  return (
    (edge.predicates &&
      edge.predicates.findIndex((p: string) => !symmetricPredicates.includes(p)) > -1) ||
    (edge.predicate && !symmetricPredicates.includes(edge.predicate))
  );
}

/**
 * Fade a DOM element in to view
 */
function showElement(this: {
  getOtherEdgeEnd: (edgeEnd: any) => 'target' | 'source';
  getCurvedEdgePos: (
    sourceX: any,
    sourceY: any,
    targetX: any,
    targetY: any,
    numEdges: any,
    index: any,
    nodeRadius: any
  ) => { x1: any; y1: any; qx: number; qy: number; x2: any; y2: any };
  getShortenedLineEnd: (x1: any, y1: any, x2: any, y2: any, offset: any) => { x: any; y: any };
  getBoundedValue: (value: any, upperBound: any, lowerBound?: number) => number;
  ellipsisOverflow: () => void;
  getEdgeMidpoint: (edge: any) => { x: number; y: number };
  fitTextIntoCircle: () => void;
  isInside: (x: any, y: any, cx: any, cy: any, r: any) => boolean;
  shouldShowArrow: (edge: any, symmetricPredicates?: string[]) => any;
  showElement: () => void;
  hideElement: () => void;
}) {
  d3.select(this as unknown as Element)
    .transition()
    .duration(500)
    .style('opacity', 1);
}

/**
 * Fade a DOM element out of view
 */
function hideElement(this: {
  getOtherEdgeEnd: (edgeEnd: any) => 'target' | 'source';
  getCurvedEdgePos: (
    sourceX: any,
    sourceY: any,
    targetX: any,
    targetY: any,
    numEdges: any,
    index: any,
    nodeRadius: any
  ) => { x1: any; y1: any; qx: number; qy: number; x2: any; y2: any };
  getShortenedLineEnd: (x1: any, y1: any, x2: any, y2: any, offset: any) => { x: any; y: any };
  getBoundedValue: (value: any, upperBound: any, lowerBound?: number) => number;
  ellipsisOverflow: () => void;
  getEdgeMidpoint: (edge: any) => { x: number; y: number };
  fitTextIntoCircle: () => void;
  isInside: (x: any, y: any, cx: any, cy: any, r: any) => boolean;
  shouldShowArrow: (edge: any, symmetricPredicates?: string[]) => any;
  showElement: () => void;
  hideElement: () => void;
}) {
  d3.select(this as unknown as Element)
    .transition()
    .duration(1000)
    .style('opacity', 0);
}

export default {
  getOtherEdgeEnd,

  getCurvedEdgePos,
  getShortenedLineEnd,
  getBoundedValue,

  ellipsisOverflow,
  getEdgeMidpoint,
  fitTextIntoCircle,

  isInside,
  shouldShowArrow,

  showElement,
  hideElement,
};
