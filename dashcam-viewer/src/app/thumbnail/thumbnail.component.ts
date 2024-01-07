import { Component } from '@angular/core';
import { File } from '../file';

@Component({
  selector: 'app-thumbnail',
  standalone: true,
  imports: [],
  templateUrl: './thumbnail.component.html',
  styleUrl: './thumbnail.component.scss'
})
export class ThumbnailComponent {
  // file: File = {
  //   basename: "20230929122604_10.MP4",
  //   path: "DCIM/101video/",
  //   thumbnail: {
  //     basename: "20230929122604.JPG",
  //     path: "DCIM/105thumb/"
  //   }
  // }
  file: File = new File(
    "20230929122604_10.MP4",
    "DCIM/101video/",
    new File(
      "20230929122604.JPG", "DCIM/105thumb/"
    ))
}
