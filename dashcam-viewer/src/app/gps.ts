import { compactToDate } from './file';

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
        this.localeDate = this.date.toLocaleDateString();

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
    localeDate:string;

    setElevation(value: string) {
        this.elevation = parseFloat(value);
    }
}

export class GPSDataset {
    constructor(public data: GPSRecord[]) { };

    filter = this.data.filter;

    /**
     * Filters the data and returns an array containing only the records between these dates.
     */
    filterDates(start: Date, end: Date): GPSRecord[] {
        return this.data.filter(record => record.date >= start && record.date <= end);
    }

    /**
     * Removes all points that are within the given distance from the previous.
     */
    simplify(timeStep: number): GPSRecord[] {
        const result: GPSRecord[] = [this.data[0]];
        for (let i = 1; i < this.data.length; i++) {
            if (this.data[i].date.valueOf() - result[result.length - 1].date.valueOf() > timeStep) {
                result.push(this.data[i]);
            }
        }
        return result;
    }

    /**
     * Calculates the total distance of the GPS track in km.
     */
    calculateDistance(method: (point1: GPSRecord, point2: GPSRecord) => number): number {
        if (this.data.length > 1) {
            return this.data.reduce(
                (total: number, point: GPSRecord, index, array) => {
                    const segmentDist = method(point, array[index ? index - 1 : 0]);
                    return total + segmentDist;
                },
                0
            );
        } else {
            return 0;
        }
    }

    /**
     * Returns the time between the first and last points in ms.
     */
    get duration(): number {
        if (this.length) {
            return this.data[this.length - 1].date.valueOf() - this.data[0].date.valueOf();
        } else {
            return 0;
        }
    }

    /**
     * Sums the time gaps in the records.
     */
    get idleTime(): number {
        let idle = 0;
        const threshold = 60000; // 1 minute
        if (this.length > 1) {
            for (let i = 1; i < this.length; i++) {
                const difference = this.data[i].date.valueOf() - this.data[i-1].date.valueOf();
                if (difference > threshold) {
                    idle += difference;
                }
            }
        }
        return idle;
    }

    length = this.data.length;

}

function toRad(degrees: number): number {
    return degrees * Math.PI / 180;
}

/**
 * Calculates the distance between two points in km.
 * @param point1 The first point
 * @param point2 The second point
 * @returns The distance between the points according to the haversine formula.
 */
export function haversineDist(point1: GPSRecord, point2: GPSRecord): number {
    const earthRadius = 6371;
    const latChangeRad = toRad(point2.latitude - point1.latitude);
    const lonChangeRad = toRad(point2.longitude - point1.longitude);

    const a = Math.pow(Math.sin(latChangeRad / 2), 2) +
        Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) *
        Math.pow(Math.sin(lonChangeRad / 2), 2);
    const angularDistance = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = earthRadius * angularDistance; // In km
    return distance;
}

/**
 * Slightly less accurate than the haversine, but should be faster.
 */
export function pythagorasDist(point1: GPSRecord, point2: GPSRecord): number {
    const earthRadius = 6371;
    const latChangeRad = toRad(point2.latitude - point1.latitude);
    const lonChangeRad = toRad(point2.longitude - point1.longitude);

    const x = lonChangeRad * Math.cos(latChangeRad / 2);
    const y = latChangeRad;
    const distance = earthRadius * Math.sqrt(x * x + y * y);
    return distance;
}