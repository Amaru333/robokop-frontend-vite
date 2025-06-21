import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
} from '@mui/material';
import Papa from 'papaparse';

import { useLocalStorage } from '../hooks';

const jsonToCsvString = (json) => Promise.resolve(Papa.unparse(json));

const constructPmidOrPmcLink = (id) => {
  if (id.startsWith('PMID')) {
    return `https://pubmed.ncbi.nlm.nih.gov/${id.split(':')[1]}`;
  }
  if (id.startsWith('PMC')) {
    return `https://pmc.ncbi.nlm.nih.gov/articles/${id.split(':')[1]}`;
  }
  return '';
};

const getConcatPublicationsForResult = (result, message) => {
  const edgeIds = Object.values(result.analyses[0].edge_bindings)
    .flat()
    .map((e) => e.id);
  const publications = edgeIds
    .flatMap((edgeId) =>
      message.knowledge_graph.edges[edgeId].attributes
        .filter((attr) => attr.attribute_type_id === 'biolink:publications')
        .flatMap((attr) => attr.value)
    )
    .map(constructPmidOrPmcLink);

  return publications;
};

const constructCsvObj = (message) => {
  const nodeLabelHeaders = Object.keys(message.results[0].node_bindings).flatMap((node_label) => [
    `${node_label} (Name)`,
    `${node_label} (CURIE)`,
  ]);

  let csvHeaderEdgeLabelsMerged = new Set();
  message.results.forEach((result) => {
    const curieToNodeLabel = {};

    Object.entries(result.node_bindings).forEach(([nodeLabel, nb]) => {
      const curie = nb[0].id;
      curieToNodeLabel[curie] = nodeLabel;
    });

    Object.values(result.analyses[0].edge_bindings)
      .flat()
      .forEach((eb) => {
        const { subject, object } = message.knowledge_graph.edges[eb.id];
        const subjectLabel = curieToNodeLabel[subject];
        const objectLabel = curieToNodeLabel[object];
        const csvHeaderEdgeLabel = `${subjectLabel} -> ${objectLabel}`;
        if (subjectLabel && objectLabel) {
          // TODO: These were occasionally returning undefined, figure out why
          csvHeaderEdgeLabelsMerged.add(csvHeaderEdgeLabel);
        }
      });
  });
  csvHeaderEdgeLabelsMerged = Array.from(csvHeaderEdgeLabelsMerged);

  const header = [...nodeLabelHeaders, ...csvHeaderEdgeLabelsMerged, 'Score', 'Publications'];

  const body = message.results.map((result) => {
    const row = new Array(header.length).fill('');
    const curieToNodeLabel = {};
    Object.entries(result.node_bindings).forEach(([nodeLabel, nb], i) => {
      const curie = nb[0].id;
      curieToNodeLabel[curie] = nodeLabel;
      const node = message.knowledge_graph.nodes[curie];
      row[i * 2] = node.name || node.categories[0];
      row[i * 2 + 1] = curie;
    });

    Object.values(result.analyses[0].edge_bindings)
      .flat()
      .forEach((eb) => {
        const { subject, object, predicate, sources } = message.knowledge_graph.edges[eb.id];
        const subjectLabel = curieToNodeLabel[subject];
        const objectLabel = curieToNodeLabel[object];
        if (subjectLabel && objectLabel) {
          const csvHeaderEdgeLabel = `${curieToNodeLabel[subject]} -> ${curieToNodeLabel[object]}`;
          const edgeHeaderIndex = header.findIndex((h) => h === csvHeaderEdgeLabel);
          const primarySourceObj = sources.find(
            (s) => s.resource_role === 'primary_knowledge_source'
          );
          const primarySource = (primarySourceObj && primarySourceObj.resource_id) || undefined;
          row[edgeHeaderIndex] += `${row[edgeHeaderIndex].length > 0 ? '\n' : ''}${predicate}${
            primarySource ? ` (${primarySource})` : ''
          }`;
        }
      });

    row[row.length - 2] = result.score;
    row[row.length - 1] = getConcatPublicationsForResult(result, message).join('\n');

    return row;
  });

  return [header, ...body];
};

export default function DownloadDialog({ open, setOpen, message, download_type = 'answer' }) {
  const [type, setType] = React.useState('json');
  const [fileName, setFileName] = React.useState('ROBOKOP_message');
  const [queryHistory, setQueryHistory] = useLocalStorage('query_history', {});

  const handleClose = () => {
    setOpen(false);
  };

  const handleClickDownload = async () => {
    switch (download_type) {
      case 'answer': {
        let blob;
        if (type === 'json') {
          blob = new Blob([JSON.stringify({ message }, null, 2)], { type: 'application/json' });
        }
        if (type === 'csv') {
          const csvString = await jsonToCsvString(constructCsvObj(message));
          blob = new Blob([csvString], { type: 'text/csv' });
        }

        const a = document.createElement('a');
        a.download = `${fileName}.${type}`;
        a.href = window.URL.createObjectURL(blob);
        document.body.appendChild(a);
        a.click();
        a.remove();
        break;
      }
      case 'all_queries': {
        const raw = window.localStorage.getItem('query_history');
        const parsed = raw ? JSON.parse(raw) : {};
        const blob = new Blob([JSON.stringify({ bookmarked_queries: parsed }, null, 2)], {
          type: 'application/json',
        });
        // const blob = new Blob([JSON.stringify({ queryHistory }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.download = `${fileName}.${type}`;
        a.href = window.URL.createObjectURL(blob);
        document.body.appendChild(a);
        a.click();
        a.remove();
        break;
      }
      case 'query': {
        // Bookmark the query with the filename that's given.
        if (!(fileName in queryHistory)) {
          setQueryHistory((prev) => ({
            ...prev,
            [fileName]: {
              query_graph: message,
            },
          }));
        }
        break;
      }
      default: {
        handleClose();
      }
    }

    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="alert-dialog-title">
      <DialogTitle id="alert-dialog-title">Download Answer</DialogTitle>
      <DialogContent style={{ width: 600 }}>
        <TextField
          label={
            ['answer', 'all_queries'].includes(download_type) ? 'File name' : 'Query Graph Name'
          }
          fullWidth
          variant="outlined"
          style={{ marginBottom: '2rem' }}
          value={fileName}
          onChange={(e) => {
            setFileName(e.target.value);
          }}
        />

        {
          // Show the radio group only when the download type is answers.
          download_type === 'answer' && (
            <FormControl component="fieldset">
              <RadioGroup
                aria-label="gender"
                name="gender1"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                }}
              >
                <FormControlLabel value="json" control={<Radio />} label="JSON" />
                <FormControlLabel value="csv" control={<Radio />} label="CSV" />
              </RadioGroup>
            </FormControl>
          )
        }

        {type === 'csv' && (
          <DialogContentText style={{ fontSize: '1em' }}>
            The CSV download contains a smaller subset of the answer information. To analyze the
            complete properties of the answer graphs, consider using JSON.
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleClickDownload} color="primary" variant="contained">
          {['answer', 'all_queries'].includes(download_type) ? 'Download' : 'Bookmark'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
