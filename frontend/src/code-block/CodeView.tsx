import React from 'react';
import Editor from '@monaco-editor/react';


export const CodeView: React.FC<{ code: string }> = ({ code }) => (
    <div style={{height: "100%", display: 'flex', flexDirection: 'column'}} onPointerDown={(e) => e.stopPropagation()}>
    <Editor
      options={{ automaticLayout: true, minimap: { enabled: false }, readOnly: true }}
      defaultLanguage="python"
      value={code}
      theme="vs-light"
      height="100%"
    />
  </div>
);
