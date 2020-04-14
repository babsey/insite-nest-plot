import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

import SpikePlot from './SpikePlot';

export interface Props {
  url: string,
}

enum ServerState {
  Stopped,
  SetupInitited,
  Running
}

interface State {
  error: any,
  figure: any,
  serverState: ServerState,
  currentTime: number,
  populationIds: number[],
  graphData: any[],
  timerID?: any,
}

export default class SpikeStreaming extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      error: null,
      figure: {},
      serverState: ServerState.Stopped,
      currentTime: 0,
      populationIds: [],
      graphData: [],
    };
  }

  componentDidMount() {
    const timerID = setInterval(() => this.update(), 1000);
    this.setState({
      timerID: timerID
    })
  }

  componentWillUnmount() {
    if (this.state.timerID) clearInterval(this.state.timerID);
  }

  reset() {
    if (this.state.serverState !== ServerState.Stopped) {
      this.setState({
        serverState: ServerState.Stopped,
        currentTime: 0,
        populationIds: [],
        graphData: []
      })
    }
  }

  update() {
    const url = this.props.url + ':8080/nest/simulation_time_info';
    fetch(url).then(res => res.json(), error => {
        this.reset()
      })
      .then(res => {
          if (!res) return
          if (res.hasOwnProperty('current')) {
            const newTime = res['current'];
            if (newTime < this.state.currentTime) {
              console.log('Simulation has appearently restarted.')
              this.reset()
            }
            if (this.state.serverState !== ServerState.Running) {
              this.setupSimulation()
            } else {
              console.log('Update')
              this.querySpikes(this.state.currentTime || 0, newTime)
              this.setState({
                currentTime: newTime,
              })
            }
          }
        }, error => {
          if (this.state.serverState !== ServerState.Stopped) {
            return;
          }
        })
  }

  setupSimulation() {
    if (this.state.serverState !== ServerState.Stopped) {
      return;
    }
    console.log('Setup')
    this.setState({
      serverState: ServerState.SetupInitited
    })
    let url = this.props.url + ':8080/nest/populations';
    fetch(url).then(res => res.json(), error => {
        this.reset()
      })
      .then(populationIds => {
        this.setState({
          populationIds: populationIds as number[],
        })
        var { graphData } = this.state;
        populationIds.forEach(() => {
          graphData.push({x: [], y: [], type: 'scattergl', mode: 'markers', hoverinfo: 'none'})
        })
        this.setState({
          serverState: ServerState.Running
        })
        console.log('Setup complete!')
      }, error => {
        this.reset()
      });
  }

  querySpikes(from: number, to: number) {
    if (this.state.serverState !== ServerState.Running) {
      throw new Error('This method should only be called when running.');
    }
    if (from < to) {
      for (const populationId of this.state.populationIds) {
        console.log(`Requesting ${from} to ${to} for ${populationId}.`);
        const url = this.props.url + `:8080/nest/population/${populationId}/spikes`;
        fetch(url).then(res => res.json(), error => {
            this.reset()
          })
          .then(spikes => {
            if (!spikes.hasOwnProperty('simulation_times')) return;
            const simulationTimes = spikes['simulation_times'] as number[];
            console.log(simulationTimes)
            const gids = spikes['gids'] as number[];
            const { populationIds, graphData } = this.state;
            const populationIndex = populationIds.indexOf(populationId);
            simulationTimes.forEach((simulationTime: number, i: number) => {
              graphData[populationIndex].x.push(simulationTime)
              graphData[populationIndex].y.push(gids[i])
            })
          }, error => {
            console.log(`Spike request failed: ${error}`)
            this.reset();
          })
      }
    }
  }

  handleRelayout(layout: any) {
    this.setState({figure: {
        layout: layout
      }
    })
  }

  render() {
    const {
      currentTime,
      graphData,
      serverState
    } = this.state;
    if (serverState !== ServerState.Running) {
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
          <SpikePlot data={graphData} onRelayout={(layout: any) => this.handleRelayout(layout)}/>
          <div style={{position:'absolute', bottom:8, left: 8, textAlign: 'left', zIndex: 10}}>
            Simulation current time: {currentTime} <span>{serverState === ServerState.Running ? '(running)' : ''}</span>
          </div>
        </div>
      )
    }
  }

}
