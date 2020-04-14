import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

import SpikePlot from './SpikePlot';
import {get, post} from './requests';


const dt = 10000;

export default class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      simulationEnd: false,
      spikes: {simulation_times: [], gids: []},
      simulationTimeInfo: {current: 0, end: 0, start: 0},
      figure: {},
    };
  }

  componentDidMount() {
    this.clearIntervalAll()
    this.simulationTimeInfoTimerID = setInterval(() => this.fetchSimulationTimeInfo(), 333)
    this.spikesTimerID = setInterval(() => this.fetchSpikes(), 10)
  }

  componentWillUnmount() {
    this.clearIntervalAll()
  }

  clearIntervalAll() {
    if (this.simulationTimeInfoTimerID) clearInterval(this.simulationTimeInfoTimerID);
    if (this.spikesTimerID) clearInterval(this.spikesTimerID);
  }

  fetchSimulationTimeInfo() {
    const url = this.props.url;
    get(url + '/simulation_time_info')
      .then(
        (simulationTimeInfo) => {
          const simulationEnd = simulationTimeInfo.current !== 0 && simulationTimeInfo.current === this.state.simulationTimeInfo.current;
          this.setState({
            isLoaded: true,
            simulationEnd: simulationEnd,
            simulationTimeInfo: simulationTimeInfo
          });
        },
        (error) => {
          this.setState({
            isLoaded: false,
            simulationEnd: false,
            spikes: {times: [], senders: []},
            simulationTimeInfo: {current: 0, end: 0, start: 0},
            error,
          });
        }
      )
  }

  fetchSpikes(force=false) {
    if (!force && this.state.simulationEnd) return
    let url = this.props.url + '/spikes';
    if (this.state.figure.hasOwnProperty('layout')) {
      const args = [
        'from='+ this.state.figure.layout.xaxis.range[0] * dt,
        'to='+ this.state.figure.layout.xaxis.range[1] * dt
      ]
      url += '?' + args.join('&')
    }
    get(url)
      .then(
        (spikes) => {
          this.setState({
            spikes: {
              times: spikes.simulation_times.map(d => d/dt),
              senders: spikes.gids
            }
          });
        },
        (error) => {
          // console.log(error)
        }
      )
  }

  handleRelayout(layout) {
    this.setState({figure: {
        layout: layout
      }
    })
    if (this.state.simulationEnd) {
      this.fetchSpikes(true)
    }
  }

  render() {
    const {
      isLoaded,
      spikes,
      simulationTimeInfo,
      simulationEnd
    } = this.state;
    if (!isLoaded) {
      return (
        <div style = {{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 100 + 'vh'
          }} >
          <CircularProgress / >
        </div>
      )
    } else {
      return (
        <div>
          <SpikePlot spikes={spikes} onRelayout={(layout) => this.handleRelayout(layout)}/>
          <div style={{position:'absolute', bottom:8, left: 8, textAlign: 'left', zIndex: 10}}>
            Simulation current time: {(simulationTimeInfo.current/dt).toFixed(2)}s <span>{simulationEnd ? '(ended)' : ''}</span>
          </div>
        </div>
      )
    }
  }

}
