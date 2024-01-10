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

    /**
     * Returns a date representing the start of the video recording.
     */
    get startDate(): Date {
        return this.basename ? compactToDate(this.basename.split('_')[0]) : new Date();
    }

    /**
     * Returns the number of seconds in the video
     */
    get duration(): number {
        return this.basename ? parseInt(this.basename.split('_')[1]) : 0;
    }

    /**
     * Returns the date that the recording finishes.
     */
    get endDate(): Date {
        return new Date(this.startDate.valueOf() + (this.duration * 1000));
    }
}

export class GPSFile extends File {
    records: GPSRecord[] = [];
    /**
     * Downloads the GPS file contents and processes it.
     */
    load(callback: (records: GPSRecord[]) => void) {
        let client = new XMLHttpRequest();
        client.open('GET', this.url);
        client.onload = () => {
            // Data file has been downloaded.
            this.parseData(client.responseText);
            callback(this.records);
        }
        client.send();
    }

    private parseData(data: string) {
        const lines = data.split('\n');
        for (let i in lines) {
            // For each row, get the current line.
            const clean = lines[i].trim();
            const fields = clean.split(',');
            if (fields.length == 6 || fields.length == 7) {
                // A correct row. Add it.
                const record = new GPSRecord(
                    fields[0],
                    fields[1],
                    fields[2],
                    fields[3],
                    fields[4],
                    fields[5]
                );
                // Add the elevation if included
                if (fields.length == 7) {
                    record.setElevation(fields[6]);
                }
                this.records.push(record);
            }
        }
    }

}

export class GPSRecord {
    constructor(
        datetime: string,
        latValue: string,
        latDir: string,
        lonValue: string,
        lonDir: string,
        speed: string,
        elevation?: string
    ) {
        this.date = compactToDate(datetime);

        // Convert degrees decimal minutes to decimal degrees.
        function minutesToDegrees(latLon: string): number {
            const decimalLocation = latLon.indexOf('.');
            const degrees = parseInt(latLon.slice(0, decimalLocation - 2));
            const minutes = parseFloat(latLon.slice(decimalLocation - 2));
            return degrees + (minutes / 60);
        }

        // Latitude and longitude.
        this.latitude = minutesToDegrees(latValue) * (latDir == 'S' ? -1 : 1);
        this.longitude = minutesToDegrees(lonValue) * (lonDir == 'E' ? 1 : -1);

        // Set the speed
        this.speed = parseFloat(speed) * 1.852; // knots to km/h.

        // Set the elevation
        if (elevation) {
            this.setElevation(elevation);
        }
    }

    date: Date;
    latitude: number;
    longitude: number;
    speed: number;
    elevation?: number;

    setElevation(value: string) {
        this.elevation = parseFloat(value);
    }
}

/**
 * Converts a compact string representation to a date.
 * @param dateStr the input YYYYMMDDHHMMSS string
 * @returns javascript date.
 */
function compactToDate(dateStr: string): Date {
    const newFormat = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T${dateStr.slice(8, 10)}:${dateStr.slice(10, 12)}:${dateStr.slice(12, 14)}`;
    return new Date(newFormat);
}