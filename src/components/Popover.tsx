import React from 'react';
import { Paper, Popover as MuiPopover } from '@mui/material';
import { styled } from '@mui/material/styles';

const PopoverPaper = styled(Paper)(({ theme }) => ({
  filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.3))',

  position: 'relative',
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    bottom: '-15px',
    left: '0',
    right: '0',
    margin: '0 auto',
    clipPath: "path('M 0 0 L 20 0 L 10 15 Z')",
    width: '20px',
    height: '15px',
    backgroundColor: theme.palette.background.paper,
  },
}));

const PopoverPaperBelow = styled(PopoverPaper)(() => ({
  '&::before': {
    top: '-15px',
    bottom: 'unset',
    clipPath: "path('M 0 15 L 20 15 L 10 0 Z')",
  },
}));

interface PopoverProps {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  anchorPosition: { top: number; left: number };
  above?: boolean;
}

const Popover: React.FC<PopoverProps> = ({ children, open, onClose, anchorPosition, above }) => {
  let PositionedPaper = PopoverPaperBelow;
  if (above) PositionedPaper = PopoverPaper;

  let anchorOriginVertical: 'top' | 'bottom' | 'center' = 'bottom';
  if (above) anchorOriginVertical = 'top';

  let transformOriginVertical: 'top' | 'bottom' | 'center' = 'top';
  if (above) transformOriginVertical = 'bottom';

  let marginBlockStart = '28px';
  if (above) marginBlockStart = '-28px';

  return (
    <MuiPopover
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: anchorOriginVertical,
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: transformOriginVertical,
        horizontal: 'center',
      }}
      PaperProps={{
        style: {
          boxShadow: 'none',
          overflow: 'visible',
          marginBlockStart,
        },
      }}
    >
      <PositionedPaper>{children}</PositionedPaper>
    </MuiPopover>
  );
};

export default Popover;
