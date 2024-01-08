import { Component, Input } from '@angular/core';
import { File } from '../file';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-thumbnail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './thumbnail.component.html',
  styleUrl: './thumbnail.component.scss'
})
export class ThumbnailComponent {
  @Input() file!: File;
}
