/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { Fragment } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiButtonIcon, EuiCallOut, EuiLoadingSpinner } from '@elastic/eui';
import { i18n } from '@kbn/i18n';


export class FeatureTooltip extends React.Component {

  state = {
    properties: undefined,
    loadPropertiesErrorMsg: undefined,
  };

  componentDidMount() {
    this._isMounted = true;
    this.prevLayerId = undefined;
    this.prevFeatureId = undefined;
    this._loadProperties();
  }

  componentDidUpdate() {
    this._loadProperties();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  _loadProperties = () => {
    this._fetchProperties({
      nextFeatureId: this.props.tooltipState.featureId,
      nextLayerId: this.props.tooltipState.layerId,
    });
  }

  _fetchProperties = async ({ nextLayerId, nextFeatureId }) => {
    if (this.prevLayerId === nextLayerId && this.prevFeatureId === nextFeatureId) {
      // do not reload same feature properties
      return;
    }

    this.prevLayerId = nextLayerId;
    this.prevFeatureId = nextFeatureId;
    this.setState({
      properties: undefined,
      loadPropertiesErrorMsg: undefined,
    });

    let properties;
    try {
      properties = await this.props.loadFeatureProperties({ layerId: nextLayerId, featureId: nextFeatureId });
    } catch(error) {
      if (this._isMounted) {
        this.setState({
          properties: [],
          loadPropertiesErrorMsg: error.message
        });
      }
      return;
    }

    if (this.prevLayerId !== nextLayerId && this.prevFeatureId !== nextFeatureId) {
      // ignore results for old request
      return;
    }

    if (this._isMounted) {
      this.setState({
        properties
      });
    }
  }

  _renderFilterButton(tooltipProperty) {
    if (!this.props.showFilterButtons || !tooltipProperty.isFilterable())  {
      return null;
    }

    return (
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          iconType="plusInCircle"
          title={i18n.translate('xpack.maps.tooltip.filterOnPropertyTitle', {
            defaultMessage: 'Filter on property'
          })}
          onClick={() => {
            this.props.closeTooltip();
            const filterAction = tooltipProperty.getFilterAction();
            filterAction();
          }}
          aria-label={i18n.translate('xpack.maps.tooltip.filterOnPropertyAriaLabel', {
            defaultMessage: 'Filter on property'
          })}
          className="mapFeatureTooltipFilterButton"
        />
      </EuiFlexItem>
    );
  }

  _renderProperties(hasFilters) {
    return this.state.properties.map((tooltipProperty, index) => {
      /*
       * Justification for dangerouslySetInnerHTML:
       * Property value contains value generated by Field formatter
       * Since these formatters produce raw HTML, this component needs to be able to render them as-is, relying
       * on the field formatter to only produce safe HTML.
       */
      const htmlValue = (<span
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: tooltipProperty.getHtmlDisplayValue()
        }}
      />);

      return (
        <EuiFlexGroup key={index}>
          <EuiFlexItem grow={4}>
            <strong>{tooltipProperty.getPropertyName()}</strong>
          </EuiFlexItem>
          <EuiFlexItem grow={6}>
            {htmlValue}
          </EuiFlexItem>
          {this._renderFilterButton(tooltipProperty, hasFilters)}
        </EuiFlexGroup>
      );
    });
  }

  _renderCloseButton() {
    if (!this.props.showCloseButton) {
      return null;
    }
    return (
      <EuiFlexGroup direction="column" gutterSize="none">
        <EuiFlexItem grow={true}>
          <EuiFlexGroup alignItems="flexEnd" direction="row" justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                onClick={this.props.closeTooltip}
                iconType="cross"
                aria-label={i18n.translate('xpack.maps.tooltip.closeAriaLabel', {
                  defaultMessage: 'Close tooltip'
                })}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  render() {
    if (!this.state.properties) {
      return (
        <div>
          <EuiLoadingSpinner size="m" /> {' loading content'}
        </div>
      );
    }

    if (this.state.loadPropertiesErrorMsg) {
      return (
        <EuiCallOut
          title={i18n.translate('xpack.maps.tooltip.unableToLoadContentTitle', {
            defaultMessage: 'Unable to load tooltip content'
          })}
          color="danger"
          iconType="cross"
        >
          <p>
            {this.state.loadPropertiesErrorMsg}
          </p>
        </EuiCallOut>
      );
    }

    return (
      <Fragment>
        <EuiFlexGroup direction="column" gutterSize="none">
          {this._renderCloseButton()}
          <EuiFlexItem>
            <EuiFlexGroup direction="column" gutterSize="none">
              {this._renderProperties()}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    );
  }
}

