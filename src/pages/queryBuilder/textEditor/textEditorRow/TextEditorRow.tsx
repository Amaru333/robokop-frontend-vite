import React, { useContext, useState } from "react";

import { IconButton, Collapse } from "@mui/material";

import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import IndeterminateCheckBoxOutlinedIcon from "@mui/icons-material/IndeterminateCheckBoxOutlined";

import BiolinkContext from "../../../../context/biolink";
import QueryBuilderContext from "../../../../context/queryBuilder";
import NodeSelector from "./NodeSelector";
import { NodeOption } from "../types";
import PredicateSelector from "./PredicateSelector";
import QualifiersSelector from "./QualifiersSelector";

import "./textEditorRow.css";
import { BiolinkModel, QueryGraphNode, QueryGraphEdge, QueryGraph, QueryBuilderContextType, BiolinkContextType, TextEditorRowProps } from "../types";

// Define ValidAssociation locally
interface ValidAssociation {
  association: any;
  inheritedRanges: { subject: any; predicate: any; object: any };
  level: number;
  qualifiers: any[];
}

function getValidAssociations(s: string, p: string, o: string, model: BiolinkModel): ValidAssociation[] {
  const validAssociations: ValidAssociation[] = [];

  const subject = model.classes.lookup.get(s);
  const predicate = model.slots.lookup.get(p);
  const object = model.classes.lookup.get(o);

  const isInRange = (n: any, range: any): boolean => {
    const traverse = (nodes: any[], search: any): boolean => {
      for (const node of nodes) {
        if (node === search) return true;
        if (node.parent) {
          if (traverse([node.parent], search)) return true;
        }
        if (node.mixinParents) {
          if (traverse(node.mixinParents, search)) return true;
        }
      }
      return false;
    };
    return traverse([n], range);
  };

  // Returns true if `n` is an ancestor of `domain`
  const isInDomain = (n: any, domain: any): boolean => {
    const traverse = (nodes: any[], search: any): boolean => {
      for (const node of nodes) {
        if (node === search) return true;
        if (node.parent) {
          if (traverse([node.parent], search)) return true;
        }
        if (node.mixinParents) {
          if (traverse(node.mixinParents, search)) return true;
        }
      }
      return false;
    };
    return traverse([domain], n);
  };

  /**
   * Get the inherited subject/predicate/object ranges for an association
   */
  const getInheritedSPORanges = (association: any) => {
    const namedThing = model.classes.lookup.get("named thing");
    const relatedTo = model.slots.lookup.get("related to");

    const traverse = (nodes: any[], part: string): any => {
      for (const node of nodes) {
        if (node.slotUsage && node.slotUsage[part]) return node.slotUsage[part];
        if (node.parent) {
          const discoveredType = traverse([node.parent], part);
          if (discoveredType !== null) return discoveredType;
        }
        if (node.mixinParents) {
          const discoveredType = traverse(node.mixinParents, part);
          if (discoveredType !== null) return discoveredType;
        }
      }
      return null;
    };

    const sub = traverse([association], "subject") || namedThing;
    const pred = traverse([association], "predicate") || relatedTo;
    const obj = traverse([association], "object") || namedThing;

    return { subject: sub, predicate: pred, object: obj };
  };

  // DFS over associations
  const traverse = (nodes: any[], level = 0) => {
    for (const association of nodes) {
      if (association.slotUsage && !association.abstract) {
        const inherited = getInheritedSPORanges(association);

        const validSubject = isInRange(subject, inherited.subject) || isInDomain(subject, inherited.subject);
        const validObject = isInRange(object, inherited.object) || isInDomain(object, inherited.object);
        const validPredicate = isInRange(predicate, inherited.predicate) || isInDomain(predicate, inherited.predicate);

        const qualifiers = Object.entries(association.slotUsage)
          .map(([qualifierName, properties]: [string, any]) => {
            if (properties === null) return null;
            const qualifier = model.slots.lookup.get(qualifierName);
            if (!qualifier || !isInRange(qualifier, model.qualifiers)) return null;

            let range;
            if (properties && properties.range) {
              const potentialEnum = model.enums[properties.range];
              const potentialClassNode = model.classes.lookup.get(properties.range);

              if (potentialEnum) range = potentialEnum;
              if (potentialClassNode) range = potentialClassNode;
            }

            let subpropertyOf;
            if (properties && properties.subproperty_of && model.slots.lookup.has(properties.subproperty_of)) {
              subpropertyOf = model.slots.lookup.get(properties.subproperty_of);
            }

            return {
              qualifier,
              range,
              subpropertyOf,
            };
          })
          .filter((q) => q !== null);

        if (validSubject && validObject && validPredicate) {
          validAssociations.push({
            association,
            inheritedRanges: inherited,
            level,
            qualifiers,
          });
        }
      }
      if (association.children) traverse(association.children, level + 1);
    }
  };
  traverse([model.associations]);

  validAssociations.sort((a, b) => b.level - a.level);

  return validAssociations;
}

export default function TextEditorRow({ row, index }: { row: TextEditorRowProps; index: number }) {
  const queryBuilder = useContext(QueryBuilderContext) as QueryBuilderContextType;
  const { model } = useContext(BiolinkContext) as BiolinkContextType;
  const [isOpen, setIsOpen] = useState(false);
  if (!model) return "Loading...";
  const { query_graph } = queryBuilder;
  const edge = query_graph.edges[row.edgeId];
  if (!edge) return null;
  const hasQualifiers =
    Array.isArray(edge?.qualifier_constraints) &&
    edge.qualifier_constraints.length > 0 &&
    Array.isArray(edge.qualifier_constraints[0]?.qualifier_set) &&
    edge.qualifier_constraints[0].qualifier_set.length > 0;
  const { edgeId, subjectIsReference, objectIsReference } = row;

  function getNodeCategory(nodeId: string | undefined): string {
    if (!nodeId) return "biolink:NamedThing";
    const node = query_graph.nodes[nodeId];
    if (node && Array.isArray(node.categories) && node.categories[0]) {
      return node.categories[0];
    }
    return "biolink:NamedThing";
  }

  const subject =
    getNodeCategory(edge.subject)
      .replace("biolink:", "")
      .match(/[A-Z][a-z]+/g)
      ?.join(" ")
      .toLowerCase() || "named thing";
  const predicate = ((edge.subject && query_graph.nodes[edge.subject]?.categories && edge.predicates?.[0]) || "biolink:related_to").replace("biolink:", "").replace(/_/g, " ");
  const object =
    getNodeCategory(edge.object)
      .replace("biolink:", "")
      .match(/[A-Z][a-z]+/g)
      ?.join(" ")
      .toLowerCase() || "named thing";

  const validAssociations = getValidAssociations(subject, predicate, object, model);

  function deleteEdge() {
    queryBuilder.dispatch({ type: "deleteEdge", payload: { id: edgeId } });
  }

  function setReference(edgeEnd: "subject" | "object", nodeId: string | null) {
    queryBuilder.dispatch({ type: "editEdge", payload: { edgeId, endpoint: edgeEnd, nodeId } });
  }

  function editNode(id: string, value: NodeOption | null) {
    if (!value) return;
    queryBuilder.dispatch({ type: "editNode", payload: { id, node: value } });
  }

  function addHop() {
    queryBuilder.dispatch({ type: "addHop", payload: { nodeId: edge.object } });
  }

  return (
    <div className="editor-row-wrapper">
      <div className="textEditorRow">
        <IconButton onClick={deleteEdge} className="textEditorIconButton" disabled={(queryBuilder.textEditorRows?.length ?? 0) < 2}>
          <IndeterminateCheckBoxOutlinedIcon />
        </IconButton>
        <p>
          {index === 0 && "Find"}
          {index === 1 && "where"}
          {index > 1 && "and where"}
        </p>
        <NodeSelector
          id={edge.subject}
          properties={query_graph.nodes[edge.subject]}
          setReference={(nodeId: string | null) => setReference("subject", nodeId)}
          update={subjectIsReference ? () => setReference("subject", null) : editNode}
          isReference={subjectIsReference}
          options={{
            includeCuries: !subjectIsReference,
            includeCategories: !subjectIsReference,
            includeExistingNodes: index !== 0,
            existingNodes: Object.keys(query_graph.nodes)
              .filter((key) => key !== edge.object)
              .map((key) => ({
                ...query_graph.nodes[key],
                key,
                name: query_graph.nodes[key].name || key,
              })),
          }}
        />
        <PredicateSelector id={edgeId} />
        <NodeSelector
          id={edge.object}
          properties={query_graph.nodes[edge.object]}
          setReference={(nodeId: string | null) => setReference("object", nodeId)}
          update={objectIsReference ? () => setReference("object", null) : editNode}
          isReference={objectIsReference}
          options={{
            includeCuries: !objectIsReference,
            includeCategories: !objectIsReference,
            includeExistingNodes: index !== 0,
            existingNodes: Object.keys(query_graph.nodes)
              .filter((key) => key !== edge.subject)
              .map((key) => ({
                ...query_graph.nodes[key],
                key,
                name: query_graph.nodes[key].name || key,
              })),
          }}
        />
        <IconButton onClick={addHop} className="textEditorIconButton">
          <AddBoxOutlinedIcon />
        </IconButton>
      </div>

      <Collapse in={isOpen}>
        <div className="qualifiers-wrapper">
          <QualifiersSelector id={edgeId} associations={validAssociations} />
        </div>
      </Collapse>

      <button
        type="button"
        className="dropdown-toggle"
        onClick={() => {
          setIsOpen((p) => !p);
        }}
        style={{ color: "#333" }}
      >
        <span style={{ fontSize: "0.8em" }}>{isOpen ? "▲" : "▼"}</span>
        <span
          style={
            hasQualifiers
              ? {
                  fontWeight: "bold",
                  fontStyle: "italic",
                }
              : undefined
          }
        >
          {" Qualifiers"}
          {hasQualifiers && "*"}
        </span>
      </button>
    </div>
  );
}
