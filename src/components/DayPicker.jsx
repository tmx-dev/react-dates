import React, { PropTypes } from 'react';
import shallowCompare from 'react-addons-shallow-compare';
import ReactDOM from 'react-dom';
import { forbidExtraProps } from 'airbnb-prop-types';
import moment from 'moment';
import cx from 'classnames';

import OutsideClickHandler from './OutsideClickHandler';
import CalendarMonthGrid from './CalendarMonthGrid';
import DayPickerNavigation from './DayPickerNavigation';
import DayPickerKeyboardShortcuts from './DayPickerKeyboardShortcuts';

import getTransformStyles from '../utils/getTransformStyles';

import ScrollableOrientationShape from '../shapes/ScrollableOrientationShape';

import {
  HORIZONTAL_ORIENTATION,
  VERTICAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
} from '../../constants';

const CALENDAR_MONTH_WIDTH = 300;
const DAY_PICKER_PADDING = 9;
const MONTH_PADDING = 23;
const PREV_TRANSITION = 'prev';
const NEXT_TRANSITION = 'next';

const propTypes = forbidExtraProps({
  // calendar presentation props
  enableOutsideDays: PropTypes.bool,
  numberOfMonths: PropTypes.number,
  orientation: ScrollableOrientationShape,
  withPortal: PropTypes.bool,
  onOutsideClick: PropTypes.func,
  hidden: PropTypes.bool,
  initialVisibleMonth: PropTypes.func,

  // navigation props
  navPrev: PropTypes.node,
  navNext: PropTypes.node,
  onPrevMonthClick: PropTypes.func,
  onNextMonthClick: PropTypes.func,

  // day props
  modifiers: PropTypes.object,
  renderDay: PropTypes.func,
  onDayClick: PropTypes.func,
  onDayMouseEnter: PropTypes.func,
  onDayMouseLeave: PropTypes.func,

  // accessibility props
  isFocused: PropTypes.bool,
  getFirstFocusableDay: PropTypes.func,
  onBlur: PropTypes.func,
  showKeyboardShortcuts: PropTypes.bool,

  // internationalization
  monthFormat: PropTypes.string,
  phrases: PropTypes.shape({
    jumpToPrevMonth: PropTypes.node,
    jumpToNextMonth: PropTypes.node,
    keyboardShortcuts: PropTypes.shape({
      showKeyboardShortcutsPanel: PropTypes.node,
      hideKeyboardShortcutsPanel: PropTypes.node,
      enterKey: PropTypes.node,
      leftArrowRightArrow: PropTypes.node,
      upArrowDownArrow: PropTypes.node,
      pageUpPageDown: PropTypes.node,
      homeEnd: PropTypes.node,
      escape: PropTypes.node,
      questionMark: PropTypes.node,
      selectFocusedDate: PropTypes.node,
      moveFocusByOneDay: PropTypes.node,
      moveFocusByOneWeek: PropTypes.node,
      moveFocusByOneMonth: PropTypes.node,
      moveFocustoStartAndEndOfWeek: PropTypes.node,
      returnFocusToInput: PropTypes.node,
      showKeyboardShortcuts: PropTypes.node,
    }),
  }),
});

const defaultProps = {
  // calendar presentation props
  enableOutsideDays: false,
  numberOfMonths: 2,
  orientation: HORIZONTAL_ORIENTATION,
  withPortal: false,
  onOutsideClick() {},
  hidden: false,
  initialVisibleMonth: () => moment(),

  // navigation props
  navPrev: null,
  navNext: null,
  onPrevMonthClick() {},
  onNextMonthClick() {},

  // day props
  modifiers: {},
  renderDay: null,
  onDayClick() {},
  onDayMouseEnter() {},
  onDayMouseLeave() {},

  // accessibility props
  isFocused: false,
  getFirstFocusableDay: null,
  onBlur() {},
  showKeyboardShortcuts: false,

  // internationalization
  monthFormat: 'MMMM YYYY',
  phrases: {
    jumpToPrevMonth: 'Jump to previous month',
    jumpToNextMonth: 'Jump to next month',
    keyboardShortcuts: {
      showKeyboardShortcutsPanel: 'Show keyboard shortcuts panel',
      hideKeyboardShortcutsPanel: 'Hide keyboard shortcuts panel',
      enterKey: 'Enter key',
      leftArrowRightArrow: 'Left Arrow/Right Arrow',
      upArrowDownArrow: 'Up Arrow/Down Arrow',
      pageUpPageDown: 'Page Up/Page Down',
      homeEnd: 'Home/End',
      escape: 'Escape',
      shiftAndForwardSlash: 'Shift key + forward slash',
      selectFocusedDate: 'Select the currently focused date',
      moveFocusByOneDay: 'Decrement/Increment currently focused day by 1 day',
      moveFocusByOneWeek: 'Decrement/Increment currently focused day by 1 week',
      moveFocusByOneMonth: 'Decrement/Increment currently focused day by 1 month',
      moveFocustoStartAndEndOfWeek: 'Navigate to the beginning or end of the currently focused week',
      returnFocusToInput: 'Return focus to the input field',
      showKeyboardShortcuts: 'Show the keyboard shortcuts panel',
    },
  },
};

function applyTransformStyles(el, transform, opacity = '') {
  const transformStyles = getTransformStyles(transform);
  transformStyles.opacity = opacity;

  Object.keys(transformStyles).forEach((styleKey) => {
    // eslint-disable-next-line no-param-reassign
    el.style[styleKey] = transformStyles[styleKey];
  });
}

export function calculateDimension(el, axis, borderBox = false, withMargin = false) {
  if (!el) {
    return 0;
  }

  const axisStart = (axis === 'width') ? 'Left' : 'Top';
  const axisEnd = (axis === 'width') ? 'Right' : 'Bottom';

  // Only read styles if we need to
  const style = (!borderBox || withMargin) ? window.getComputedStyle(el) : {};

  // Offset includes border and padding
  let size = (axis === 'width') ? el.offsetWidth : el.offsetHeight;

  // Get the inner size
  if (!borderBox) {
    size -= (
      parseFloat(style[`padding${axisStart}`]) +
      parseFloat(style[`padding${axisEnd}`]) +
      parseFloat(style[`border${axisStart}Width`]) +
      parseFloat(style[`border${axisEnd}Width`])
    );
  }

  // Apply margin
  if (withMargin) {
    size += (
      parseFloat(style[`margin${axisStart}`]) +
      parseFloat(style[`margin${axisEnd}`])
    );
  }

  return size;
}

function getMonthHeight(el) {
  const caption = el.querySelector('.js-CalendarMonth__caption');
  const grid = el.querySelector('.js-CalendarMonth__grid');

  // Need to separate out table children for FF
  // Add an additional +1 for the border
  return (
    calculateDimension(caption, 'height', true, true) + calculateDimension(grid, 'height') + 1
  );
}

export default class DayPicker extends React.Component {
  constructor(props) {
    super(props);

    this.hasSetInitialVisibleMonth = !props.hidden;
    this.state = {
      currentMonth: props.hidden ? moment() : props.initialVisibleMonth(),
      monthTransition: null,
      translationValue: 0,
      scrollableMonthMultiple: 1,
      focusedDate: null,
      nextFocusedDate: null,
      showKeyboardShortcuts: props.showKeyboardShortcuts,
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onPrevMonthClick = this.onPrevMonthClick.bind(this);
    this.onNextMonthClick = this.onNextMonthClick.bind(this);
    this.multiplyScrollableMonths = this.multiplyScrollableMonths.bind(this);
    this.updateStateAfterMonthTransition = this.updateStateAfterMonthTransition.bind(this);
    this.toggleKeyboardShortcuts = this.toggleKeyboardShortcuts.bind(this);
  }

  componentDidMount() {
    if (this.isHorizontal()) {
      this.adjustDayPickerHeight();
      this.initializeDayPickerWidth();
    }
  }

  componentWillReceiveProps(nextProps) {
    const { hidden, isFocused, showKeyboardShortcuts } = nextProps;
    const { currentMonth } = this.state;

    if (!hidden) {
      if (!this.hasSetInitialVisibleMonth) {
        this.hasSetInitialVisibleMonth = true;
        this.setState({
          currentMonth: nextProps.initialVisibleMonth(),
        });
      }

      if (!this.dayPickerWidth && this.isHorizontal()) {
        this.initializeDayPickerWidth();
        this.adjustDayPickerHeight();
      }
    }

    if (isFocused !== this.props.isFocused) {
      if (isFocused) {
        const focusedDate = this.getFocusedDay(currentMonth);
        this.setState({
          showKeyboardShortcuts,
          focusedDate,
        });
      } else {
        this.setState({ focusedDate: null });
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState);
  }

  componentDidUpdate(prevProps, prevState) {
    const { monthTransition, currentMonth } = this.state;
    if (monthTransition || !currentMonth.isSame(prevState.currentMonth)) {
      if (this.isHorizontal()) {
        this.adjustDayPickerHeight();
      }
    }

    if (!prevProps.showKeyboardShortcuts && this.props.showKeyboardShortcuts) {
      // not sure what the right approach is here
      this.container.focus();
    }
  }

  onKeyDown(e) {
    const { onBlur } = this.props;
    const { focusedDate } = this.state;

    if (!focusedDate) return;

    const newFocusedDate = focusedDate.clone();

    let didTransitionMonth = false;

    switch (e.key) {
      case 'ArrowUp':
        newFocusedDate.subtract(1, 'week');
        didTransitionMonth = this.maybeTransitionPrevMonth(newFocusedDate);
        break;
      case 'ArrowLeft':
        newFocusedDate.subtract(1, 'day');
        didTransitionMonth = this.maybeTransitionPrevMonth(newFocusedDate);
        break;
      case 'Home':
        newFocusedDate.startOf('week');
        didTransitionMonth = this.maybeTransitionPrevMonth(newFocusedDate);
        break;
      case 'PageUp':
        newFocusedDate.subtract(1, 'month');
        didTransitionMonth = this.maybeTransitionPrevMonth(newFocusedDate);
        break;

      case 'ArrowDown':
        newFocusedDate.add(1, 'week');
        didTransitionMonth = this.maybeTransitionNextMonth(newFocusedDate);
        break;
      case 'ArrowRight':
        newFocusedDate.add(1, 'day');
        didTransitionMonth = this.maybeTransitionNextMonth(newFocusedDate);
        break;
      case 'End':
        newFocusedDate.endOf('week');
        didTransitionMonth = this.maybeTransitionNextMonth(newFocusedDate);
        break;
      case 'PageDown':
        newFocusedDate.add(1, 'month');
        didTransitionMonth = this.maybeTransitionNextMonth(newFocusedDate);
        break;

      case '?':
        this.toggleKeyboardShortcuts();
        break;

      case 'Escape':
        this.setState({
          showKeyboardShortcuts: false,
        });
        onBlur();
        return;
      default:
        break;
    }

    // If there was a month transition, do not update the focused date until the transition has
    // completed. Otherwise, attempting to focus on a DOM node may interrupt the CSS animation.
    if (!didTransitionMonth) {
      this.setState({
        focusedDate: newFocusedDate,
      });
    }
  }

  onPrevMonthClick(nextFocusedDate, e) {
    if (e) e.preventDefault();

    if (this.props.onPrevMonthClick) {
      this.props.onPrevMonthClick(e);
    }

    const translationValue =
      this.isVertical() ? this.getMonthHeightByIndex(0) : this.dayPickerWidth;

    // The first CalendarMonth is always positioned absolute at top: 0 or left: 0
    // so we need to transform it to the appropriate location before the animation.
    // This behavior is because we would otherwise need a double-render in order to
    // adjust the container position once we had the height the first calendar
    // (ie first draw all the calendar, then in a second render, use the first calendar's
    // height to position the container). Variable calendar heights, amirite? <3 Maja
    this.translateFirstDayPickerForAnimation(translationValue);

    this.setState({
      monthTransition: PREV_TRANSITION,
      translationValue,
      nextFocusedDate,
    });
  }

  onNextMonthClick(nextFocusedDate, e) {
    if (e) e.preventDefault();
    if (this.props.onNextMonthClick) {
      this.props.onNextMonthClick(e);
    }

    const translationValue =
      this.isVertical() ? -this.getMonthHeightByIndex(1) : -this.dayPickerWidth;

    this.setState({
      monthTransition: NEXT_TRANSITION,
      translationValue,
      nextFocusedDate,
    });
  }

  getFocusedDay(newMonth) {
    // TODO(maja): figure out which month var I should be using
    const { getFirstFocusableDay } = this.props;
    const { currentMonth } = this.state;

    let focusedDate;
    if (getFirstFocusableDay) {
      const month = newMonth || currentMonth;
      focusedDate = getFirstFocusableDay(month);
    }

    if (!focusedDate || !this.isDayVisible(focusedDate, newMonth)) {
      focusedDate = newMonth.clone().startOf('month');
    }

    return focusedDate;
  }

  getMonthHeightByIndex(i) {
    return getMonthHeight(this.transitionContainer.querySelectorAll('.CalendarMonth')[i]);
  }

  maybeTransitionNextMonth(newFocusedDate) {
    const { focusedDate } = this.state;

    const newFocusedDateMonth = newFocusedDate.month();
    const focusedDateMonth = focusedDate.month();
    if (newFocusedDateMonth !== focusedDateMonth && !this.isDayVisible(newFocusedDate)) {
      this.onNextMonthClick(newFocusedDate);
      return true;
    }

    return false;
  }

  maybeTransitionPrevMonth(newFocusedDate) {
    const { focusedDate } = this.state;

    const newFocusedDateMonth = newFocusedDate.month();
    const focusedDateMonth = focusedDate.month();
    if (newFocusedDateMonth !== focusedDateMonth && !this.isDayVisible(newFocusedDate)) {
      this.onPrevMonthClick(newFocusedDate);
      return true;
    }

    return false;
  }

  multiplyScrollableMonths(e) {
    if (e) e.preventDefault();

    this.setState({
      scrollableMonthMultiple: this.state.scrollableMonthMultiple + 1,
    });
  }

  isDayVisible(day, newMonth) {
    const { numberOfMonths } = this.props;
    const { currentMonth } = this.state;

    const month = newMonth || currentMonth;
    return !day.isBefore(month.clone().startOf('month')) &&
      !day.isAfter(month.clone().add(numberOfMonths - 1, 'months').endOf('month'));
  }

  isHorizontal() {
    return this.props.orientation === HORIZONTAL_ORIENTATION;
  }

  isVertical() {
    return this.props.orientation === VERTICAL_ORIENTATION ||
      this.props.orientation === VERTICAL_SCROLLABLE;
  }

  initializeDayPickerWidth() {
    this.dayPickerWidth = calculateDimension(
      // eslint-disable-next-line react/no-find-dom-node
      ReactDOM.findDOMNode(this.calendarMonthGrid).querySelector('.CalendarMonth'),
      'width',
      true,
    );
  }

  updateStateAfterMonthTransition() {
    const { currentMonth, monthTransition, focusedDate, nextFocusedDate } = this.state;

    if (!monthTransition) return;

    const newMonth = currentMonth.clone();
    if (monthTransition === PREV_TRANSITION) {
      newMonth.subtract(1, 'month');
    } else if (monthTransition === NEXT_TRANSITION) {
      newMonth.add(1, 'month');
    }

    let newFocusedDate = null;
    if (nextFocusedDate) {
      newFocusedDate = nextFocusedDate;
    } else if (focusedDate) {
      newFocusedDate = this.getFocusedDay(newMonth);
    }

    // clear the previous transforms
    applyTransformStyles(
      // eslint-disable-next-line react/no-find-dom-node
      ReactDOM.findDOMNode(this.calendarMonthGrid).querySelector('.CalendarMonth'),
      'none',
    );

    this.setState({
      currentMonth: newMonth,
      monthTransition: null,
      translationValue: 0,
      nextFocusedDate: null,
      focusedDate: newFocusedDate,
    });
  }

  adjustDayPickerHeight() {
    const heights = [];

    Array.prototype.forEach.call(this.transitionContainer.querySelectorAll('.CalendarMonth'),
      (el) => {
        if (el.getAttribute('data-visible') === 'true') {
          heights.push(getMonthHeight(el));
        }
      },
    );

    const newMonthHeight = Math.max(...heights) + MONTH_PADDING;

    if (newMonthHeight !== calculateDimension(this.transitionContainer, 'height')) {
      this.monthHeight = newMonthHeight;
      this.transitionContainer.style.height = `${newMonthHeight}px`;
    }
  }

  translateFirstDayPickerForAnimation(translationValue) {
    const transformType = this.isVertical() ? 'translateY' : 'translateX';
    const transformValue = `${transformType}(-${translationValue}px)`;

    applyTransformStyles(
      this.transitionContainer.querySelector('.CalendarMonth'),
      transformValue,
      1,
    );
  }

  toggleKeyboardShortcuts() {
    this.setState({
      showKeyboardShortcuts: !this.state.showKeyboardShortcuts,
    });
  }

  renderNavigation() {
    const {
      navPrev,
      navNext,
      orientation,
      phrases,
    } = this.props;

    let onNextMonthClick;
    if (orientation === VERTICAL_SCROLLABLE) {
      onNextMonthClick = this.multiplyScrollableMonths;
    } else {
      onNextMonthClick = e => this.onNextMonthClick(null, e);
    }

    return (
      <DayPickerNavigation
        onPrevMonthClick={e => this.onPrevMonthClick(null, e)}
        onNextMonthClick={onNextMonthClick}
        navPrev={navPrev}
        navNext={navNext}
        orientation={orientation}
        phrases={phrases}
      />
    );
  }

  renderWeekHeader(index) {
    const horizontalStyle = {
      left: index * CALENDAR_MONTH_WIDTH,
    };

    const style = this.isHorizontal() ? horizontalStyle : {};

    const header = [];
    for (let i = 0; i < 7; i += 1) {
      header.push(
        <li key={i}>
          <small>{moment().weekday(i).format('dd')}</small>
        </li>,
      );
    }

    return (
      <div
        className="DayPicker__week-header"
        key={`week-${index}`}
        style={style}
      >
        <ul>
          {header}
        </ul>
      </div>
    );
  }

  render() {
    const {
      currentMonth,
      monthTransition,
      translationValue,
      scrollableMonthMultiple,
      focusedDate,
      showKeyboardShortcuts,
    } = this.state;

    const {
      enableOutsideDays,
      numberOfMonths,
      orientation,
      modifiers,
      withPortal,
      onDayClick,
      onDayMouseEnter,
      onDayMouseLeave,
      renderDay,
      onOutsideClick,
      monthFormat,
    } = this.props;

    const numOfWeekHeaders = this.isVertical() ? 1 : numberOfMonths;
    const weekHeaders = [];
    for (let i = 0; i < numOfWeekHeaders; i += 1) {
      weekHeaders.push(this.renderWeekHeader(i));
    }

    let firstVisibleMonthIndex = 1;
    if (monthTransition === PREV_TRANSITION) {
      firstVisibleMonthIndex -= 1;
    } else if (monthTransition === NEXT_TRANSITION) {
      firstVisibleMonthIndex += 1;
    }

    const verticalScrollable = this.props.orientation === VERTICAL_SCROLLABLE;

    const dayPickerClassNames = cx('DayPicker', {
      'DayPicker--horizontal': this.isHorizontal(),
      'DayPicker--vertical': this.isVertical(),
      'DayPicker--vertical-scrollable': verticalScrollable,
      'DayPicker--portal': withPortal,
    });

    const transitionContainerClasses = cx('transition-container', {
      'transition-container--horizontal': this.isHorizontal(),
      'transition-container--vertical': this.isVertical(),
    });

    const horizontalWidth = (CALENDAR_MONTH_WIDTH * numberOfMonths) + (2 * DAY_PICKER_PADDING);

    // this is a kind of made-up value that generally looks good. we'll
    // probably want to let the user set this explicitly.
    const verticalHeight = 1.75 * CALENDAR_MONTH_WIDTH;

    const dayPickerStyle = {
      width: this.isHorizontal() && horizontalWidth,

      // These values are to center the datepicker (approximately) on the page
      marginLeft: this.isHorizontal() && withPortal && -horizontalWidth / 2,
      marginTop: this.isHorizontal() && withPortal && -CALENDAR_MONTH_WIDTH / 2,
    };

    const transitionContainerStyle = {
      width: this.isHorizontal() && horizontalWidth,
      height: this.isVertical() && !verticalScrollable && !withPortal && verticalHeight,
    };

    const isCalendarMonthGridAnimating = monthTransition !== null;
    const transformType = this.isVertical() ? 'translateY' : 'translateX';
    const transformValue = `${transformType}(${translationValue}px)`;

    const shouldFocusDate = !isCalendarMonthGridAnimating && !showKeyboardShortcuts;

    return (
      <div className={dayPickerClassNames} style={dayPickerStyle}>
        <OutsideClickHandler onOutsideClick={onOutsideClick}>
          <div
            className="DayPicker__week-headers"
            aria-hidden="true"
            role="presentation"
          >
            {weekHeaders}
          </div>

          <div
            ref={(ref) => { this.container = ref; }}
            onKeyDown={this.onKeyDown}
            role="region"
            tabIndex={0}
          >
            {!verticalScrollable && this.renderNavigation()}

            <div
              className={transitionContainerClasses}
              ref={(ref) => { this.transitionContainer = ref; }}
              style={transitionContainerStyle}
            >
              <CalendarMonthGrid
                ref={(ref) => { this.calendarMonthGrid = ref; }}
                calendarMonthWidth={CALENDAR_MONTH_WIDTH}
                transformValue={transformValue}
                enableOutsideDays={enableOutsideDays}
                firstVisibleMonthIndex={firstVisibleMonthIndex}
                initialMonth={currentMonth}
                isAnimating={isCalendarMonthGridAnimating}
                modifiers={modifiers}
                orientation={orientation}
                numberOfMonths={numberOfMonths * scrollableMonthMultiple}
                onDayClick={onDayClick}
                onDayMouseEnter={onDayMouseEnter}
                onDayMouseLeave={onDayMouseLeave}
                renderDay={renderDay}
                onMonthTransitionEnd={this.updateStateAfterMonthTransition}
                monthFormat={monthFormat}
                focusedDate={shouldFocusDate ? focusedDate : null}
              />

              {verticalScrollable && this.renderNavigation()}
            </div>

            <DayPickerKeyboardShortcuts
              showKeyboardShortcutsPanel={showKeyboardShortcuts}
              toggleKeyboardShortcutsPanel={this.toggleKeyboardShortcuts}
            />
          </div>
        </OutsideClickHandler>
      </div>
    );
  }
}

DayPicker.propTypes = propTypes;
DayPicker.defaultProps = defaultProps;
