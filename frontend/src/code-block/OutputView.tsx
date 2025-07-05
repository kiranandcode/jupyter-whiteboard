import React from 'react';

export interface OutputViewProps {
  output: string;
}

 // Inline PythonCodeView component
export const OutputView: React.FC<OutputViewProps> = ({ output }) => {
  if (!output) return null;
  return (
      <div className="output-view" onPointerDown={(e) => e.stopPropagation()} onScroll={(e) => e.stopPropagation()}>
          <div className='jupyter-display'>
          <div dangerouslySetInnerHTML={{ __html: output }} />
          </div>
    </div>
  );
};
