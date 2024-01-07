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

/** For each video, attempts to find a matching thumbnail and add it to the object. */
function pairVideoThumbnails(videos, thumbnails) {
    function extractId(fname) {
        return fname.slice(0, 14);

    }
    for (let vid in videos) {
        const id = extractId(videos[vid].basename);
        videos[vid].thumbnail = thumbnails.find(thumbFile => extractId(thumbFile.basename) == id);
    }
    return videos;
}

/**
 * Collates all video thumbnails.
 */
function collateVideosThumbnails() {
    getFilesList('DCIM', async folders => {
        const thumbnailPromise = fileListPromise(folders, isThumbnailFolder);
        const videoPromise = fileListPromise(folders, isVideoFolder);

        const thumbnails = await thumbnailPromise;
        const videos = await videoPromise;
        console.log(videos);
        console.log(thumbnails);
        pairVideoThumbnails(videos, thumbnails);
    });
}

function displayTumbnail(file) {
    // Get the template and parent
    const template = document.getElementById('video-template');
    const parent = document.getElementById('all-videos');
    const newNode = template.cloneNode(true);

    // Set the thumbnail
    if (file.thumbnail) {
        const thumbnail = newNode.getElementsByClassName("video-thumbnail")[0];
        thumbnail.src = `${file.thumbnail.path}/${file.thumbnail.basename}`;
    }

    // Set the title
    const title = newNode.getElementsByClassName("video-name")[0];
    // title.innerHTML = file.basename;
    console.log(file.basename);

    // Display
    parent.appendChild(newNode);
}

collateVideosThumbnails();

displayTumbnail({ basename: "20240106151330.JPG", path: "DCIM/103thumb/" });