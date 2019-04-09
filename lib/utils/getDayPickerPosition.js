'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports['default'] = getDayPickerPosition;
// import { ANCHOR_LEFT } from '../../constants';

function getDayPickerPosition(parentRect) {
  var horizontalWidth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var _parentRect$top = parentRect.top,
      top = _parentRect$top === undefined ? 0 : _parentRect$top,
      _parentRect$left = parentRect.left,
      left = _parentRect$left === undefined ? 0 : _parentRect$left,
      _parentRect$right = parentRect.right,
      right = _parentRect$right === undefined ? horizontalWidth : _parentRect$right,
      _parentRect$height = parentRect.height,
      height = _parentRect$height === undefined ? 0 : _parentRect$height;

  var windowWidth = typeof window !== 'undefined' && window.innerWidth;
  var topPosition = top + height + 2;

  var leftPosition = left;

  if (left + horizontalWidth > windowWidth) {
    leftPosition = right - horizontalWidth;
  }

  return {
    top: topPosition,
    left: leftPosition
  };
}