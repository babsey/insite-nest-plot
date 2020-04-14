import React from 'react';
import Plot from 'react-plotly.js';


export default class SpikePlot extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
        data: [{
          x: [],
          y: [],
          hoverinfo: 'none',
          type: 'scattergl',
          mode: 'markers',
        }],
        layout: {
          xaxis: {
            title: 'Time [s]',
            range: [0, 1],
          },
          yaxis: {
            title: 'Sender'
          },
          datarevision: 0,
        },
        frames: [],
        config: {
          scrollZoom: true
        },
        style: {
          position: 'relative',
          width: '100%',
          height: '100vh',
          zIndex: 1,
        },
        revision: 0
      };
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousProps.spikes !== this.props.spikes) {
      this.updateData()
    }
  }

  updateData() {
    const { data, layout } = this.state;
    data[0].x = this.props.spikes.times;
    data[0].y = this.props.spikes.senders;
    this.setState({ revision: this.state.revision + 1 });
    layout.datarevision = this.state.revision + 1;
  }

  handleRelayout(figure) {
    this.setState(figure)
    this.props.onRelayout(this.state.layout)
  }

  render() {
    return (
      <Plot
        data={this.state.data}
        layout={this.state.layout}
        frames={this.state.frames}
        config={this.state.config}
        style={this.state.style}
        revision={this.state.revision}
        onInitialized={(figure) => this.setState(figure)}
        onUpdate={(figure) => this.setState(figure)}
        onRelayout={(figure) => this.handleRelayout(figure)}
        useResizeHandler={true}
      />
    );
  }
}
