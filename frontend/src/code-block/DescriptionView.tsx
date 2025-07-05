import React from 'react';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import {OutputView} from './OutputView';

export const DescriptionView: React.FC<{ description: string, setDescription: (desc: string) => void, output: string }> = ({ description, setDescription, output }) => (
  <div className="description-view">
    <LexicalComposer
      initialConfig={{
        namespace: 'PythonDescriptionEditor',
        theme: {},
        onError: (error: any) => console.error(error),
          editorState: () => {
              const root = $getRoot();
              if(root.getFirstChild() === null) {
                  const paragraph = $createParagraphNode();
                  paragraph.append($createTextNode(description));
                  root.append(paragraph);
              }
          },
      }}
    >
    <div style={{position: 'relative', paddingRight: '100px'}}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            aria-placeholder="Enter some description..."
            placeholder={<div aria-hidden={true} className="prompt-editor-prompt">Provide a prompt for this block...</div>}
            className="prompt-editor-box"
            onPointerDown={(e) => e.stopPropagation()}
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
                </div>        
      <OnChangePlugin onChange={(editorState) => {
        editorState.read(() => {
          const newText = $getRoot().getTextContent();
          setDescription(newText);
        });
      }} />

    </LexicalComposer>
    <OutputView output={output} />
  </div>
);
