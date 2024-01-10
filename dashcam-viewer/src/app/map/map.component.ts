import { Component, Input } from '@angular/core';
import { Config, TopLevelSpec, compile } from 'vega-lite';
import { NonNormalizedSpec } from 'vega-lite/build/src/spec';
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
      if (gps.length) {
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
          // Enable the graph and keep going
          this.gpsDataPresent = true;

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

          const speedTitle: string = 'Speed (km/h)';
          const speedFormat: string = '.2f';
          const elevationTitle: string = 'Elevation (m)';

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
                  tooltip: true
                },
                encoding: {
                  latitude: { field: 'latitude' },
                  longitude: { field: 'longitude' },
                  color: simpleDataset.duration > 3600000 * 24 ? {
                    field: 'localeDate',
                    title: 'Date'
                  } : undefined,
                  tooltip: [
                    {
                      field: 'localeDate',
                      title: 'Date'
                    },
                    {
                      field: 'speed',
                      title: speedTitle,
                      format: speedFormat
                    },
                    {
                      field: 'elevation',
                      title: elevationTitle
                    }
                  ]
                }
              }
            ],
            width: 'container',
            height: 500
          };

          const speedSpec: NonNormalizedSpec = {
            mark: {
              type: 'line',
              tooltip: true
            },
            encoding: {
              x: {
                field: 'date',
                type: 'temporal',
                title: 'Time'
              },
              y: {
                field: 'speed',
                type: 'quantitative',
                title: speedTitle
              },
              tooltip: [
                {
                  field: 'speed',
                  title: speedTitle,
                  format: speedFormat
                }
              ]
            },
            width: 'container',
            height: 200
          };

          const elevationSpec: NonNormalizedSpec = {
            mark: {
              type: 'line',
              tooltip: true
            },
            encoding: {
              x: {
                field: 'date',
                type: 'temporal',
                title: 'Time'
              },
              y: {
                field: 'elevation',
                type: 'quantitative',
                title: elevationTitle
              },
              tooltip: [
                {
                  field: 'elevation',
                  title: elevationTitle
                }
              ]
            },
            width: 'container',
            height: 200
          };

          const elementsList = this.showGraphs ? [mapSpec, speedSpec, elevationSpec] : [mapSpec];

          const vegaLiteSpec: TopLevelSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            autosize: {
              contains: 'content'
            },
            data: { values: simpleDataset.data },
            vconcat: elementsList
          };

          const config: Config = {
            projection: {
              type: 'mercator',
              // 'clipExtent': [[]]

            },
            legend: {
              orient: 'top-right'
            }
          }

          // Draw the map.
          const vegaSpec = compile(vegaLiteSpec, { config }).spec;
          await embed("figure#vega-map", vegaSpec);
        }
      } else {
        console.log("No GPS data loaded yet.");
      }
    });
  }
}
