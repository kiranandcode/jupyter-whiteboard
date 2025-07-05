import { Tldraw, type TLUiOverrides, useTools, DefaultToolbar, TldrawUiMenuItem, useIsToolSelected, type TLComponents, getArrowBindings, type TLArrowShape, Editor } from "tldraw"
import { CodeBlockShape, isCodeBlock, type CodeBlockShapeType } from "./code-block/CodeBlockShape";

import { CodeBlockTool } from "./code-block/CodeBlockTool";
import 'tldraw/tldraw.css'

const uiOverrides: TLUiOverrides = {
    tools(editor, tools) {
        let codeblock = {
            id: 'codeblock',
            icon: 'tool-note',
            label: 'Code Block',
            kbd: 'a',
            onSelect: () => {
                editor.setCurrentTool('codeblock')
            }
        };

        return {
            select: tools.select,
            codeblock: codeblock,
            arrow: tools.arrow
        }
    }
}

function CustomToolbar() {
    const tools = useTools();

    return (
        <DefaultToolbar>
            <TldrawUiMenuItem {...tools['select']} isSelected={useIsToolSelected(tools['select'])}/>
            <TldrawUiMenuItem {...tools['codeblock']} isSelected={useIsToolSelected(tools['codeblock'])}/>
            <TldrawUiMenuItem {...tools['arrow']} isSelected={useIsToolSelected(tools['arrow'])}/>
        </DefaultToolbar>
    );
}

const customComponents: TLComponents = {
    Toolbar: CustomToolbar,
    ActionsMenu: null,
    Dialogs: null,
    HelperButtons: null,
    MenuPanel: null,
    Minimap: null,
    NavigationPanel: null,
    StylePanel: null,
    TopPanel: null,
    QuickActions: null
}



const customTools = [CodeBlockTool];
const customShapeUtils  = [CodeBlockShape];

function retrieveArrowBinding(editor: Editor, arrow: TLArrowShape) : {start: string | null, end: string | null} {
    let arrowBinding = getArrowBindings(editor, arrow);
    let start = arrowBinding.start && editor.getShape(arrowBinding.start.toId);
    let end = arrowBinding.end && editor.getShape(arrowBinding.end.toId);
    // console.log('retrieve arrow binding: ', arrowBinding, 'start: ', start, 'end: ', end)
    let startId = start && isCodeBlock(start) && start.props.id || null;
    let endId = end && isCodeBlock(end) && end.props.id || null;
    return {start: startId, end: endId};
}

async function notifyArrow(operation: "create" | "update" | "delete", shapeId: string, startId: string | null, endId: string | null) {
    fetch('/api/arrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: operation,
            id: shapeId,
            start: startId,
            end: endId
        })
    });
}

function App() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
          <Tldraw
             overrides={uiOverrides}
             tools={customTools}
             components={customComponents}
             shapeUtils={customShapeUtils as any}
             onMount={(editor) => {
                 const arrowMapping = new Map<string, {start: string | null, end: string | null}>();

                 editor.sideEffects.registerAfterCreateHandler('shape', (shape, _source) => {
                     if(shape.type === 'arrow') {
                         let arrow = shape as TLArrowShape;
                         let info = retrieveArrowBinding(editor, arrow);
                         arrowMapping.set(arrow.id, info);
                         notifyArrow('create', arrow.id, info.start, info.end);
                     }
                 });

                 editor.sideEffects.registerAfterChangeHandler('binding', (binding, _source) => {
                     let arrow = editor.getShape<TLArrowShape>(binding.fromId);
                     if(arrow) {
                         let info = retrieveArrowBinding(editor, arrow);
                         let oldInfo = arrowMapping.get(arrow.id);
                         if(oldInfo !== info) {
                             arrowMapping.set(arrow.id, info);
                             notifyArrow('update', arrow.id, info.start, info.end);
                         }
                     }
                 });

                 editor.sideEffects.registerAfterDeleteHandler('binding', (binding, _source) => {
                     let arrow = editor.getShape<TLArrowShape>(binding.fromId);
                     if(arrow) {
                         let info = retrieveArrowBinding(editor, arrow);
                         let oldInfo = arrowMapping.get(arrow.id);
                         if(oldInfo !== info) {
                             arrowMapping.set(arrow.id, info);
                             notifyArrow('update', arrow.id, info.start, info.end);
                         }
                     }
                 });


                 editor.sideEffects.registerAfterDeleteHandler('shape', (shape, _source) => {
                     if (shape.type === 'arrow') {
                         let arrow = shape as TLArrowShape;
                         arrowMapping.delete(arrow.id);
                         notifyArrow('delete', arrow.id, null, null)
                     }
                 });
                 editor.createShape<CodeBlockShapeType>({type: 'python-codeblock-shape'})
       }}
          />
    </div>
  )
}

export default App
