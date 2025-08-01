import React, { useState, useEffect } from 'react';

import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import TablePagination from '@mui/material/TablePagination';

import API from '../../API';

import propertyFriendlyNames from './property-friendly-names.json';
import strings from '../../utils/strings';
import useBiolinkModel from '../../stores/useBiolinkModel';
import { useAlert } from '../../components/AlertProvider';
import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { conceptColorMap, undefinedColor } from '../../utils/colors';

interface ShowEdgesProps {
  node: any;
  nodeId: string;
  selectedPredicate: string;
  setPredicateSelection: React.Dispatch<React.SetStateAction<string>>;
  selectedCategory: string;
  setCategorySelection: React.Dispatch<React.SetStateAction<string>>;
  totalCount?: number;
  resetTotalCount?: () => void;
}

export default function ShowEdges({
  node,
  nodeId,
  selectedPredicate,
  setPredicateSelection,
  selectedCategory,
  setCategorySelection,
  totalCount = 0,
  resetTotalCount = () => {},
}: ShowEdgesProps) {
  const biolink = useBiolinkModel();
  const { displayAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [hasEdgesDataError, setHasEdgesDataError] = useState(false);

  const [pageSize, setPageSize] = useState(10);

  const [currentPageNumber, setCurrentPageNumber] = useState(0);

  const [edgeData, setEdgeData] = useState([]);

  // Load biolink on page load
  async function fetchBiolink() {
    const response = await API.biolink.getModelSpecification();
    if (response.status === 'error') {
      displayAlert(
        'error',
        'Failed to contact server to download biolink model. You will not be able to select general nodes or predicates. Please try again later.'
      );
      return;
    }
    biolink.setBiolinkModel(response);
  }

  async function fetchEdges() {
    const edgeResponse = await API.details.getNodeEdges(
      nodeId,
      pageSize,
      currentPageNumber,
      selectedPredicate,
      selectedCategory
    );

    if (edgeResponse.status === 'error') {
      setHasEdgesDataError(true);
      setEdgeData([]);
    } else {
      setHasEdgesDataError(false);
      setEdgeData(edgeResponse.edges);
    }
  }

  useEffect(() => {
    fetchBiolink();
    fetchEdges().finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchEdges();
  }, [currentPageNumber, pageSize, selectedPredicate, selectedCategory]);

  const goOnPrevPage = () => {
    if (currentPageNumber < 1) return;
    setCurrentPageNumber((prev) => prev - 1);
  };

  const goOnNextPage = () => {
    setCurrentPageNumber((prev) => prev + 1);
  };

  const ShowEdgeInfo = ({ edge }: { edge: any }) => {
    console.log('edge', edge);
    const isIncoming = edge.edge.direction === '<';
    const predicate =
      propertyFriendlyNames[edge.edge.predicate as keyof typeof propertyFriendlyNames] ??
      edge.edge.predicate;

    return (
      <TableRow>
        <TableCell>
          {isIncoming ? (
            <Link href={'./' + edge.adj_node.id} underline="hover">
              {edge.adj_node.name} ({edge.adj_node.id})
            </Link>
          ) : (
            node.name
          )}
        </TableCell>
        <TableCell>{strings.displayPredicate(predicate) || predicate}</TableCell>
        <TableCell>
          {isIncoming ? (
            node.name
          ) : (
            <Link href={'./' + edge.adj_node.id} underline="hover">
              {edge.adj_node.name} ({edge.adj_node.id})
            </Link>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return loading ? (
    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Loading edges...</Typography>
    </Box>
  ) : (
    <Box>
      {hasEdgesDataError ? (
        <Box>
          <Typography>An error occurred while getting the edges</Typography>
        </Box>
      ) : (
        <Box>
          <Box mb={1} display="flex" justifyContent="space-between" alignItems="center" mt={-6}>
            <Box display="flex" alignItems="center">
              <Typography component="span" sx={{ mr: 2 }}>
                Filters:&nbsp;
                {(selectedPredicate === 'all' || selectedPredicate === '') &&
                selectedCategory === '' ? (
                  <Chip
                    label="None"
                    size="small"
                    sx={{
                      backgroundColor: conceptColorMap['None'] || undefinedColor,
                    }}
                  />
                ) : (
                  <>
                    {selectedPredicate !== 'all' && selectedPredicate !== '' && (
                      <Chip
                        label={
                          <p>
                            <b>Predicate: </b>
                            {strings.displayPredicate(selectedPredicate)}
                          </p>
                        }
                        size="small"
                        sx={{
                          backgroundColor: conceptColorMap[selectedPredicate] || undefinedColor,
                        }}
                      />
                    )}
                    &nbsp;
                    {selectedCategory && (
                      <Chip
                        label={
                          <p>
                            <b>Category: </b>
                            {strings.displayCategory(selectedCategory)}
                          </p>
                        }
                        size="small"
                        sx={{
                          backgroundColor: conceptColorMap[selectedCategory] || undefinedColor,
                        }}
                      />
                    )}
                  </>
                )}
              </Typography>
            </Box>
            <Link
              onClick={() => {
                setPredicateSelection('all');
                setCategorySelection('');
                setCurrentPageNumber(0);
                resetTotalCount();
              }}
              sx={{ fontSize: 'small', cursor: 'pointer' }}
            >
              Clear Filters
            </Link>
          </Box>
          {edgeData.length === 0 ? (
            <Box sx={{ py: 2 }}>
              <Typography>No edges found for this node.</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: 'action.hover' }}>
                  <TableRow>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Subject
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Predicate
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Object
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {edgeData.map((edgeRow, index) => (
                    <ShowEdgeInfo key={index} edge={edgeRow} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <TablePagination
            component="div"
            count={totalCount}
            page={currentPageNumber}
            onPageChange={(_, newPage) => setCurrentPageNumber(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(event) => {
              setPageSize(parseInt(event.target.value, 10));
              setCurrentPageNumber(0);
            }}
          />
        </Box>
      )}
    </Box>
  );
}
