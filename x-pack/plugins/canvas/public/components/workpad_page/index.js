/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import isEqual from 'react-fast-compare';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { branch, compose, shouldUpdate, withProps } from 'recompose';
import { canUserWrite, getFullscreen } from '../../state/selectors/app';
import { getNodes, getPageById, isWriteable } from '../../state/selectors/workpad';
import { not } from '../../lib/aeroelastic/functional';
import { StaticPage } from '../workpad_static_page';
import { InteractivePage } from '../workpad_interactive_page';

const animationProps = ({ isSelected, animation }) => {
  function getClassName() {
    if (animation) {
      return animation.name;
    }
    return isSelected ? 'canvasPage--isActive' : 'canvasPage--isInactive';
  }

  function getAnimationStyle() {
    if (!animation) {
      return {};
    }
    return {
      animationDirection: animation.direction,
      // TODO: Make this configurable
      animationDuration: '1s',
    };
  }

  return {
    className: getClassName(),
    animationStyle: getAnimationStyle(),
  };
};

const mapStateToProps = (state, ownProps) => ({
  isEditable: !getFullscreen(state) && isWriteable(state) && canUserWrite(state),
  elements: getNodes(state, ownProps.pageId),
  pageStyle: getPageById(state, ownProps.pageId).style,
});

const mergeProps = ({ isEditable, ...restState }, {}, { isSelected, ...remainingOwnProps }) => ({
  isInteractive: isEditable && isSelected,
  ...remainingOwnProps,
  ...restState,
});

export const WorkpadPage = compose(
  shouldUpdate(not(isEqual)), // this is critical, else random unrelated rerenders in the parent cause glitches here
  withProps(animationProps),
  connect(
    mapStateToProps,
    null,
    mergeProps
  ),
  branch(({ isInteractive }) => isInteractive, InteractivePage, StaticPage)
)();

WorkpadPage.propTypes = {
  pageId: PropTypes.string.isRequired,
};
