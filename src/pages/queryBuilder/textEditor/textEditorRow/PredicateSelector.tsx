/* eslint-disable react-hooks/exhaustive-deps */
import React, { useMemo, useContext, useEffect } from 'react';
import BiolinkContext from '../../../../context/biolink';
import strings from '../../../../utils/strings';
import { useQueryBuilderContext } from '../../../../context/queryBuilder';
import highlighter from '../../../../utils/d3/highlighter';
import { Autocomplete, TextField } from '@mui/material';
import { BiolinkPredicate, BiolinkContextType } from '../types';

// Props interface
interface PredicateSelectorProps {
  id: string;
}

/**
 * Get a list of categories
 * @param {array|undefined} categories - array of node categories
 * @returns list of categories or biolink:NamedThing
 */
function getCategories(categories: string[] | undefined): string[] {
  return (Array.isArray(categories) && categories.length && categories) || ['biolink:NamedThing'];
}

export default function PredicateSelector({ id }: PredicateSelectorProps) {
  const biolink = useContext(BiolinkContext) as BiolinkContextType;
  const queryBuilder = useQueryBuilderContext();
  const { query_graph } = queryBuilder;
  const edge = query_graph.edges[id];

  /**
   * Get list of valid predicates from selected node categories
   * @returns {string[]|null} list of valid predicates
   */
  function getFilteredPredicateList(): string[] | null {
    if (!biolink || !biolink.predicates || !biolink.predicates.length) {
      return null;
    }
    if (edge.subject === undefined || edge.object === undefined) {
      return null;
    }
    const subjectNode = query_graph.nodes[edge.subject];
    const objectNode = query_graph.nodes[edge.object];

    // get list of categories from each node
    const subjectCategories = getCategories(subjectNode.categories);
    const objectCategories = getCategories(objectNode.categories);

    // get hierarchies of all involved node categories
    const subjectNodeCategoryHierarchy = subjectCategories.flatMap(
      (subjectCategory: string) => biolink.ancestorsMap?.[subjectCategory] ?? []
    );
    const objectNodeCategoryHierarchy = objectCategories.flatMap(
      (objectCategory: string) => biolink.ancestorsMap?.[objectCategory] ?? []
    );

    // if we get categories back that aren't in the biolink model
    if (!subjectNodeCategoryHierarchy || !objectNodeCategoryHierarchy) {
      return null;
    }

    return biolink.predicates.map(({ predicate }: BiolinkPredicate) => predicate);
  }

  const filteredPredicateList =
    useMemo(getFilteredPredicateList, [
      // recompute if node categories change
      edge.subject !== undefined && query_graph.nodes[edge.subject]
        ? JSON.stringify(query_graph.nodes[edge.subject].categories)
        : '',
      edge.object !== undefined && query_graph.nodes[edge.object]
        ? JSON.stringify(query_graph.nodes[edge.object].categories)
        : '',
      biolink,
    ]) || [];

  function editPredicates(predicates: string[]) {
    queryBuilder.dispatch({ type: 'editPredicate', payload: { id, predicates } });
  }

  useEffect(() => {
    if (filteredPredicateList && filteredPredicateList.length) {
      const keptPredicates =
        (edge.predicates &&
          edge.predicates.filter((p: string) => filteredPredicateList.indexOf(p) > -1)) ||
        [];
      editPredicates(keptPredicates);
    }
  }, [filteredPredicateList]);

  return (
    <Autocomplete
      options={filteredPredicateList}
      className={`textEditorSelector highlight-${id}`}
      value={edge.predicates || []}
      onChange={(e, value) => editPredicates(value)}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Predicate"
          variant="outlined"
          className="edgeDropdown"
          margin="dense"
          onFocus={() => {
            highlighter.highlightGraphEdge(id);
            highlighter.highlightTextEditorEdge(id);
          }}
          onBlur={() => {
            highlighter.clearGraphEdge(id);
            highlighter.clearTextEditorEdge(id);
          }}
          InputProps={{
            ...params.InputProps,
            classes: {
              root: `edgeSelector edgeSelector-${id}`,
            },
          }}
        />
      )}
      getOptionLabel={(opt) => strings.displayPredicate(opt)}
      clearOnBlur={false}
      multiple
      limitTags={1}
      disableCloseOnSelect
      size="small"
    />
  );
}
