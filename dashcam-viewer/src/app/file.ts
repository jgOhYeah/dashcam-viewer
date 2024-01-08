/**
 * Represents a file stored on the dashcam.
 */
export class File {
    constructor(
        public basename: string,
        public path: string,
        public thumbnail?: File
    ) { }

    get url() {
        return `${this.path}${this.path.endsWith('/') ? '' : '/'}${this.basename}`;
    }

    get isSnapshot() {
        return this.path.includes('101video');
    }
}