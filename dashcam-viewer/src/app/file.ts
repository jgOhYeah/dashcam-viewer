/**
 * Represents a file stored on the dashcam.
 */
export class File {
    basename: string | undefined;
    path: string | undefined;

    get url() {
        return `${this.path}${this.path?.endsWith('/') ? '' : '/'}${this.basename}`;
    }

    get id() {
        return this.basename?.slice(0, this.basename.length - 4);
    }
}

export class VideoFile extends File {
    get isSnapshot() {
        return this.path?.includes('101video');
    }

    thumbnail: File | undefined;
}