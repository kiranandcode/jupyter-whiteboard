import { StateNode } from "tldraw";
import type { CodeBlockShapeType } from "./CodeBlockShape";


export class CodeBlockTool extends StateNode {
    static override id = 'codeblock';
    static override initial = 'idle';

    override onEnter() {
        this.editor.setCursor({ type: 'cross' });
    }

    override onPointerDown() {
        const { currentPagePoint } = this.editor.inputs;
        this.editor.createShape<CodeBlockShapeType>({
            type: 'python-codeblock-shape',
            x: currentPagePoint.x,
            y: currentPagePoint.y,
            props: {
                code: "print(\"custom hello world!\")"
            }
        });
        this.editor.setCurrentTool('select');
    }
}
