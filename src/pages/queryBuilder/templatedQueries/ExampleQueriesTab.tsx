import React from 'react';
import examples from './templates.json';
import ExampleQueryView from './ExampleQueryView';
import { TemplatesArray } from './types';

interface ExampleQueriesTabProps {
  onTemplateCompletionChange?: (isComplete: boolean) => void;
}

function ExampleQueriesTab({ onTemplateCompletionChange }: ExampleQueriesTabProps) {
  const templateQueries = (examples as unknown as TemplatesArray).filter(
    (example) => example.type === 'template'
  );
  return (
    <ExampleQueryView
      examples={templateQueries}
      onTemplateCompletionChange={onTemplateCompletionChange}
    />
  );
}

export default ExampleQueriesTab;
