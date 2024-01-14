import { Component, Input } from '@angular/core';
import { GPSDataset } from '../gps';
import { LoaderService } from '../loader.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gpx',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gpx.component.html',
  styleUrl: './gpx.component.scss'
})
export class GpxComponent {
  @Input() startDate: Date | undefined;
  @Input() endDate: Date | undefined;
  @Input() name: string = "Dashcam_GPX.gpx";
  @Input() fullWidth: boolean = false;
  @Input() buttonLabel: string = "Download GPX file";

  constructor(private loader: LoaderService) { }

  gps: GPSDataset = new GPSDataset([]);

  ngOnInit() {
    // Load and filter data to see if we have enough points in this time frame.
    this.loader.getGPSSubject().subscribe(gps => {
      this.gps = new GPSDataset(gps.filterDates(this.startDate, this.endDate));
    });
  }

  async downloadGPX() {
    let gpxStr: string = '';
    if (this.gps.length) {
      // We have GPS data.
      const gpxDoc = this.gps.gpxFormat();
      gpxStr = this.serialiseXML(gpxDoc);
    }

    this.downloadFile(this.name, gpxStr);
  }

  private serialiseXML(rootNode: Node): string {
    const serialiser = new XMLSerializer();
    return serialiser.serializeToString(rootNode);
  }

  private downloadFile(name: string, contents: string) {
    console.log("About to download file");
    // Get ready to download
    const uri = 'data:Application/octet-stream,' + encodeURIComponent(contents);
    const downloadLink = document.createElement('a');
    downloadLink.href = uri;
    downloadLink.download = name;

    // Download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
}
