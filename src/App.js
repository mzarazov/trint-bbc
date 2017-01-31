import React from 'react';
import Editor from 'draft-js-plugins-editor';
import createHashtagPlugin from 'draft-js-hashtag-plugin';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import { EditorState, ContentState, convertToRaw, CompositeDecorator, convertFromRaw } from 'draft-js';
import './trint-css.css';
import trumpSpeech from './trumpSpeech';

const hashtagPlugin = createHashtagPlugin();
const linkifyPlugin = createLinkifyPlugin();

const plugins = [
  hashtagPlugin,
  linkifyPlugin,
];

const rawContent = {
  blocks: [
    {
      text: (
      'This is an "immutable" entity: Superman. Deleting any ' +
      'characters will delete the entire entity. Adding characters ' +
      'will remove the entity from the range.'
      ),
      type: 'unstyled',
      entityRanges: [{offset: 31, length: 8, key: 'first'}],
    },
    {
      text: '',
      type: 'unstyled',
    },
    {
      text: (
      'This is a "mutable" entity: Batman. Characters may be added ' +
      'and removed.'
      ),
      type: 'unstyled',
      entityRanges: [{offset: 28, length: 6, key: 'second'}],
    },
    {
      text: '',
      type: 'unstyled',
    },
    {
      text: (
      'This is a "segmented" entity: Green Lantern. Deleting any ' +
      'characters will delete the current "segment" from the range. ' +
      'Adding characters will remove the entire entity from the range.'
      ),
      type: 'unstyled',
      entityRanges: [{offset: 30, length: 13, key: 'third'}],
    },
  ],

  entityMap: {
    first: {
      type: 'TOKEN',
      mutability: 'IMMUTABLE',
    },
    second: {
      type: 'TOKEN',
      mutability: 'MUTABLE',
    },
    third: {
      type: 'TOKEN',
      mutability: 'SEGMENTED',
    },
  },
};

function getEntityStrategy(mutability) {
  return (contentBlock, callback, contentState) => {
    contentBlock.findEntityRanges((character) => {
      const entityKey = character.getEntity();
      if (entityKey === null) {
        return false;
      }
      return contentState.getEntity(entityKey).getMutability() === mutability;
    },
    callback,
    );
  };
}

const TokenSpan = (props) => {
  return (
    <span data-offset-key={props.offsetkey} style={{ color: 'red' }}>
      {props.children}
    </span>
  );
};

const flatten = list => list.reduce(
  (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [],
);

const decorator = new CompositeDecorator([
  {
    strategy: getEntityStrategy('IMMUTABLE'),
    component: TokenSpan,
  },
]);

class MyEditor extends React.Component {
  constructor(props) {
    super(props);
    const { words } = trumpSpeech.transcript;
    const wordsInParas = words.reduce((prev, next) => ({
      ...prev,
      [next.para]: prev[next.para] ?
      [...prev[next.para], next] :
      [next],
    }), {});
    console.log('wordsInParas', wordsInParas);
    const blocks = Object.keys(wordsInParas)
      .map(para => ({
        text: wordsInParas[para].map(word => word.name).join(' '),
        type: 'unstyled',
        entityRanges: wordsInParas[para].reduce((acc, word) => {
          return {
            position: acc.position + word.name.length,
            entityRanges: [
              ...acc.entityRanges,
              {
                offset: acc.position,
                length: word.name.length,
                key: Math.random().toString(36).substring(21),
              },
            ],
          };
        }, { position: 0, entityRanges: [] }).entityRanges,
      }));
    console.log(blocks);

    const entityMap = flatten(
      blocks.map(p => p.entityRanges.map(e => e.key)),
    ).reduce((acc, key) => ({
      ...acc,
      [key]: {
        type: 'TOKEN',
        mutability: 'IMMUTABLE',
      },
    }), {});

    // const rawContent = {
    //   blocks,
    //   entityMap,
    // };
    console.log('rawContent', rawContent)
    console.log(entityMap);
    const rawTranscript = Object.keys(wordsInParas)
      .map(para => wordsInParas[para].map(word => word.name).join(' '))
      .join('\n');
    this.state = {
      // editorState: EditorState.createWithContent(ContentState.createFromText(rawTranscript)),
      editorState: EditorState.createWithContent(convertFromRaw(rawContent), decorator),
    };
  }
  render() {
    if (!this.state.editorState) return null;
    console.log(convertToRaw(this.state.editorState.getCurrentContent()));
    return (
      <div className="EditorPage">
        <div className="Transcript">
          <Editor
            editorState={this.state.editorState}
            onChange={editorState => this.setState({ editorState })}
            plugins={plugins}
          />
        </div>
      </div>
    );
  }
}

// const rawContent = {
//   blocks: [
//     {
//       text: (
//       'This is an "immutable" entity: Superman. Deleting any ' +
//       'characters will delete the entire entity. Adding characters ' +
//       'will remove the entity from the range.'
//       ),
//       type: 'unstyled',
//       entityRanges: [{offset: 31, length: 8, key: 'first'}],
//     },
//     {
//       text: '',
//       type: 'unstyled',
//     },
//     {
//       text: (
//       'This is a "mutable" entity: Batman. Characters may be added ' +
//       'and removed.'
//       ),
//       type: 'unstyled',
//       entityRanges: [{offset: 28, length: 6, key: 'second'}],
//     },
//     {
//       text: '',
//       type: 'unstyled',
//     },
//     {
//       text: (
//       'This is a "segmented" entity: Green Lantern. Deleting any ' +
//       'characters will delete the current "segment" from the range. ' +
//       'Adding characters will remove the entire entity from the range.'
//       ),
//       type: 'unstyled',
//       entityRanges: [{offset: 30, length: 13, key: 'third'}],
//     },
//   ],
//
//   entityMap: {
//     first: {
//       type: 'TOKEN',
//       mutability: 'IMMUTABLE',
//     },
//     second: {
//       type: 'TOKEN',
//       mutability: 'MUTABLE',
//     },
//     third: {
//       type: 'TOKEN',
//       mutability: 'SEGMENTED',
//     },
//   },
// };

export default MyEditor;

