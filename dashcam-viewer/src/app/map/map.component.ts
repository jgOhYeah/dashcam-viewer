import { Component, Input } from '@angular/core';
import { Config, TopLevelSpec, compile } from 'vega-lite';
import embed from 'vega-embed';
import { LoaderService } from '../loader.service';
import { GPSFile, GPSRecord } from '../file';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent {
  @Input() startDate: Date | undefined;
  @Input() endDate: Date | undefined;

  constructor(private loader: LoaderService) { }

  ngOnInit() {
    this.loader.getGPSSubject().subscribe(async gps => {
      // Filter GPS data if required.
      let gpsFiltered:GPSRecord[];
      // Saving in const to keep typescript happy about possibly undefined.
      const start = this.startDate;
      const end = this.endDate;
      if (start && end) {
        gpsFiltered = gps.filter(record => record.date >= start && record.date <= end);
      } else {
        gpsFiltered = gps;
      }

      // Map specification
      const vegaLiteSpec: TopLevelSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
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
            data: { values: gpsFiltered },
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
        width: "container",
        height: 600
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
