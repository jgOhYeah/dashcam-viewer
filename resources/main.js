// function loadThumnails() {

// }

/**
 * Gets a list of dirctories containing various parts.
 * @param {function} callback 
 */
function getFilesList(path, callback) {
    let client = new XMLHttpRequest();
    client.open('GET', path);
    client.onload = function () {
        callback(responseToArray(path, client.response));
    }
    client.send();
}

/**
 * Converts the response containing an automated directory listing to an array of strings.
 * @param {string} linksResponse 
 * @returns Array of strings representing files.
 */
function responseToArray(path, linksResponse) {
    // console.log(linksResponse);
    const parser = new DOMParser();
    const doc = parser.parseFromString(linksResponse, 'text/html');
    const linksArr = [].slice.call(doc.getElementsByTagName('a'));
    const files = linksArr.map(link => {
        return {
            basename: link.attributes[0].value,
            path: path
        };
    }).filter(file => file.basename != '..');
    return files;
}

/**
 * Checks if the folder contains video files based on its name alone.
 * @param {string} folder 
 */
function isVideoFolder(folder) {
    return folder.basename.includes('video');
}

/**
 * Checks if the folder contains thumbnail files based on its name alone.
 * @param {string} folder 
 */
function isThumbnailFolder(folder) {
    return folder.basename.includes('thumb');
}

/**
 * Checks if the folder contains thumbnail files based on its name alone.
 * @param {string} folder 
 */
function isImageFolder(folder) {
    return folder.basename.includes('snap');
}

/**
 * Requests a list of all files and calls a callback with this list.
 * @param {function} callback 
 * @returns 
 */
async function compileFileList(files, filter, callback) {
    // Get a list of each video
    const videos = files.filter(filter);
    const videoLists = videos.map(async file => {
        const promise = new Promise((resolve, _reject) => getFilesList(`DCIM/${file.basename}`, resolve));
        return promise;
    });

    // Merge all lists together
    let result = [];
    for (let i in videoLists) {
        result = result.concat(await videoLists[i]);
    }

    // Sort to be predictable
    result = result.sort((a, b) => a.basename.localeCompare(b.basename));

    // Done
    callback(result);
}

/**
 * Returns a promise for getting a list of files in a folder.
 */
function fileListPromise(folders, filter) {
    return new Promise((resolve, _reject) => compileFileList(folders, filter, resolve));
}

/**
 * Collates all video thumbnails.
 */
function collateVideosThumbnails() {
    getFilesList('DCIM.html', async folders => {
        const thumbnailPromise = fileListPromise(folders, isThumbnailFolder);
        const videoPromise = fileListPromise(folders, isVideoFolder);

        const thumbnails = await thumbnailPromise;
        const videos = await videoPromise;
        console.log(videos);
        console.log(thumbnails);
    });
}

collateVideosThumbnails();