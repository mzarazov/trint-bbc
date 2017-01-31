import React from 'react';
import Editor from 'draft-js-plugins-editor';
import createHashtagPlugin from 'draft-js-hashtag-plugin';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import { EditorState, ContentState, convertToRaw  } from 'draft-js';

import trumpSpeech from './trumpSpeech';

const hashtagPlugin = createHashtagPlugin();
const linkifyPlugin = createLinkifyPlugin();

const plugins = [
  hashtagPlugin,
  linkifyPlugin,
];

class MyEditor extends React.Component {
  state = {};
  async componentWillMount() {
    const { words } = trumpSpeech.transcript;
    const wordsInParas = words.reduce((prev, next) => ({
      ...prev,
      [next.para]: prev[next.para] ?
      [...prev[next.para], next] :
      [next],
    }), {});
    const rawTranscript = Object.keys(wordsInParas)
      .map(para => wordsInParas[para].map(word => word.name).join(' '))
      .join('\n');
    this.setState({
      editorState: EditorState.createWithContent(ContentState.createFromText(rawTranscript)),
    });
  }
  render() {
    if (!this.state.editorState) return null;
    console.log(convertToRaw(this.state.editorState.getCurrentContent()));
    return (
      <div className="Transcript">
        <h1>TRINT-BBC</h1>
        <Editor
          editorState={this.state.editorState}
          onChange={editorState => this.setState({ editorState })}
          plugins={plugins}
        />
      </div>
    );
  }
}

export default MyEditor;

