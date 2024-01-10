import { Component, Input } from '@angular/core';
import { Config, TopLevelSpec, compile } from 'vega-lite';
import { LayerSpec, NonNormalizedSpec } from 'vega-lite/build/src/spec';
import embed from 'vega-embed';
import { LoaderService } from '../loader.service';
import { GPSDataset, GPSRecord, haversineDist } from '../gps';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent {
  @Input() startDate: Date | undefined;
  @Input() endDate: Date | undefined;
  @Input() simplifyPoints: number | undefined;
  @Input() showGraphs: boolean = true;

  distance?: string;
  gpsDataPresent: boolean = false;

  constructor(private loader: LoaderService) { }

  ngOnInit() {
    this.loader.getGPSSubject().subscribe(async gps => {
      // Filter GPS data if required.
      let gpsFiltered: GPSRecord[];
      // Saving in const to keep typescript happy about possibly undefined.
      const start = this.startDate;
      const end = this.endDate;
      if (start && end) {
        gpsFiltered = gps.filterDates(start, end);
      } else {
        gpsFiltered = gps.data;
      }

      if (gpsFiltered.length) {
        // Enable the graph
        this.gpsDataPresent = true;
      }

      // Simplify to reduce the points if required:
      const filteredDataset = (new GPSDataset(gpsFiltered));
      let simpleDataset: GPSDataset;
      if (this.simplifyPoints) {
        const timeStep = (filteredDataset.duration - filteredDataset.idleTime) / this.simplifyPoints;
        console.log(`Simplifying points to timestep ${timeStep}`);
        simpleDataset = new GPSDataset(filteredDataset.simplify(timeStep));
        console.log(`Simplified to ${simpleDataset.length} points.`);
      } else {
        simpleDataset = filteredDataset;
      }

      // Set the distance.
      this.distance = simpleDataset.calculateDistance(haversineDist).toFixed(1);

      // Map specification
      const mapSpec: NonNormalizedSpec = {
        layer: [
          // {
          //   // World map
          //   data: {
          //     name: 'world',
          //     // url: 'https://raw.githubusercontent.com/vega/vega/main/packages/vega-loader/test/data/world-110m.json',
          //     url: 'https://jgohyeah.github.io/FIT3179/Assignment2/data/VictoriaAll.json',
          //     format: {
          //       type: 'topojson',
          //       // feature: 'countries'
          //       feature: 'Victoria'
          //     }
          //   },
          //   mark: {
          //     type: 'geoshape',
          //     color: 'grey'
          //   },
          // },
          {
            // GPS Lines
            mark: {
              type: 'line',
              color: 'red'
            },
            encoding: {
              latitude: { field: 'latitude' },
              longitude: { field: 'longitude' }
            }
          }
        ],
        width: 'container',
        height: 500
      };

      const speedSpec: NonNormalizedSpec = {
        mark: {
          type: 'line'
        },
        encoding: {
          x: {
            field: 'date',
            type: 'temporal'
          },
          y: {
            field: 'speed',
            type: 'quantitative'
          }
        },
        width: 'container',
        height: 200
      };

      const elevationSpec: NonNormalizedSpec = {
        mark: {
          type: 'line',
        },
        encoding: {
          x: {
            field: 'date',
            type: 'temporal'
          },
          y: {
            field: 'elevation',
            type: 'quantitative'
          },
        },
        width: 'container',
        height: 200
      };

      const elementsList = this.showGraphs ? [mapSpec, speedSpec, elevationSpec] : [mapSpec];

      const vegaLiteSpec: TopLevelSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        autosize: {
          contains: 'padding'
        },
        data: { values: simpleDataset.data },
        vconcat: elementsList
      };

      const config: Config = {
        projection: {
          type: 'mercator',
          // 'clipExtent': [[]]

        }
      };

      // Draw the map.
      const vegaSpec = compile(vegaLiteSpec, { config }).spec;
      await embed("figure#vega-map", vegaSpec);
    });
  }
}
