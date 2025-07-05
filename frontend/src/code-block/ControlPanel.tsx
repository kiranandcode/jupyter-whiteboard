import React from 'react';

export type ViewState = "description" | "code";

const ViewModeButton: React.FC<{
  viewMode: ViewState,
  setViewMode: (mode: ViewState) => void,
}> = ({ viewMode, setViewMode }) => {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => {
        if (viewMode === "description") {
          setViewMode("code");
        } else {
          setViewMode("description");
        }
      }}
      style={{
        height: '30px',
        marginRight: '5px',
        borderRadius: '4px',
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        pointerEvents: 'all',
      }}>{viewMode === "description" ? 'Code' : 'Description' }</button>
  );
};

const GenerateCodeButton: React.FC<{
  generateCode: (_: void) => void,
}> = ({ generateCode }) => {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => {
          generateCode()
      }}
      style={{
        width: '30px',
        height: '30px',
        borderRadius: '4px',
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        pointerEvents: 'all',
      }}>▶</button>
  );
};

export const ControlPanel : React.FC<{
    invalidated: boolean,
    code: string,
    viewMode: ViewState,
    setViewMode: (_: ViewState) => void,
    generateCode: (_: void) => void
}> = ({invalidated, code, viewMode, setViewMode, generateCode}) => {
    return (<div className="control-panel">
          {code !== "" &&
           (<ViewModeButton
                 viewMode={viewMode} 
                 setViewMode={setViewMode} />)}
          {(invalidated || code === "") && (viewMode === 'description') && (<GenerateCodeButton generateCode={generateCode}/>)}
             </div>);
}

