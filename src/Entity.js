import React from 'react';
import { connect } from 'react-redux';

import Draft, {
  convertFromRaw,
  convertToRaw,
  CompositeDecorator,
  ContentState,
  Editor,
  EditorState,
} from 'draft-js';

import Immutable from 'immutable';

import './trint-css.css';
import './proto/css/trint-player.css';
import './flexbox.css';
import trumpSpeech from './trumpSpeech';
import sentiment from './sentiment';

const flatten = list => list.reduce(
  (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [],
);

window.RadarChart.defaultConfig.radius = 2;
window.RadarChart.defaultConfig.w = 200;
window.RadarChart.defaultConfig.h = 200;
const chart = window.RadarChart.chart();

// compute time in ms
for (let i = 0; i < sentiment.length; i++) {
  const [hh, mm, ss] = sentiment[i].start.split(':');
  sentiment[i].time = (ss * 1e3) + (mm * 6e4) + (hh * 36e5);
}

// add end times
for (let i = 0; i < sentiment.length - 1; i++) {
  sentiment[i].end = sentiment[i + 1].time;
}
sentiment[sentiment.length - 1].end = sentiment[sentiment.length - 1].time + 6e4;

const getEntityStrategy = mutability => (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();
      if (entityKey === null) {
        return false;
      }
      return contentState.getEntity(entityKey).getMutability() === mutability;
    },
    callback,
  );
};

const getDecoratedStyle = (mutability) => {
  switch (mutability) {
    case 'MUTABLE': return styles.mutable;
    default: return null;
  }
};

const isActiveWord = (inputState, data) => {
  if (!inputState || !data.previousTime) return false;
  return (inputState - data.previousTime) > 0 && (inputState - data.time) <= 0;
};

const isPastTime = (inputState, data) => {
  if (!inputState) return true;
  return (inputState - data.time) < 0;
};

const TokenSpan = connect(
  state => ({ inputState: state.inputState }),
)((props) => {
  const style = getDecoratedStyle(
    props.contentState.getEntity(props.entityKey).getMutability(),
  );
  const data = props.contentState.getEntity(props.entityKey).getData();
  const activeWord = isPastTime(Number(props.inputState), data);
  return (
    <span
      data-time={data.time}
      className={activeWord ? 'active' : ''}
      style={{
        ...style,
        fontWeight: !activeWord ? 600 : 300,
        color: !activeWord ? '#333333' : '',
      }}
      onClick={() => { document.getElementById('video').currentTime = data.time / 1000; }}
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

const CustomParagraph = (props) => (
  <div className={props.mood}>
    {props.children}
  </div>
);

CustomParagraph.propTypes = {
  children: React.PropTypes.array,
  mood: React.PropTypes.string,
};


const blockRenderMap = props => Immutable.Map({
  anger: {
    element: 'div',
    wrapper: <CustomParagraph {...props} mood="anger" />,
  },
  disgust: {
    element: 'div',
    wrapper: <CustomParagraph {...props} mood="disgust" />,
  },
  fear: {
    element: 'div',
    wrapper: <CustomParagraph {...props} mood="fear" />,
  },
  joy: {
    element: 'div',
    wrapper: <CustomParagraph {...props} mood="joy" />,
  },
  sadness: {
    element: 'div',
    wrapper: <CustomParagraph {...props} mood="sadness" />,
  },
});

const getMood = (index) => {
  if (!sentiment[index]) return 'joy';
  const { start, end, time, ...rest } = sentiment[index] || {};
  return Object.keys(rest).reduce((winner, next) => {
    if (Number(rest[winner]) > Number(rest[next])) return winner;
    return next;
  }, 0);
};

class EntityEditorExample extends React.Component {
  constructor(props) {
    super(props);

    const decorator = new CompositeDecorator([
      {
        strategy: getEntityStrategy('MUTABLE'),
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
    .map((para, i) => ({
      text: wordsInParas[para].map(word => word.name).join(' '),
      // type: 'unstyled',
      type: getMood(i),
      entityRanges: wordsInParas[para].reduce((acc, word, id) => {
        return {
          position: acc.position + word.name.length + 1,
          entityRanges: [
            ...acc.entityRanges,
            {
              ...word,
              previousTime: id > 0 ? acc.entityRanges[id - 1].time : 0,
              offset: acc.position,
              length: word.name.length,
              key: Math.random().toString(36).substring(6),
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
      sentiment: {
        anger: '1',
        disgust: '1',
        fear: '1',
        joy: '1',
        sadness: '1',
      },
    };

    this.focus = () => this.refs.editor.focus();
    this.onChange = editorState => this.setState({ editorState });
  }

  handleTimeupdate = (e) => {
    const time = e.nativeEvent.srcElement.currentTime * 1e3;

    this.props.dispatch({
      type: 'INPUT_UPDATED',
      inputValue: time,
    });

    for (let i = 0; i < sentiment.length; i++) {
      if (time > sentiment[i].time && time <= sentiment[i].end) {
        this.setState({
          sentiment: sentiment[i],
        });
        break;
      }
    }
  };

  componentDidMount() {
    const cfg = chart.config();
    this.svg = window.d3.select('.chart-container').append('svg')
    .attr('width', cfg.w + 50)
    .attr('height', cfg.h + 50);
  }

  componentDidUpdate() {
    const data = [
      {
        className: 'default',
        axes: [
          { axis: 'anger', value: parseFloat(this.state.sentiment.anger), yOffset: 10 },
          { axis: 'disgust', value: parseFloat(this.state.sentiment.disgust) },
          { axis: 'fear', value: parseFloat(this.state.sentiment.fear) },
          { axis: 'joy', value: parseFloat(this.state.sentiment.joy) },
          { axis: 'sadness', value: parseFloat(this.state.sentiment.sadness), xOffset: -20 },
        ],
      },
    ];
    const foo = this.svg.selectAll('g.foo').data([data]);
    foo.enter().append('g').classed('foo', 1);
    foo.call(chart);
  }

  render() {
    // console.log(convertToRaw(this.state.editorState.getCurrentContent()));
    return (
      <div className="flex" style={{ paddingTop: 40 }}>
        <div style={{ flex: 1 }}></div>
        <div style={{ flex: 3 }}>
          <h1 style={{ fontSize: 20, padding: 40 }} className="text-center">Donald Trump Acceptance Speech</h1>
          <div className="flex">
            <div className="cell align-center">
              <video
                id="video"
                src="https://メディア.trint.com/577a8971869d2f7f177c38c1/1322747868741/54530a42-c220-4184-8501-bf81d5386e3f/T0y6tsA4TJq3X39Sr3mMGQ.mp4?Expires=1489007663&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly94bi0tY2NrYjFpOGQudHJpbnQuY29tLzU3N2E4OTcxODY5ZDJmN2YxNzdjMzhjMS8xMzIyNzQ3ODY4NzQxLzU0NTMwYTQyLWMyMjAtNDE4NC04NTAxLWJmODFkNTM4NmUzZi9UMHk2dHNBNFRKcTNYMzlTcjNtTUdRLm1wNCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTQ4OTAwNzY2M319fV19&Signature=MVuL2xCpwgoXkyk35dFRZilXGmDIDUGSxQ0UvtB7AKKO-NqmNKQ7DwxH8VCegdvPlC2vc8yqdHioXIOixmURvJoMssG9zQpoz2DR5aNaVoLn15s-Yyay-iFwKSr~GEA0mVvWd5g~EUN2hvUIR5hztglT18K3~lNZrjtUq7McEePsDrvY3WQCDyR7uWG5PbYY4X6L6kAEnbg1gTPyte3Wev6ZVi3WCeJH~UPvkXcaHxa42Jtdwkd3IrQRduAiIsBeHbjdidyILhmqMDUgPOnZzA2SgZ4O2W12NEfXrVtX0Hiuo6ZbttsKdDHn6LgjO0WNriV2qxVJPTFzD9VQO5rPuw__&Key-Pair-Id=APKAJ7JCI2AT2YPOWIAA"
                controls="controls"
                onTimeUpdate={this.handleTimeupdate}
              >…
              </video>
            </div>
          </div>
          <div onClick={this.focus}>
            <Editor
              editorState={this.state.editorState}
              onChange={this.onChange}
              placeholder="Enter some text..."
              ref="editor"
              blockRenderMap={Draft.DefaultDraftBlockRenderMap.merge(blockRenderMap(this.props))}
            />
          </div>
        </div>
        <div style={{ flex: 1, paddingTop: 120 }}>
          <div className="chart-container" />
        </div>
      </div>
    );
  }
}

EntityEditorExample.propTypes = {
  dispatch: React.PropTypes.func,
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
    // backgroundColor: 'rgba(204, 204, 255, 1.0)',
    // fontWeigth: 400,
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
