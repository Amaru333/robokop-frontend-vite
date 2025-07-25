import stringUtils from './strings';
import queryGraphUtils from './queryGraph';
import queryBuilderUtils from './queryBuilder';

/**
 * Find the first node id for topological sorting
 *
 * Rules:
 * 1. Sort by pinned and then unpinned nodes
 * 2. Sort by number of connected edges
 * 3. Pick first node in insertion order
 * @returns the starting node id
 */
type QueryGraphNode = {
  ids?: any[];
  categories?: any;
  name?: string;
  [key: string]: any;
};
type QueryGraph = {
  nodes?: { [key: string]: QueryGraphNode };
  edges?: { [key: string]: { subject: string; object: string } };
};

export function findStartingNode(query_graph: QueryGraph): string | null {
  const nodes = Object.entries(query_graph.nodes ?? {}).map(([key, node]) => ({
    key,
    pinned: !!(
      typeof node === 'object' &&
      node &&
      Array.isArray((node as QueryGraphNode).ids) &&
      ((node as QueryGraphNode).ids?.length ?? 0) > 0
    ),
  }));
  const edgeNums = queryBuilderUtils.getNumEdgesPerNode({
    edges: query_graph.edges ?? {},
  });
  const unpinnedNodes = nodes.filter((node) => !node.pinned && node.key in edgeNums);
  const pinnedNodes = nodes.filter((node) => node.pinned && node.key in edgeNums);
  let startingNode = (nodes.length && nodes[0].key) || null;
  if (pinnedNodes.length) {
    pinnedNodes.sort((a, b) => edgeNums[a.key] - edgeNums[b.key]);
    startingNode = pinnedNodes[0].key;
  } else if (unpinnedNodes.length) {
    unpinnedNodes.sort((a, b) => edgeNums[a.key] - edgeNums[b.key]);
    startingNode = unpinnedNodes[0].key;
  }
  return startingNode;
}

/**
 * Find the directly connected nodes
 * @param {object} edges - edges from a query graph
 * @param {array} nodeList - list of node ids
 *
 * **Modifies the nodeList arg**
 */
function findConnectedNodes(
  edges: { [x: string]: { subject: any; object: any } },
  nodeList: any[]
) {
  const nodeId = nodeList[nodeList.length - 1];
  const connectedEdgeIds = Object.keys(edges).filter((edgeId) => {
    const edge = edges[edgeId];
    return edge.subject === nodeId || edge.object === nodeId;
  });
  connectedEdgeIds.forEach((edgeId) => {
    const { subject, object } = edges[edgeId];
    const subjectIndex = nodeList.indexOf(subject);
    const objectIndex = nodeList.indexOf(object);
    if (objectIndex === -1) {
      nodeList.push(object);
      findConnectedNodes(edges, nodeList);
    }
    if (subjectIndex === -1) {
      nodeList.push(subject);
      findConnectedNodes(edges, nodeList);
    }
  });
}

/**
 * Sort nodes for results table headers
 * @param {object} query_graph - query graph object
 * @param {string} startingNode - node id
 * @returns {string[]} topologically sorted nodes
 */
export function sortNodes(query_graph: { edges: any; nodes: {} }, startingNode: string) {
  const sortedNodes = [startingNode];
  findConnectedNodes(query_graph.edges, sortedNodes);
  // TODO: handle detached sub-graphs, right now those nodes will be tacked on the end in insertion order
  // include any detached nodes at the end
  const extraNodes = Object.keys(query_graph.nodes).filter(
    (nodeId) => sortedNodes.indexOf(nodeId) === -1
  );
  return [...sortedNodes, ...extraNodes];
}

/**
 * Get the width of a specific column based on the lengths of all its values
 * @param {array} rows - all rows of the table
 * @param {string} qg_id - query graph id
 * @param {object} kg_nodes - knowledge graph nodes
 * @param {string} headerText - header text of table column
 * @returns column width as an integer
 */
function getColumnWidth(
  rows: any[],
  qg_id: string | number,
  kg_nodes: { [x: string]: { name: any } },
  headerText: string | any[]
) {
  // https://lifesaver.codes/answer/possible-to-set-a-column-width-based-on-the-longest-cell-width
  const maxWidth = 400;
  const magicSpacing = 10;
  const cellLength = Math.max(
    ...rows.map(
      (row: { node_bindings: { [x: string]: { id: string | number }[] } }) =>
        (kg_nodes[row.node_bindings[qg_id][0].id].name || '').length
    ),
    headerText.length
  );
  return Math.min(maxWidth, cellLength * magicSpacing);
}

/**
 * Make a list of table headers for the result table
 * @param {object} message - full TRAPI message
 * @param {function} colorMap - function to get color from node category
 * @returns {object[]} list of table header objects
 */
function makeTableHeaders(
  message: { query_graph: any; knowledge_graph: any; results: any },
  colorMap: (arg0: any) => any[]
) {
  const { query_graph, knowledge_graph, results } = message;
  // startingNode could be undefined for fully cyclic graph
  // topologically sort query graph nodes
  const startingNode = findStartingNode(query_graph);
  if (!startingNode) {
    // If there are no query graph nodes, don't show the results table
    return [];
  }
  const sortedNodes = sortNodes(query_graph, startingNode);
  const headerColumns = sortedNodes.map((id) => {
    const qgNode = query_graph.nodes[id];
    const backgroundColor = colorMap(qgNode.categories)[1];
    const nodeIdLabel = queryGraphUtils.getTableHeaderLabel(qgNode);
    const headerText =
      qgNode.name || nodeIdLabel || stringUtils.displayCategory(qgNode.categories) || 'Something';
    const width = getColumnWidth(results, id, knowledge_graph.nodes, headerText);
    return {
      Header: `${headerText} (${id})`,
      color: backgroundColor,
      id,
      accessor: (row: { node_bindings: { [x: string]: any } }) => {
        const nodeBinding = row.node_bindings[id];
        if (!nodeBinding || nodeBinding.length === 0) return '';
        if (nodeBinding.length > 1) {
          // this is a set
          return `Set of ${stringUtils.displayCategory(qgNode.categories)} [${nodeBinding.length}]`;
        }
        return knowledge_graph.nodes[nodeBinding[0].id].name || nodeBinding[0].id;
      },
      Cell: ({ value }: { value: any }) => value || 'Unknown',
      disableSortBy: true,
      width,
      filter: 'equals',
    };
  });
  if (results.length && results[0].score) {
    const scoreColumn = {
      Header: 'Score',
      color: undefined,
      id: 'score',
      accessor: (row: { score?: number; node_bindings?: { [x: string]: any } }) =>
        typeof row.score === 'number' ? Math.round(row.score * 1000) / 1000 : undefined,
      Cell: ({ value }: { value: any }) => value ?? 'Unknown',
      disableSortBy: false,
      width: 30,
      filter: 'equals',
      sortDescFirst: true,
      disableFilters: true,
    };
    headerColumns.push(scoreColumn);
  }
  return headerColumns;
}

const pubmedUrl = 'https://www.ncbi.nlm.nih.gov/pubmed/';

/**
 * Get publication attributes from knowledge graph nodes and edges
 * @param {object} kgObj - knowledge graph node or edge object
 * @returns a list of publication urls
 */
function getPublications(kgObj: { attributes: any[] }) {
  const publications: string[] = [];
  // Try and find any publications in edge attributes
  const publicationsAttributes =
    kgObj.attributes &&
    Array.isArray(kgObj.attributes) &&
    // TRAPI for publications attributes is not standardized
    kgObj.attributes.filter(
      (att: { attribute_type_id: string; type: string }) =>
        att.attribute_type_id === 'biolink:publications' ||
        att.attribute_type_id === 'biolink:Publication' ||
        att.attribute_type_id === 'publications' ||
        att.type === 'EDAM:data_0971'
    );
  if (Array.isArray(publicationsAttributes)) {
    publicationsAttributes.forEach((attribute: { value_url: any; value: any[] }) => {
      if (attribute.value_url) {
        publications.push(attribute.value_url);
      } else if (attribute.value) {
        if (!Array.isArray(attribute.value)) {
          attribute.value = [attribute.value];
        }
        attribute.value.forEach((publicationId: string) => {
          if (typeof publicationId === 'string' && publicationId.startsWith('PMID:')) {
            publications.push(pubmedUrl + publicationId.split(':')[1]);
          }
        });
      }
    });
  }
  return publications;
}

export default {
  makeTableHeaders,
  getPublications,
};
