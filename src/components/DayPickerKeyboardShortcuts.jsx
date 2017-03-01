import React, { PropTypes } from 'react';
import { forbidExtraProps } from 'airbnb-prop-types';

import CloseButton from '../svg/close.svg';

const propTypes = forbidExtraProps({
  showKeyboardShortcutsPanel: PropTypes.bool,
  toggleKeyboardShortcutsPanel: PropTypes.func,
  phrases: PropTypes.shape({
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
});

const defaultProps = {
  showKeyboardShortcutsPanel: false,
  toggleKeyboardShortcutsPanel() {},
  phrases: {
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
};

function KeyboardShortcutRow({ unicode, label, action }) {
  return (
    <li className="KeyboardShortcutRow">
      <div
        className="KeyboardShortcutRow__key-container"
      >
        <span className="KeyboardShortcutRow__key" aria-label={label}>
          {unicode}
        </span>
      </div>

      <div className="KeyboardShortcutRow__action">
        {action}
      </div>
    </li>
  );
}

KeyboardShortcutRow.propTypes = {
  unicode: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  action: PropTypes.string.isRequired,
};

export default class DayPickerKeyboardShortcuts extends React.Component {
  componentDidUpdate(prevProps) {
    const { showKeyboardShortcutsPanel } = prevProps;
    const hasPanelVisibilityChanged =
      showKeyboardShortcutsPanel !== this.props.showKeyboardShortcutsPanel;
    if (showKeyboardShortcutsPanel && hasPanelVisibilityChanged) {
      this.showKeyboardShortcutsButton.focus();
    }
  }

  render() {
    const {
      showKeyboardShortcutsPanel,
      toggleKeyboardShortcutsPanel,
      phrases,
    } = this.props;

    const keyboardShortcuts = [{
      unicode: '↵',
      label: phrases.enterKey,
      action: phrases.selectFocusedDate,
    },
    {
      unicode: '←/→',
      label: phrases.leftArrowRightArrow,
      action: phrases.moveFocusByOneDay,
    },
    {
      unicode: '↑/↓',
      label: phrases.upArrowDownArrow,
      action: phrases.moveFocusByOneWeek,
    },
    {
      unicode: 'PgUp/PgDn',
      label: phrases.pageUpPageDown,
      action: phrases.moveFocusByOneMonth,
    },
    {
      unicode: 'Home/End',
      label: phrases.homeEnd,
      action: phrases.moveFocustoStartAndEndOfWeek,
    },
    {
      unicode: 'Esc',
      label: phrases.escape,
      action: phrases.returnFocusToInput,
    },
    {
      unicode: '⇧ + /',
      label: phrases.shiftAndForwardSlash,
      action: phrases.showKeyboardShortcuts,
    },
    ];

    const toggleButtonText =
      showKeyboardShortcutsPanel
      ? phrases.hideKeyboardShortcutsPanel
      : phrases.showKeyboardShortcutsPanel;

    return (
      <div>
        <button
          ref={(ref) => { this.showKeyboardShortcutsButton = ref; }}
          className="DayPickerKeyboardShortcuts__show"
          type="button"
          aria-label={toggleButtonText}
          onClick={toggleKeyboardShortcutsPanel}
          onMouseUp={(e) => {
            e.currentTarget.blur();
          }}
        >
          <span className="DayPickerKeyboardShortcuts__show_span">?</span>
        </button>

        {showKeyboardShortcutsPanel &&
          <div
            className="DayPickerKeyboardShortcuts__panel"
          >
            <h1 className="DayPickerKeyboardShortcuts__title">Keyboard Shortcuts</h1>

            <ul className="DayPickerKeyboardShortcuts__list">
              {keyboardShortcuts.map(({ unicode, label, action }) => (
                <KeyboardShortcutRow key={label} unicode={unicode} label={label} action={action} />
              ))}
            </ul>

            <button
              className="DayPickerKeyboardShortcuts__close"
              type="button"
              aria-label={phrases.hideKeyboardShortcutsPanel}
              onClick={toggleKeyboardShortcutsPanel}
            >
              <CloseButton />
            </button>
          </div>
        }
      </div>
    );
  }
}

DayPickerKeyboardShortcuts.propTypes = propTypes;
DayPickerKeyboardShortcuts.defaultProps = defaultProps;
