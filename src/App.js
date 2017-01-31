import React from 'react';
import Editor from 'draft-js-plugins-editor';
import createHashtagPlugin from 'draft-js-hashtag-plugin';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import { EditorState, ContentState, convertToRaw  } from 'draft-js';
// import RadarChart from 'radar-chart-d3';

import './trint-css.css';
import trumpSpeech from './trumpSpeech';
import sentiment from './sentiment';

const hashtagPlugin = createHashtagPlugin();
const linkifyPlugin = createLinkifyPlugin();

const plugins = [
  hashtagPlugin,
  linkifyPlugin,
];

console.log(window.RadarChart);

// window.RadarChart.defaultConfig.color = function() {};
// window.RadarChart.defaultConfig.radius = 3;
// window.RadarChart.defaultConfig.w = 400;
// window.RadarChart.defaultConfig.h = 400;

// compute time in ms
for (let i = 0; i < sentiment.length; i++) {
  const [hh, mm, ss] = sentiment[i].start.split(':');
  sentiment[i].time = ss * 1e3 + mm * 6e4 + hh * 36e5;
}

// add end times
for (let i = 0; i < sentiment.length - 1; i++) {
  sentiment[i].end = sentiment[i + 1].time;
}
sentiment[sentiment.length - 1].end = sentiment[sentiment.length - 1].time + 6e4;

class MyEditor extends React.Component {
  state = {
    sentiment: {
      anger: '0',
      disgust: '0',
      fear: '0',
      joy: '0',
      sadness: '0',
    },
  };

  async componentWillMount() {
    const { words } = trumpSpeech.transcript;
    const wordsInParas = words.reduce((prev, next) => ({
      ...prev,
      [next.para]: prev[next.para] ?
      [...prev[next.para], next] :
      [next],
    }), {});
    console.log('wordsInParas', wordsInParas);
    const rawTranscript = Object.keys(wordsInParas)
      .map(para => wordsInParas[para].map(word => word.name).join(' '))
      .join('\n');
    this.setState({
      editorState: EditorState.createWithContent(ContentState.createFromText(rawTranscript)),
    });
  }

  componentDidMount() {
    // const data = [
    //   {
    //     className: 'default',
    //     axes: [
    //       {axis: "anger", value: 1, yOffset: 10},
    //       {axis: "disgust", value: 1},
    //       {axis: "fear", value: 1},
    //       {axis: "joy", value: 1},
    //       {axis: "sadness", value: 1, xOffset: -20}
    //     ]
    //   }
    // ];
    // window.RadarChart.draw('.chart-container', data);
  }

  handleTimeupdate(e) {
    for (let i = 0;  i < sentiment.length ; i++) {
      if (e.nativeEvent.srcElement.currentTime * 1e3 > sentiment[i].time && e.nativeEvent.srcElement.currentTime * 1e3 <= sentiment[i].end) {
        this.setState({
          sentiment: sentiment[i]
        });
        break;
      };
    }

    // TODO move this to render
    // const data = [
    //   {
    //     className: 'default',
    //     axes: [
    //       {axis: "anger", value: parseFloat(this.state.sentiment.anger), yOffset: 10},
    //       {axis: "disgust", value: parseFloat(this.state.sentiment.disgust)},
    //       {axis: "fear", value: parseFloat(this.state.sentiment.fear)},
    //       {axis: "joy", value: parseFloat(this.state.sentiment.joy)},
    //       {axis: "sadness", value: parseFloat(this.state.sentiment.sadness), xOffset: -20}
    //     ]
    //   }
    // ];
    // window.RadarChart.draw('.chart-container', data);
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
        <hr />
        <video
          src="https://メディア.trint.com/577a8971869d2f7f177c38c1/1322747868741/54530a42-c220-4184-8501-bf81d5386e3f/T0y6tsA4TJq3X39Sr3mMGQ.mp4?Expires=1489007663&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly94bi0tY2NrYjFpOGQudHJpbnQuY29tLzU3N2E4OTcxODY5ZDJmN2YxNzdjMzhjMS8xMzIyNzQ3ODY4NzQxLzU0NTMwYTQyLWMyMjAtNDE4NC04NTAxLWJmODFkNTM4NmUzZi9UMHk2dHNBNFRKcTNYMzlTcjNtTUdRLm1wNCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTQ4OTAwNzY2M319fV19&Signature=MVuL2xCpwgoXkyk35dFRZilXGmDIDUGSxQ0UvtB7AKKO-NqmNKQ7DwxH8VCegdvPlC2vc8yqdHioXIOixmURvJoMssG9zQpoz2DR5aNaVoLn15s-Yyay-iFwKSr~GEA0mVvWd5g~EUN2hvUIR5hztglT18K3~lNZrjtUq7McEePsDrvY3WQCDyR7uWG5PbYY4X6L6kAEnbg1gTPyte3Wev6ZVi3WCeJH~UPvkXcaHxa42Jtdwkd3IrQRduAiIsBeHbjdidyILhmqMDUgPOnZzA2SgZ4O2W12NEfXrVtX0Hiuo6ZbttsKdDHn6LgjO0WNriV2qxVJPTFzD9VQO5rPuw__&Key-Pair-Id=APKAJ7JCI2AT2YPOWIAA"
          controls="controls"
          onTimeUpdate={this.handleTimeupdate.bind(this)}
        >…</video>
        <div className="chart-container"></div>
      </div>
    );
  }
}

export default MyEditor;
