import React, { PropTypes } from 'react';
import momentPropTypes from 'react-moment-proptypes';
import moment from 'moment';
import omit from 'lodash.omit';

import DateRangePicker from '../src/components/DateRangePicker';

import DateRangePickerShape from '../src/shapes/DateRangePickerShape';
import { START_DATE, END_DATE, HORIZONTAL_ORIENTATION, ANCHOR_LEFT } from '../constants';
import isInclusivelyAfterDay from '../src/utils/isInclusivelyAfterDay';

const propTypes = {
  // example props for the demo
  autoFocus: PropTypes.bool,
  autoFocusEndDate: PropTypes.bool,
  initialStartDate: momentPropTypes.momentObj,
  initialEndDate: momentPropTypes.momentObj,

  ...omit(DateRangePickerShape, [
    'startDate',
    'endDate',
    'onDatesChange',
    'selectedInput',
    'onSelectedInputChange',
  ]),
};

const defaultProps = {
  // example props for the demo
  autoFocus: false,
  autoFocusEndDate: false,
  initialStartDate: null,
  initialEndDate: null,

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

class DateRangePickerWrapper extends React.Component {
  constructor(props) {
    super(props);

    let selectedInput = null;
    if (props.autoFocus) {
      selectedInput = START_DATE;
    } else if (props.autoFocusEndDate) {
      selectedInput = END_DATE;
    }

    this.state = {
      selectedInput,
      startDate: props.initialStartDate,
      endDate: props.initialEndDate,
    };

    this.onDatesChange = this.onDatesChange.bind(this);
    this.onSelectedInputChange = this.onSelectedInputChange.bind(this);
  }

  onDatesChange({ startDate, endDate }) {
    this.setState({ startDate, endDate });
  }

  onSelectedInputChange(selectedInput) {
    this.setState({ selectedInput });
  }

  render() {
    const { selectedInput, startDate, endDate } = this.state;

    const props = omit(this.props, [
      'autoFocus',
      'autoFocusEndDate',
      'initialStartDate',
      'initialEndDate',
    ]);

    return (
      <div>
        <DateRangePicker
          {...props}
          onDatesChange={this.onDatesChange}
          onSelectedInputChange={this.onSelectedInputChange}
          selectedInput={selectedInput}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    );
  }
}

DateRangePickerWrapper.propTypes = propTypes;
DateRangePickerWrapper.defaultProps = defaultProps;

export default DateRangePickerWrapper;
