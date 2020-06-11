import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';


enum State {
  Stopped,
  SetupInitited,
  Running
}

@Component({
  selector: 'app-insite-nest-plot',
  templateUrl: './insite-nest-plot.component.html',
  styleUrls: ['./insite-nest-plot.component.css']
})
export class InsiteNestPlotComponent implements OnInit {
  // Visualization
  public graph: any;
  public from: number = 0;
  public to: number = 1000;

  // User options
  public updating: boolean = false;
  public following: boolean = false;
  public url: string;

  // Internal
  public state = State.Stopped;
  public currentTime: number;
  public populationIds: number[] = [];
  public populationSpikes: any;
  public graphData: any[] = [];
  private intervalId: any

  constructor(
    private http: HttpClient,
  ) { }

  ngOnInit() {
    this.url = 'http://' + (window.location['hostname'] ? window.location['hostname'] : 'localhost');

    this.graph = {
      layout: {
        width: 800,
        height: 600,
        xaxis: { range: [this.from, this.to] },
        yaxis: { fixedrange: true },
        showlegend: false,
      },
      config: {
        scrollZoom: true,
      }
    };
    if (this.updating) {
      this.init();
    }
  }

  init() {
    console.log('Init');
    this.intervalId = setInterval(() => this.update(), 100);
  }

  destroy() {
    clearInterval(this.intervalId);
  }

  reset() {
    if (this.state !== State.Stopped) {
      console.log('Reset');
      this.state = State.Stopped;
      this.currentTime = undefined;
      this.populationIds = [];
      this.graphData = [];
      this.graph.data = [];
    }
  }

  update() {
    this.http.get(this.url + ':8080/nest/simulation_time_info').subscribe(res => {
      if (res.hasOwnProperty('current')) {
        const newTime = parseFloat(res['current'].toFixed(1));
        if (newTime < this.currentTime) {
          console.log('Simulation has appearently restarted');
          this.reset();
        }
        if (this.state !== State.Running) {
          this.setupSimulation();
        } else {
          // console.log('Update');
          this.querySpikes(this.currentTime || 0, newTime);
          this.currentTime = newTime;
          if (this.following) {
            this.follow()
          }
        }
      }
    }, error => {
      console.error('Simulation time request failed!');
      this.reset();
    });
  }

  setupSimulation() {
    if (this.state !== State.Stopped) {
      return;
    }

    console.log('Setup');
    this.state = State.SetupInitited;
    this.http.get(`${this.url}:8080/nest/populations`).subscribe(populationIds => {
      this.populationIds = populationIds as number[];
      if (this.populationIds.length === 0) {
        this.reset();
        return
      }

      for (const x of this.populationIds) {
        this.graphData.push({ x: [], y: [], type: 'scattergl', mode: 'markers', hoverinfo: 'none' });
      }
      this.graph.data = this.graphData;
      this.state = State.Running;
      console.log('Setup Complete!');
    }, error => {
      this.reset();
    });
  }

  querySpikes(from: number, to: number) {
    if (this.state !== State.Running) {
      throw new Error('this method should only be called when running');
    }
    if (from < to) {
      for (const populationId of this.populationIds) {
        // console.log(`Requesting ${from} to ${to} for ${populationId}`);
        const populationIndex = this.populationIds.indexOf(populationId);
        this.http.get(this.url + ":8080/nest/population/$" + populationId + "/spikes?from=" + from + '&to=' + to ).subscribe(spikes => {
          // console.log(`${this.url}:8080/nest/population/$${populationId}/spikes`);
          const simulationTimes = spikes['simulation_times'] as number[];
          const gids = spikes['gids'] as number[];
          this.graphData[populationIndex].x = simulationTimes;
          this.graphData[populationIndex].y = gids;
          this.graph.data[populationIndex] = this.graphData[populationIndex];
        }, error => {
          console.error(`Spike request failed: ${error}`);
          this.reset();
        });
      }
    }
  }

  onUpdateClick() {
    setTimeout(() => this.updating ? this.init() : this.destroy(), 1)
  }

  follow() {
    this.graph.layout.xaxis.range = [this.currentTime - 100, this.currentTime]
  }

  onMouseDown(event) {
    this.following = false;
  }

  onRelayout(event) {
    // if (event.hasOwnProperty('xaxis.range[0]')) {
    //   this.from = parseInt(event['xaxis.range[0]']);
    //   this.to = parseInt(event['xaxis.range[1]']);
    //   if (this.updating && !this.running) {
    //     this.update()
    //   }
    // }
  }


}
