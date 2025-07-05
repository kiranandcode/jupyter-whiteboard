import { BaseBoxShapeUtil, type TLBaseShape, type RecordProps, T, HTMLContainer, type TLShapeId, type TLShape } from "tldraw";

import './CodeBlock.css';
import React from 'react';
import { useEditor } from 'tldraw';
import {Loading} from './Loading';
import { DescriptionView } from "./DescriptionView"; 
import { ControlPanel, type ViewState } from "./ControlPanel";
import { CodeView } from './CodeView';


type PythonCodeViewInlineProps = {
    shapeId: TLShapeId;
    id: string;
    width: number;
    height: number;
    code: string;
    description: string;
    output: string;
}

// Inline PythonCodeView component
const PythonCodeViewInline: React.FC<PythonCodeViewInlineProps> = ({ shapeId, id, width, height, code, description, output }) => {
  const editor = useEditor();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [invalidated, setInvalidated] = React.useState<boolean>(false);
  const [prevPrompt, setPrevPrompt] = React.useState<string>("");

  const blockRef = React.useRef<HTMLDivElement>(null);

  const [viewMode, _setViewMode] = React.useState<ViewState>("description");
  const setViewMode = (viewMode: ViewState) => {
      if(!code || code === "") { viewMode = "description"; }
      _setViewMode(viewMode);
  };

  const runCode = async (codeStr: String) => {
    setLoading(true);
    try {
      const response = await fetch('/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeStr, cellId: id })
      });
      const result = await response.json();
      if (response.ok) {
          editor.updateShape<CodeBlockShapeType>({ id: shapeId, type: 'python-codeblock-shape', props: { output: result.output } });
      } else {
          editor.updateShape<CodeBlockShapeType>({ id: shapeId, type: 'python-codeblock-shape', props: { output: result.error } });
      }
    } catch (error: any) {
        editor.updateShape<CodeBlockShapeType>({ id: shapeId, type: 'python-codeblock-shape', props: { output: "Error: " + error.message } });
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    setLoading(true);
    try {
      const response = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, cellId: id })
      });
      const result = await response.json();
      if (response.ok) {
          editor.updateShape({ id: shapeId, type: 'python-codeblock-shape', props: { code: result.code } });
          setInvalidated(false);
          setPrevPrompt(description);
          runCode(result.code);
      } else {
          setPrevPrompt(description);
          setInvalidated(false);
          editor.updateShape({ id: shapeId, type: 'python-codeblock-shape',  props: { output: result.error } });
      }
    } catch (error: any) {
      editor.updateShape({ id: shapeId, type: 'python-codeblock-shape', props: { output: "Error: " + error.message } });
    } finally {
      setLoading(false);
    }
  };

  const setDescription = (newDesc: string) => {
      editor.updateShape({ id: shapeId, type: 'python-codeblock-shape', props: { description: newDesc } });
      setInvalidated(newDesc != prevPrompt);
  };

  let body;
  if(loading) {
      body = <Loading/>;
  } else {
      body = (
      <div style={{ position: 'relative', flex: 1, height: '100%' }}>
        <ControlPanel invalidated={invalidated} code={code} viewMode={viewMode} setViewMode={setViewMode} generateCode={generateCode}/>

        {viewMode === "description" ? (
            <DescriptionView 
              description={description} 
              setDescription={setDescription} 
              output={output} 
            />
        ) : (
          <CodeView code={code} />
        )}
      </div>);
  }

  return (
    <div 
      ref={blockRef}
      style={{
        background: 'white',
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 0 8px rgba(0,0,0,0.3)',
        width: width,
        height: height,
        cursor: 'move',
        zIndex: 1000,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    > {body}
    </div>
  )
};
    
export type CodeBlockShapeType = TLBaseShape<'python-codeblock-shape', {
    id: string,
    code: string,
    description: string,
    output: string,
    w: number,
    h: number
}>;

export function isCodeBlock(shape: TLShape) : shape is CodeBlockShapeType {
    return shape.type === 'python-codeblock-shape';
}

export class CodeBlockShape extends BaseBoxShapeUtil<CodeBlockShapeType> {
    static override type = 'python-codeblock-shape' as const;
    static override props: RecordProps<CodeBlockShapeType> = {
        id: T.string,
        code: T.string,
        description: T.string,
        output: T.string,
        w: T.number,
        h: T.number,
    };

    getDefaultProps(): CodeBlockShapeType['props'] {
        return { id: "cell_" + Date.now(), code: "", description: "Print a hello world message!", output: "", w: 400, h: 230 };
    }

    component(block: CodeBlockShapeType) {
        return (
            <HTMLContainer style={{ pointerEvents: 'all', width: block.props.w, height: block.props.h }}>
                <PythonCodeViewInline
                    shapeId={block.id}
                    id={block.props.id} 
                    width={block.props.w}
                    height={block.props.h}
                    code={block.props.code}
                    description={block.props.description}
                    output={block.props.output}
                />
            </HTMLContainer>
        );
    }
    indicator(shape: CodeBlockShapeType) {
        return <rect width={shape.props.w} height={shape.props.h} />;
    }
}

