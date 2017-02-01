import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { Provider } from 'react-redux';

import Entity from './Entity';

const inputState = (state = '', action) => {
  switch (action.type) {
    case 'INPUT_UPDATED':
      return action.inputValue;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  inputState,
});

const middlewares = [];

const store = createStore(rootReducer, {}, compose(
  applyMiddleware(...middlewares),
  typeof window === 'object' && typeof window.devToolsExtension !== 'undefined' ?
  window.devToolsExtension() :
  f => f,
));

ReactDOM.render(
  <Provider store={store}>
    <Entity />
  </Provider>,
  document.getElementById('root'),
);
