import React from 'react';
import ReactDOM from 'react-dom';
import shallowCompare from 'react-addons-shallow-compare';
import moment from 'moment';
import cx from 'classnames';
import Portal from 'react-portal';
import { forbidExtraProps } from 'airbnb-prop-types';
import { addEventListener, removeEventListener } from 'consolidated-events';

import OutsideClickHandler from './OutsideClickHandler';
import getResponsiveContainerStyles from '../utils/getResponsiveContainerStyles';

import isInclusivelyAfterDay from '../utils/isInclusivelyAfterDay';

import DateRangePickerInputController from './DateRangePickerInputController';
import DayPickerRangeController from './DayPickerRangeController';

import CloseButton from '../svg/close.svg';

import DateRangePickerShape from '../shapes/DateRangePickerShape';

import {
  START_DATE,
  END_DATE,
  HORIZONTAL_ORIENTATION,
  VERTICAL_ORIENTATION,
  ANCHOR_LEFT,
  ANCHOR_RIGHT,
} from '../../constants';

const propTypes = forbidExtraProps(DateRangePickerShape);

const defaultProps = {
  // required props for a functional interactive DateRangePicker
  startDate: null,
  endDate: null,
  selectedInput: null,

  // input related props
  startDateId: START_DATE,
  startDatePlaceholderText: 'Start Date',
  endDateId: END_DATE,
  endDatePlaceholderText: 'End Date',
  disabled: false,
  required: false,
  screenReaderInputMessage: '',
  showClearDates: false,
  showDefaultInputIcon: false,
  customInputIcon: null,
  customArrowIcon: null,

  // calendar presentation and interaction related props
  orientation: HORIZONTAL_ORIENTATION,
  anchorDirection: ANCHOR_LEFT,
  horizontalMargin: 0,
  withPortal: false,
  withFullScreenPortal: false,
  initialVisibleMonth: null,
  numberOfMonths: 2,
  keepOpenOnDateSelect: false,
  reopenPickerOnClearDates: false,

  // navigation related props
  navPrev: null,
  navNext: null,
  onPrevMonthClick() {},
  onNextMonthClick() {},

  // day presentation and interaction related props
  renderDay: null,
  minimumNights: 1,
  enableOutsideDays: false,
  isDayBlocked: () => false,
  isOutsideRange: day => !isInclusivelyAfterDay(day, moment()),
  isDayHighlighted: () => false,

  // internationalization
  displayFormat: () => moment.localeData().longDateFormat('L'),
  monthFormat: 'MMMM YYYY',
  phrases: {
    closeDatePicker: 'Close',
    clearDates: 'Clear Dates',
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

export default class DateRangePicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dayPickerContainerStyles: {},
      isDateRangePickerInputFocused: false,
      isDayPickerFocused: false,
      showKeyboardShortcuts: false,
    };

    this.onOutsideClick = this.onOutsideClick.bind(this);
    this.onDateRangePickerInputFocus = this.onDateRangePickerInputFocus.bind(this);
    this.onDayPickerFocus = this.onDayPickerFocus.bind(this);
    this.onDayPickerBlur = this.onDayPickerBlur.bind(this);
    this.showKeyboardShortcutsPanel = this.showKeyboardShortcutsPanel.bind(this);

    this.responsivizePickerPosition = this.responsivizePickerPosition.bind(this);
  }

  componentDidMount() {
    this.resizeHandle = addEventListener(
      window,
      'resize',
      this.responsivizePickerPosition,
      { passive: true },
    );
    this.responsivizePickerPosition();

    if (this.props.selectedInput) {
      this.setState({
        isDateRangePickerInputFocused: true,
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.selectedInput && this.props.selectedInput && this.isOpened()) {
      // The date picker just changed from being closed to being open.
      this.responsivizePickerPosition();
    }
  }

  componentWillUnmount() {
    removeEventListener(this.resizeHandle);
  }

  onOutsideClick() {
    const { onSelectedInputChange } = this.props;
    if (!this.isOpened()) return;

    this.setState({
      isDateRangePickerInputFocused: false,
      isDayPickerFocused: false,
      showKeyboardShortcuts: false,
    });

    onSelectedInputChange(null);
  }

  onDateRangePickerInputFocus(selectedInput) {
    const { onSelectedInputChange } = this.props;

    if (selectedInput) {
      this.setState({
        isDateRangePickerInputFocused: true,
        isDayPickerFocused: false,
        showKeyboardShortcuts: false,
      });
    }

    onSelectedInputChange(selectedInput);
  }

  onDayPickerFocus() {
    this.setState({
      isDateRangePickerInputFocused: false,
      isDayPickerFocused: true,
      showKeyboardShortcuts: false,
    });
  }

  onDayPickerBlur() {
    this.setState({
      isDateRangePickerInputFocused: true,
      isDayPickerFocused: false,
      showKeyboardShortcuts: false,
    });
  }

  getDayPickerContainerClasses() {
    const {
      orientation,
      withPortal,
      withFullScreenPortal,
      anchorDirection,
    } = this.props;
    const dayPickerClassName = cx('DateRangePicker__picker', {
      'DateRangePicker__picker--direction-left': anchorDirection === ANCHOR_LEFT,
      'DateRangePicker__picker--direction-right': anchorDirection === ANCHOR_RIGHT,
      'DateRangePicker__picker--horizontal': orientation === HORIZONTAL_ORIENTATION,
      'DateRangePicker__picker--vertical': orientation === VERTICAL_ORIENTATION,
      'DateRangePicker__picker--portal': withPortal || withFullScreenPortal,
      'DateRangePicker__picker--full-screen-portal': withFullScreenPortal,
    });

    return dayPickerClassName;
  }

  getDayPickerDOMNode() {
    return ReactDOM.findDOMNode(this.dayPicker); // eslint-disable-line react/no-find-dom-node
  }

  isOpened() {
    const { selectedInput } = this.props;
    return selectedInput === START_DATE || selectedInput === END_DATE;
  }

  responsivizePickerPosition() {
    if (!this.isOpened()) {
      return;
    }

    const { anchorDirection, horizontalMargin, withPortal, withFullScreenPortal } = this.props;
    const { dayPickerContainerStyles } = this.state;

    const isAnchoredLeft = anchorDirection === ANCHOR_LEFT;
    if (!withPortal && !withFullScreenPortal) {
      const containerRect = this.dayPickerContainer.getBoundingClientRect();
      const currentOffset = dayPickerContainerStyles[anchorDirection] || 0;
      const containerEdge =
        isAnchoredLeft ? containerRect[ANCHOR_RIGHT] : containerRect[ANCHOR_LEFT];

      this.setState({
        dayPickerContainerStyles: getResponsiveContainerStyles(
          anchorDirection,
          currentOffset,
          containerEdge,
          horizontalMargin,
        ),
      });
    }
  }

  showKeyboardShortcutsPanel() {
    this.setState({
      isDateRangePickerInputFocused: false,
      isDayPickerFocused: true,
      showKeyboardShortcuts: true,
    });
  }

  maybeRenderDayPickerWithPortal() {
    const { withPortal, withFullScreenPortal } = this.props;

    if (!this.isOpened()) {
      return null;
    }

    if (withPortal || withFullScreenPortal) {
      return (
        <Portal isOpened>
          {this.renderDayPicker()}
        </Portal>
      );
    }

    return this.renderDayPicker();
  }

  renderDayPicker() {
    const {
      isDayBlocked,
      isDayHighlighted,
      isOutsideRange,
      numberOfMonths,
      orientation,
      monthFormat,
      navPrev,
      navNext,
      onPrevMonthClick,
      onNextMonthClick,
      onDatesChange,
      onSelectedInputChange,
      withPortal,
      withFullScreenPortal,
      enableOutsideDays,
      selectedInput,
      startDate,
      endDate,
      minimumNights,
      keepOpenOnDateSelect,
      renderDay,
      initialVisibleMonth,
      phrases: { jumpToPrevMonth, jumpToNextMonth, keyboardShortcuts, closeDatePicker },
    } = this.props;
    const { dayPickerContainerStyles, isDayPickerFocused, showKeyboardShortcuts } = this.state;

    const onOutsideClick = (!withFullScreenPortal && withPortal)
      ? this.onOutsideClick
      : undefined;
    const initialVisibleMonthThunk =
      initialVisibleMonth || (() => (startDate || endDate || moment()));

    return (
      <div
        ref={(ref) => { this.dayPickerContainer = ref; }}
        className={this.getDayPickerContainerClasses()}
        style={dayPickerContainerStyles}
      >
        <DayPickerRangeController
          ref={(ref) => { this.dayPicker = ref; }}
          orientation={orientation}
          enableOutsideDays={enableOutsideDays}
          numberOfMonths={numberOfMonths}
          onPrevMonthClick={onPrevMonthClick}
          onNextMonthClick={onNextMonthClick}
          onDatesChange={onDatesChange}
          onSelectedInputChange={onSelectedInputChange}
          selectedInput={selectedInput}
          startDate={startDate}
          endDate={endDate}
          monthFormat={monthFormat}
          withPortal={withPortal || withFullScreenPortal}
          initialVisibleMonth={initialVisibleMonthThunk}
          onOutsideClick={onOutsideClick}
          navPrev={navPrev}
          navNext={navNext}
          minimumNights={minimumNights}
          isOutsideRange={isOutsideRange}
          isDayHighlighted={isDayHighlighted}
          isDayBlocked={isDayBlocked}
          keepOpenOnDateSelect={keepOpenOnDateSelect}
          renderDay={renderDay}
          isFocused={isDayPickerFocused}
          showKeyboardShortcuts={showKeyboardShortcuts}
          onBlur={this.onDayPickerBlur}
          phrases={{
            jumpToPrevMonth,
            jumpToNextMonth,
            keyboardShortcuts,
          }}
        />

        {withFullScreenPortal &&
          <button
            className="DateRangePicker__close"
            type="button"
            onClick={this.onOutsideClick}
            aria-label={closeDatePicker}
          >
            <CloseButton />
          </button>
        }
      </div>
    );
  }

  render() {
    const {
      startDate,
      startDateId,
      startDatePlaceholderText,
      endDate,
      endDateId,
      endDatePlaceholderText,
      selectedInput,
      screenReaderInputMessage,
      showClearDates,
      showDefaultInputIcon,
      customInputIcon,
      customArrowIcon,
      disabled,
      required,
      phrases: { focusStartDate, clearDates },
      isOutsideRange,
      withPortal,
      withFullScreenPortal,
      displayFormat,
      reopenPickerOnClearDates,
      keepOpenOnDateSelect,
      onDatesChange,
    } = this.props;

    const { isDateRangePickerInputFocused } = this.state;

    const onOutsideClick = (!withPortal && !withFullScreenPortal) ? this.onOutsideClick : undefined;

    return (
      <div className="DateRangePicker">
        <OutsideClickHandler onOutsideClick={onOutsideClick}>
          <DateRangePickerInputController
            startDate={startDate}
            startDateId={startDateId}
            startDatePlaceholderText={startDatePlaceholderText}
            isStartDateSelected={selectedInput === START_DATE}
            endDate={endDate}
            endDateId={endDateId}
            endDatePlaceholderText={endDatePlaceholderText}
            isEndDateSelected={selectedInput === END_DATE}
            displayFormat={displayFormat}
            showClearDates={showClearDates}
            showCaret={!withPortal && !withFullScreenPortal}
            showDefaultInputIcon={showDefaultInputIcon}
            customInputIcon={customInputIcon}
            customArrowIcon={customArrowIcon}
            disabled={disabled}
            required={required}
            reopenPickerOnClearDates={reopenPickerOnClearDates}
            keepOpenOnDateSelect={keepOpenOnDateSelect}
            isOutsideRange={isOutsideRange}
            withFullScreenPortal={withFullScreenPortal}
            onDatesChange={onDatesChange}
            onSelectedInputChange={this.onDateRangePickerInputFocus}
            onArrowDown={this.onDayPickerFocus}
            onQuestionMark={this.showKeyboardShortcutsPanel}
            phrases={{ focusStartDate, clearDates }}
            screenReaderMessage={screenReaderInputMessage}
            isFocused={isDateRangePickerInputFocused}
          />

          {this.maybeRenderDayPickerWithPortal()}
        </OutsideClickHandler>
      </div>
    );
  }
}

DateRangePicker.propTypes = propTypes;
DateRangePicker.defaultProps = defaultProps;
