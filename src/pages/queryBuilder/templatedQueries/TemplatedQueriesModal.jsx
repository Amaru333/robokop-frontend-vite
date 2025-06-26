import React, { useContext, useEffect, useState } from 'react';
import NodeSelector from '../textEditor/textEditorRow/NodeSelector';
import { authApi } from '../../../API/baseUrlProxy';
import examples from './templates.json';

import {
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Modal,
} from '@mui/material';
import Close from '@mui/icons-material/Close';
import QueryBuilderContext from '../../../context/queryBuilder';
import API from '../../../API/routes';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    display: 'flex',
    flexDirection: 'row',
    width: 1200,
    height: 900,
    borderRadius: '8px',
  },
}));

function createTemplateDisplay(template) {
  return (
    <span>
      {template.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.text}</span>;
        }
        if (part.type === 'node') {
          return <code key={i}>{part.name}</code>;
        }
        return null;
      })}
    </span>
  );
}

function PleaseSelectAnExampleText() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2.5rem',
        fontStyle: 'italic',
        color: '#acacac',
      }}
    >
      Please select an example from the list
    </div>
  );
}

function exampleToTrapiFormat(example) {
  const templateNodes = example.template
    .filter((part) => part.type === 'node')
    .reduce((obj, { id }) => ({ ...obj, [id]: { categories: [] } }), {});

  const structureNodes = Object.entries(example.structure.nodes).reduce(
    (obj, [id, n]) => ({
      ...obj,
      [id]: { categories: [n.category], name: n.name, ...(n.id && { ids: [n.id] }) },
    }),
    {}
  );

  const nodesSortedById = Object.entries({ ...templateNodes, ...structureNodes })
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((obj, [id, n]) => ({ ...obj, [id]: n }), {});

  const edges = Object.entries(example.structure.edges).reduce(
    (obj, [id, e]) => ({
      ...obj,
      [id]: { subject: e.subject, object: e.object, predicates: [e.predicate] },
    }),
    {}
  );

  return {
    message: {
      query_graph: {
        nodes: nodesSortedById,
        edges,
      },
    },
  };
}

export default function TemplatedQueriesModal({ open, setOpen }) {
  const classes = useStyles();
  const queryBuilder = useContext(QueryBuilderContext);
  const [selectedExample, setSelectedExample] = useState(null);
  const [queries, setQueries] = useState([]);
  const handleClose = () => {
    setOpen(false);
    setSelectedExample(null);
  };

  const handleSelectExample = (example) => {
    setSelectedExample(example);
    const payload = exampleToTrapiFormat(example);
    queryBuilder.dispatch({ type: 'saveGraph', payload });
  };

  const editNode = (id, node) => {
    queryBuilder.dispatch({ type: 'editNode', payload: { id, node } });
  };

  const handleSelectBookmarkedQuery = (query_graph) => {
    const example = {
      template: [
        {
          text: JSON.stringify(query_graph.query.message.query_graph, null, 2),
          type: 'json_text',
        },
      ],
    };
    console.log('In handeSelectBookmarkedQuery');
    console.log(query_graph);
    setSelectedExample(example);
    queryBuilder.dispatch({ type: 'saveGraph', payload: query_graph.query });
  };

  useEffect(() => {
    authApi
      .get(API.queryRoutes.base)
      .then((response) => {
        setQueries(response.data);
      })
      .catch(() => {
        // TODO: Handle error appropriately
      });
  }, [open]);

  return (
    <Modal open={open} onClose={handleClose} className={classes.modal}>
      <div className={classes.paper}>
        <List
          style={{ flexBasis: 350, overflowY: 'auto' }}
          subheader={
            <ListSubheader
              component="div"
              style={{
                background: 'white',
                borderBottom: '2px solid rgba(0, 0, 0, 0.12)',
              }}
            >
              Please select an example below
            </ListSubheader>
          }
        >
          {examples.map((example, i) => (
            <ListItem
              button
              divider
              key={i}
              onClick={() => {
                handleSelectExample(example);
              }}
            >
              <ListItemText
                primary={
                  <>
                    {example.tags && (
                      <>
                        <Chip size="small" label={example.tags} />{' '}
                      </>
                    )}
                    {createTemplateDisplay(example.template)}
                  </>
                }
              />
            </ListItem>
          ))}
          {queries.map((query, i) => (
            <ListItem
              button
              divider
              key={i}
              onClick={() => {
                handleSelectBookmarkedQuery(query);
              }}
            >
              <ListItemText
                primary={
                  <>
                    <Chip size="small" label="Bookmarked" color="secondary" /> {query.name}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
        <Divider orientation="vertical" flexItem />
        <div
          style={{
            display: 'flex',
            flex: '1',
            padding: '1rem',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <IconButton size="small" onClick={handleClose}>
              <Close />
            </IconButton>
          </div>
          <div style={{ flex: '1' }}>
            {selectedExample === null ? (
              <PleaseSelectAnExampleText />
            ) : (
              selectedExample.template.map((part, i) => {
                if (part.type === 'text') {
                  return (
                    <span key={i} style={{ fontSize: '16px' }}>
                      {part.text}
                    </span>
                  );
                }
                if (part.type === 'node') {
                  return (
                    <div
                      key={i}
                      style={{
                        maxWidth: '300px',
                        display: 'inline-flex',
                        transform: 'translateY(-16px)',
                        marginLeft: '-1ch',
                        marginRight: '-1ch',
                      }}
                    >
                      <NodeSelector
                        id={part.id}
                        title={part.name}
                        size="small"
                        properties={queryBuilder.query_graph.nodes[part.id]}
                        nameresCategoryFilter={part.filterType}
                        update={editNode}
                        options={{
                          includeCuries: true,
                          includeCategories: false,
                          includeExistingNodes: false,
                        }}
                      />
                    </div>
                  );
                }
                if (part.type === 'json_text') {
                  return <pre id="resultJSONContainer">{part.text}</pre>;
                }
                return null;
              })
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Button variant="contained" color="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
