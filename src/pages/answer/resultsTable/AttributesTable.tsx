import React from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { styled } from '@mui/material/styles';

interface Attribute {
  attribute_type_id: string;
  value: string | string[];
}

interface Source {
  resource_id: string;
  resource_role: string;
  upstream_resource_ids?: string[];
}

interface AttributesTableProps {
  attributes: Attribute[];
  sources: Source[];
}

const headerStyles = { fontWeight: 'bold', backgroundColor: '#eee' };

const StyledTableBody = styled(TableBody)(() => ({
  '& .MuiTableRow-root:last-of-type .MuiTableCell-root': {
    borderBottom: 'none',
  },
}));

const ValueCell: React.FC<{ value: string | string[] }> = ({ value }) => (
  <TableCell>
    <ul style={{ padding: 0, margin: 0, listStyleType: 'none' }}>
      {Array.isArray(value) ? (
        value.map((valueItem, valueItemIndex) => <li key={valueItemIndex}>{valueItem}</li>)
      ) : (
        <li>{value}</li>
      )}
    </ul>
  </TableCell>
);

const PublicationLinkCell: React.FC<{ value: string | string[] }> = ({ value }) => {
  const getLinkFromValue = (pmidValue: string): string | null => {
    const pmid = pmidValue.split(':');
    if (pmid.length !== 2) return null;
    return pmid[0] === 'PMC'
      ? `https://pmc.ncbi.nlm.nih.gov/articles/${pmid[0]}${pmid[1]}/`
      : pmid[0] === 'PMID'
        ? `https://pubmed.ncbi.nlm.nih.gov/${pmid[1]}/`
        : null;
  };

  return (
    <TableCell>
      <ul style={{ padding: 0, margin: 0, listStyleType: 'none' }}>
        {Array.isArray(value) ? (
          value.map((valueItem, valueItemIndex) => {
            const link = getLinkFromValue(valueItem);
            return (
              <li key={valueItemIndex}>
                {link === null ? (
                  valueItem
                ) : (
                  <a href={link} target="_blank" rel="noreferrer">
                    {valueItem}
                  </a>
                )}
              </li>
            );
          })
        ) : (
          <li>
            {getLinkFromValue(value) === null ? (
              value
            ) : (
              <a href={getLinkFromValue(value) || '#'} target="_blank" rel="noreferrer">
                {value}
              </a>
            )}
          </li>
        )}
      </ul>
    </TableCell>
  );
};

const AttributesTable: React.FC<AttributesTableProps> = ({ attributes, sources }) => (
  <Box style={{ maxHeight: 500, overflow: 'auto' }}>
    <Table size="small" aria-label="edge attributes table">
      <TableHead style={{ position: 'sticky', top: 0 }}>
        <TableRow>
          <TableCell style={headerStyles}>attribute_type_id</TableCell>
          <TableCell style={headerStyles}>value</TableCell>
        </TableRow>
      </TableHead>
      <StyledTableBody>
        {attributes.map((attribute, index) => (
          <TableRow key={index}>
            <TableCell style={{ verticalAlign: 'top' }}>{attribute.attribute_type_id}</TableCell>
            {attribute.attribute_type_id === 'biolink:publications' ? (
              <PublicationLinkCell value={attribute.value} />
            ) : (
              <ValueCell value={attribute.value} />
            )}
          </TableRow>
        ))}
        <TableRow>
          <TableCell>Sources</TableCell>
          <TableCell>
            {Array.isArray(sources) &&
              sources.map((source, i) => (
                <section key={i}>
                  <p style={{ marginBottom: '0px', fontStyle: 'italic' }}>{source.resource_id}</p>
                  <p style={{ filter: 'opacity(0.75)', fontSize: '0.8em' }}>
                    {source.resource_role}
                  </p>
                  {Boolean(source.upstream_resource_ids) &&
                    Array.isArray(source.upstream_resource_ids) && (
                      <>
                        <p style={{ marginBottom: '0px' }}>Upstream resource ids:</p>
                        <ul>
                          {source.upstream_resource_ids.map((urid, j) => (
                            <li key={j}>{urid}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  {i === sources.length - 1 ? null : <hr />}
                </section>
              ))}
          </TableCell>
        </TableRow>
      </StyledTableBody>
    </Table>
  </Box>
);

export default AttributesTable;
