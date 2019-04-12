import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import NoSSR from 'react-no-ssr';
import SettingsIcon from '@material-ui/icons/Settings';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  gearIcon: {
    cursor: "pointer",
    color: theme.palette.grey[400],
    marginRight: theme.spacing.unit,
  },
});

class ConfigurableRecommendationsList extends PureComponent {
  state = {
    settingsVisible: false,
    settings: {
      algorithm: "top",
      count: 10
    }
  }
  
  toggleSettings = () => {
    this.setState({
      settingsVisible: !this.state.settingsVisible,
    });
  }
  
  render() {
    const { classes } = this.props;
    const { SingleColumnSection, SectionTitle, RecommendationsAlgorithmPicker,
      RecommendationsList } = Components;
    
    return <SingleColumnSection>
      <SectionTitle title="Recommended">
        <SettingsIcon className={classes.gearIcon} onClick={this.toggleSettings}/>
      </SectionTitle>
      { this.state.settingsVisible &&
        <RecommendationsAlgorithmPicker
          settings={this.state.settings}
          onChange={(settings) => this.setState({settings: settings})}
        /> }
      <NoSSR>
        <RecommendationsList
          count={this.state.settings.count}
          method={this.state.settings.algorithm}
        />
      </NoSSR>
    </SingleColumnSection>
  }
}

registerComponent("ConfigurableRecommendationsList", ConfigurableRecommendationsList,
  withStyles(styles, {name: "ConfigurableRecommendationsList"}));