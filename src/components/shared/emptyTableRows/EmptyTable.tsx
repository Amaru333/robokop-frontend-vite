import React from 'react';
import { TableCell, TableRow } from '@mui/material';

import './emptyTable.css';

function makeEmptyArray(num: number) {
  const emptyArray = [];
  for (let i = 0; i < num; i += 1) {
    emptyArray.push('');
  }
  return emptyArray;
}

interface EmptyTableProps {
  numRows: number;
  numCells: number;
  text: string;
}

export default function EmptyTable({ numRows, numCells, text }: EmptyTableProps) {
  const emptyRows = makeEmptyArray(numRows);
  const emptyCells = makeEmptyArray(numCells);
  return (
    <>
      {emptyRows.map((row, i) => (
        <TableRow key={`empty-row-${i}`}>
          {emptyCells.map((cell, j) => (
            <TableCell key={`empty-cell-${j}`} className="emptyCell">
              {' '}
            </TableCell>
          ))}
        </TableRow>
      ))}
      <TableRow id="emptyTableRowsText">
        <TableCell>{text}</TableCell>
      </TableRow>
    </>
  );
}
