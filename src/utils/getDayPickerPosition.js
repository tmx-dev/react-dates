// import { ANCHOR_LEFT } from '../../constants';

export default function getDayPickerPosition(parentRect, horizontalWidth = 0) {
  const { top = 0, left = 0, right = horizontalWidth, height = 0 } = parentRect;
  const windowWidth = typeof window !== 'undefined' && window.innerWidth;
  const topPosition = top + height + 2;

  let leftPosition = left;

  if (left + horizontalWidth > windowWidth) {
    leftPosition = right - horizontalWidth;
  }

  return {
    top: topPosition,
    left: leftPosition,
  };
}
