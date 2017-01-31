import React from 'react';
import { connect } from 'react-redux';

import {
convertFromRaw,
convertToRaw,
CompositeDecorator,
ContentState,
Editor,
EditorState,
} from 'draft-js';

import './trint-css.css';
import trumpSpeech from './trumpSpeech';

const flatten = list => list.reduce(
(a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [],
);

class EntityEditorExample extends React.Component {
  constructor(props) {
    super(props);
    const decorator = new CompositeDecorator([
      {
        strategy: getEntityStrategy('IMMUTABLE'),
        component: TokenSpan,
      },
      {
        strategy: getEntityStrategy('MUTABLE'),
        component: TokenSpan,
      },
      {
        strategy: getEntityStrategy('SEGMENTED'),
        component: TokenSpan,
      },
    ]);
    const { words } = trumpSpeech.transcript;
    const wordsInParas = words.reduce((prev, next) => ({
      ...prev,
      [next.para]: prev[next.para] ?
      [...prev[next.para], next] :
      [next],
    }), {});
    const blocks = Object.keys(wordsInParas)
      .map(para => ({
        text: wordsInParas[para].map(word => word.name).join(' '),
        type: 'unstyled',
        entityRanges: wordsInParas[para].reduce((acc, word) => {
          return {
            position: acc.position + word.name.length + 1,
            entityRanges: [
              ...acc.entityRanges,
              {
                ...word,
                offset: acc.position,
                length: word.name.length,
                key: Math.random().toString(36).substring(21),
              },
            ],
          };
        }, { position: 0, entityRanges: [] }).entityRanges,
      }));
    const entityMap = flatten(
      blocks.map(p => p.entityRanges),
    ).reduce((acc, e) => ({
      ...acc,
      [e.key]: {
        type: 'TOKEN',
        mutability: 'MUTABLE',
        data: e,
      },
    }), {});

    this.state = {
      editorState: EditorState.createWithContent(
        convertFromRaw({
          blocks,
          entityMap,
        }),
        decorator,
      ),
      inputValue: '',
    };

    this.focus = () => this.refs.editor.focus();
    this.onChange = (editorState) => this.setState({editorState});
    this.logState = () => {
      const content = this.state.editorState.getCurrentContent();
      console.log(convertToRaw(content));
    };
  }

  render() {
    // console.log(convertToRaw(this.state.editorState.getCurrentContent()));
    return (
      <div style={styles.root}>
        <input
          type="text"
          value={this.state.inputState}
          onChange={e => this.setState({ inputValue: e.target.value })}
          onBlur={e => this.props.dispatch({
            type: 'INPUT_UPDATED',
            inputValue: e.target.value,
          })}
        />
        <div style={styles.editor} onClick={this.focus}>
          <Editor
            editorState={this.state.editorState}
            onChange={this.onChange}
            placeholder="Enter some text..."
            ref="editor"
          />
        </div>
        <input
          onClick={this.logState}
          style={styles.button}
          type="button"
          value="Log State"
        />
      </div>
    );
  }
}

function getEntityStrategy(mutability) {
  return function (contentBlock, callback, contentState) {
    contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();
      if (entityKey === null) {
        return false;
      }
      return contentState.getEntity(entityKey).getMutability() === mutability;
    },
    callback
    );
  };
}

function getDecoratedStyle(mutability) {
  switch (mutability) {
    case 'IMMUTABLE': return styles.immutable;
    case 'MUTABLE': return styles.mutable;
    case 'SEGMENTED': return styles.segmented;
    default: return null;
  }
}

const TokenSpan = connect(
  state => ({ inputState: state.inputState }),
)((props) => {
  const style = getDecoratedStyle(
    props.contentState.getEntity(props.entityKey).getMutability(),
  );
  const data = props.contentState.getEntity(props.entityKey).getData();
  return (
    <span
      data-offset-key={props.offsetkey}
      data-time={data.time}
      style={{
        ...style,
        color: Number(props.inputState) === data.time ? 'red' : '',
      }}
      onClick={() => console.log(data.time)}
    >
      {props.children}
    </span>
  );
});

TokenSpan.propTypes = {
  entityKey: React.PropTypes.string,
  children: React.PropTypes.array,
  contentState: React.PropTypes.object,
};

const styles = {
  root: {
    fontFamily: '\'Helvetica\', sans-serif',
    padding: 20,
    width: 600,
  },
  editor: {
    border: '1px solid #ccc',
    cursor: 'text',
    minHeight: 80,
    padding: 10,
  },
  button: {
    marginTop: 10,
    textAlign: 'center',
  },
  immutable: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '2px 0',
  },
  mutable: {
    backgroundColor: 'rgba(204, 204, 255, 1.0)',
    padding: '2px 0',
  },
  segmented: {
    backgroundColor: 'rgba(248, 222, 126, 1.0)',
    padding: '2px 0',
  },
};

export default connect(state => ({
  inputState: state.inputState,
}))(EntityEditorExample);
