import { Readable, Duplex, DuplexOptions } from 'node:stream';
import { WebmHeader } from 'play-audio';
import { EventEmitter } from 'stream';

/**
 * YouTube Live Stream class for playing audio from Live Stream videos.
 */
declare class LiveStream {
    /**
     * Readable Stream through which data passes
     */
    stream: Readable;
    /**
     * Type of audio data that we recieved from live stream youtube url.
     */
    type: StreamType;
    /**
     * Incoming message that we recieve.
     *
     * Storing this is essential.
     * This helps to destroy the TCP connection completely if you stopped player in between the stream
     */
    private request?;
    /**
     * Timer that creates loop from interval time provided.
     */
    private normal_timer?;
    /**
     * Timer used to update dash url so as to avoid 404 errors after long hours of streaming.
     *
     * It updates dash_url every 30 minutes.
     */
    private dash_timer;
    /**
     * Given Dash URL.
     */
    private dash_url;
    /**
     * Base URL in dash manifest file.
     */
    private base_url;
    /**
     * Interval to fetch data again to dash url.
     */
    private interval;
    /**
     * Timer used to update dash url so as to avoid 404 errors after long hours of streaming.
     *
     * It updates dash_url every 30 minutes.
     */
    private video_url;
    /**
     * No of segments of data to add in stream before starting to loop
     */
    private precache;
    /**
     * Segment sequence number
     */
    private sequence;
    /**
     * Live Stream Class Constructor
     * @param dash_url dash manifest URL
     * @param target_interval interval time for fetching dash data again
     * @param video_url Live Stream video url.
     */
    constructor(dash_url: string, interval: number, video_url: string, precache?: number);
    /**
     * This cleans every used variable in class.
     *
     * This is used to prevent re-use of this class and helping garbage collector to collect it.
     */
    private cleanup;
    /**
     * Updates dash url.
     *
     * Used by dash_timer for updating dash_url every 30 minutes.
     */
    private dash_updater;
    /**
     * Initializes dash after getting dash url.
     *
     * Start if it is first time of initialishing dash function.
     */
    private initialize_dash;
    /**
     * Used only after initializing dash function first time.
     * @param len Length of data that you want to
     */
    private first_data;
    /**
     * This loops function in Live Stream Class.
     *
     * Gets next segment and push it.
     */
    private loop;
    /**
     * Deprecated Functions
     */
    pause(): void;
    /**
     * Deprecated Functions
     */
    resume(): void;
}
/**
 * YouTube Stream Class for playing audio from normal videos.
 */
declare class Stream {
    /**
     * Readable Stream through which data passes
     */
    stream: Readable;
    /**
     * Type of audio data that we recieved from normal youtube url.
     */
    type: StreamType;
    /**
     * Audio Endpoint Format Url to get data from.
     */
    private url;
    /**
     * Used to calculate no of bytes data that we have recieved
     */
    private bytes_count;
    /**
     * Calculate per second bytes by using contentLength (Total bytes) / Duration (in seconds)
     */
    private per_sec_bytes;
    /**
     * Total length of audio file in bytes
     */
    private content_length;
    /**
     * YouTube video url. [ Used only for retrying purposes only. ]
     */
    private video_url;
    /**
     * Timer for looping data every 265 seconds.
     */
    private timer;
    /**
     * Quality given by user. [ Used only for retrying purposes only. ]
     */
    private quality;
    /**
     * Incoming message that we recieve.
     *
     * Storing this is essential.
     * This helps to destroy the TCP connection completely if you stopped player in between the stream
     */
    private request;
    /**
     * YouTube Stream Class constructor
     * @param url Audio Endpoint url.
     * @param type Type of Stream
     * @param duration Duration of audio playback [ in seconds ]
     * @param contentLength Total length of Audio file in bytes.
     * @param video_url YouTube video url.
     * @param options Options provided to stream function.
     */
    constructor(url: string, type: StreamType, duration: number, contentLength: number, video_url: string, options: StreamOptions);
    /**
     * Retry if we get 404 or 403 Errors.
     */
    private retry;
    /**
     * This cleans every used variable in class.
     *
     * This is used to prevent re-use of this class and helping garbage collector to collect it.
     */
    private cleanup;
    /**
     * Getting data from audio endpoint url and passing it to stream.
     *
     * If 404 or 403 occurs, it will retry again.
     */
    private loop;
    /**
     * Pauses timer.
     * Stops running of loop.
     *
     * Useful if you don't want to get excess data to be stored in stream.
     */
    pause(): void;
    /**
     * Resumes timer.
     * Starts running of loop.
     */
    resume(): void;
}

declare enum WebmSeekerState {
    READING_HEAD = "READING_HEAD",
    READING_DATA = "READING_DATA"
}
interface WebmSeekerOptions extends DuplexOptions {
    mode?: 'precise' | 'granular';
}
declare class WebmSeeker extends Duplex {
    remaining?: Buffer;
    state: WebmSeekerState;
    chunk?: Buffer;
    cursor: number;
    header: WebmHeader;
    headfound: boolean;
    headerparsed: boolean;
    seekfound: boolean;
    private data_size;
    private offset;
    private data_length;
    private sec;
    private time;
    constructor(sec: number, options: WebmSeekerOptions);
    private get vint_length();
    private vint_value;
    cleanup(): void;
    _read(): void;
    seek(content_length: number): Error | number;
    _write(chunk: Buffer, _: BufferEncoding, callback: (error?: Error | null) => void): void;
    private readHead;
    private readTag;
    private getClosestBlock;
    private parseEbmlID;
    _destroy(error: Error | null, callback: (error: Error | null) => void): void;
    _final(callback: (error?: Error | null) => void): void;
}

/**
 * YouTube Stream Class for seeking audio to a timeStamp.
 */
declare class SeekStream {
    /**
     * WebmSeeker Stream through which data passes
     */
    stream: WebmSeeker;
    /**
     * Type of audio data that we recieved from normal youtube url.
     */
    type: StreamType;
    /**
     * Audio Endpoint Format Url to get data from.
     */
    private url;
    /**
     * Used to calculate no of bytes data that we have recieved
     */
    private bytes_count;
    /**
     * Calculate per second bytes by using contentLength (Total bytes) / Duration (in seconds)
     */
    private per_sec_bytes;
    /**
     * Length of the header in bytes
     */
    private header_length;
    /**
     * Total length of audio file in bytes
     */
    private content_length;
    /**
     * YouTube video url. [ Used only for retrying purposes only. ]
     */
    private video_url;
    /**
     * Timer for looping data every 265 seconds.
     */
    private timer;
    /**
     * Quality given by user. [ Used only for retrying purposes only. ]
     */
    private quality;
    /**
     * Incoming message that we recieve.
     *
     * Storing this is essential.
     * This helps to destroy the TCP connection completely if you stopped player in between the stream
     */
    private request;
    /**
     * YouTube Stream Class constructor
     * @param url Audio Endpoint url.
     * @param type Type of Stream
     * @param duration Duration of audio playback [ in seconds ]
     * @param headerLength Length of the header in bytes.
     * @param contentLength Total length of Audio file in bytes.
     * @param bitrate Bitrate provided by YouTube.
     * @param video_url YouTube video url.
     * @param options Options provided to stream function.
     */
    constructor(url: string, duration: number, headerLength: number, contentLength: number, bitrate: number, video_url: string, options: StreamOptions);
    /**
     * **INTERNAL Function**
     *
     * Uses stream functions to parse Webm Head and gets Offset byte to seek to.
     * @returns Nothing
     */
    private seek;
    /**
     * Retry if we get 404 or 403 Errors.
     */
    private retry;
    /**
     * This cleans every used variable in class.
     *
     * This is used to prevent re-use of this class and helping garbage collector to collect it.
     */
    private cleanup;
    /**
     * Getting data from audio endpoint url and passing it to stream.
     *
     * If 404 or 403 occurs, it will retry again.
     */
    private loop;
    /**
     * Pauses timer.
     * Stops running of loop.
     *
     * Useful if you don't want to get excess data to be stored in stream.
     */
    pause(): void;
    /**
     * Resumes timer.
     * Starts running of loop.
     */
    resume(): void;
}

interface ChannelIconInterface {
    /**
     * YouTube Channel Icon URL
     */
    url: string;
    /**
     * YouTube Channel Icon Width
     */
    width: number;
    /**
     * YouTube Channel Icon Height
     */
    height: number;
}
/**
 * YouTube Channel Class
 */
declare class YouTubeChannel {
    /**
     * YouTube Channel Title
     */
    name?: string;
    /**
     * YouTube Channel Verified status.
     */
    verified?: boolean;
    /**
     * YouTube Channel artist if any.
     */
    artist?: boolean;
    /**
     * YouTube Channel ID.
     */
    id?: string;
    /**
     * YouTube Class type. == "channel"
     */
    type: 'video' | 'playlist' | 'channel';
    /**
     * YouTube Channel Url
     */
    url?: string;
    /**
     * YouTube Channel Icons data.
     */
    icons?: ChannelIconInterface[];
    /**
     * YouTube Channel subscribers count.
     */
    subscribers?: string;
    /**
     * YouTube Channel Constructor
     * @param data YouTube Channel data that we recieve from basic info or from search
     */
    constructor(data?: any);
    /**
     * Returns channel icon url
     * @param {object} options Icon options
     * @param {number} [options.size=0] Icon size. **Default is 0**
     */
    iconURL(options?: {
        size: number;
    }): string | undefined;
    /**
     * Converts Channel Class to channel name.
     * @returns name of channel
     */
    toString(): string;
    /**
     * Converts Channel Class to JSON format
     * @returns json data of the channel
     */
    toJSON(): ChannelJSON;
}
interface ChannelJSON {
    /**
     * YouTube Channel Title
     */
    name?: string;
    /**
     * YouTube Channel Verified status.
     */
    verified?: boolean;
    /**
     * YouTube Channel artist if any.
     */
    artist?: boolean;
    /**
     * YouTube Channel ID.
     */
    id?: string;
    /**
     * Type of Class [ Channel ]
     */
    type: 'video' | 'playlist' | 'channel';
    /**
     * YouTube Channel Url
     */
    url?: string;
    /**
     * YouTube Channel Icon data.
     */
    icons?: ChannelIconInterface[];
    /**
     * YouTube Channel subscribers count.
     */
    subscribers?: string;
}

declare class YouTubeThumbnail {
    url: string;
    width: number;
    height: number;
    constructor(data: any);
    toJSON(): {
        url: string;
        width: number;
        height: number;
    };
}

/**
 * Licensed music in the video
 *
 * The property names change depending on your region's language.
 */
interface VideoMusic {
    song?: string;
    url?: string | null;
    artist?: string;
    album?: string;
    writers?: string;
    licenses?: string;
}
interface VideoOptions {
    /**
     * YouTube Video ID
     */
    id?: string;
    /**
     * YouTube video url
     */
    url: string;
    /**
     * YouTube Video title
     */
    title?: string;
    /**
     * YouTube Video description.
     */
    description?: string;
    /**
     * YouTube Video Duration Formatted
     */
    durationRaw: string;
    /**
     * YouTube Video Duration in seconds
     */
    durationInSec: number;
    /**
     * YouTube Video Uploaded Date
     */
    uploadedAt?: string;
    /**
     * If the video is upcoming or a premiere that isn't currently live, this will contain the premiere date, for watch page playlists this will be true, it defaults to undefined
     */
    upcoming?: Date | true;
    /**
     * YouTube Views
     */
    views: number;
    /**
     * YouTube Thumbnail Data
     */
    thumbnail?: {
        width: number | undefined;
        height: number | undefined;
        url: string | undefined;
    };
    /**
     * YouTube Video's uploader Channel Data
     */
    channel?: YouTubeChannel;
    /**
     * YouTube Video's likes
     */
    likes: number;
    /**
     * YouTube Video live status
     */
    live: boolean;
    /**
     * YouTube Video private status
     */
    private: boolean;
    /**
     * YouTube Video tags
     */
    tags: string[];
    /**
     * `true` if the video has been identified by the YouTube community as inappropriate or offensive to some audiences and viewer discretion is advised
     */
    discretionAdvised?: boolean;
    /**
     * Gives info about music content in that video.
     *
     * The property names of VideoMusic change depending on your region's language.
     */
    music?: VideoMusic[];
    /**
     * The chapters for this video
     *
     * If the video doesn't have any chapters or if the video object wasn't created by {@link video_basic_info} or {@link video_info} this will be an empty array.
     */
    chapters: VideoChapter[];
}
interface VideoChapter {
    /**
     * The title of the chapter
     */
    title: string;
    /**
     * The timestamp of the start of the chapter
     */
    timestamp: string;
    /**
     * The start of the chapter in seconds
     */
    seconds: number;
    /**
     * Thumbnails of the frame at the start of this chapter
     */
    thumbnails: YouTubeThumbnail[];
}
/**
 * Class for YouTube Video url
 */
declare class YouTubeVideo {
    /**
     * YouTube Video ID
     */
    id?: string;
    /**
     * YouTube video url
     */
    url: string;
    /**
     * YouTube Class type. == "video"
     */
    type: 'video' | 'playlist' | 'channel';
    /**
     * YouTube Video title
     */
    title?: string;
    /**
     * YouTube Video description.
     */
    description?: string;
    /**
     * YouTube Video Duration Formatted
     */
    durationRaw: string;
    /**
     * YouTube Video Duration in seconds
     */
    durationInSec: number;
    /**
     * YouTube Video Uploaded Date
     */
    uploadedAt?: string;
    /**
     * YouTube Live Date
     */
    liveAt?: string;
    /**
     * If the video is upcoming or a premiere that isn't currently live, this will contain the premiere date, for watch page playlists this will be true, it defaults to undefined
     */
    upcoming?: Date | true;
    /**
     * YouTube Views
     */
    views: number;
    /**
     * YouTube Thumbnail Data
     */
    thumbnails: YouTubeThumbnail[];
    /**
     * YouTube Video's uploader Channel Data
     */
    channel?: YouTubeChannel;
    /**
     * YouTube Video's likes
     */
    likes: number;
    /**
     * YouTube Video live status
     */
    live: boolean;
    /**
     * YouTube Video private status
     */
    private: boolean;
    /**
     * YouTube Video tags
     */
    tags: string[];
    /**
     * `true` if the video has been identified by the YouTube community as inappropriate or offensive to some audiences and viewer discretion is advised
     */
    discretionAdvised?: boolean;
    /**
     * Gives info about music content in that video.
     */
    music?: VideoMusic[];
    /**
     * The chapters for this video
     *
     * If the video doesn't have any chapters or if the video object wasn't created by {@link video_basic_info} or {@link video_info} this will be an empty array.
     */
    chapters: VideoChapter[];
    /**
     * Constructor for YouTube Video Class
     * @param data JSON parsed data.
     */
    constructor(data: any);
    /**
     * Converts class to title name of video.
     * @returns Title name
     */
    toString(): string;
    /**
     * Converts class to JSON data
     * @returns JSON data.
     */
    toJSON(): VideoOptions;
}

interface LiveStreamData {
    isLive: boolean;
    dashManifestUrl: string | null;
    hlsManifestUrl: string | null;
}
interface formatData {
    itag: number;
    mimeType: string;
    bitrate: number;
    width: number;
    height: number;
    lastModified: string;
    contentLength: string;
    quality: string;
    fps: number;
    qualityLabel: string;
    projectionType: string;
    averageBitrate: number;
    audioQuality: string;
    approxDurationMs: string;
    audioSampleRate: string;
    audioChannels: number;
    url: string;
    signatureCipher: string;
    cipher: string;
    loudnessDb: number;
    targetDurationSec: number;
}
interface InfoData {
    LiveStreamData: LiveStreamData;
    html5player: string;
    format: Partial<formatData>[];
    video_details: YouTubeVideo;
    related_videos: string[];
}
interface StreamInfoData {
    LiveStreamData: LiveStreamData;
    html5player: string;
    format: Partial<formatData>[];
    video_details: Pick<YouTubeVideo, 'url' | 'durationInSec'>;
}

declare enum StreamType {
    Arbitrary = "arbitrary",
    Raw = "raw",
    OggOpus = "ogg/opus",
    WebmOpus = "webm/opus",
    Opus = "opus"
}
interface StreamOptions {
    seek?: number;
    quality?: number;
    language?: string;
    htmldata?: boolean;
    precache?: number;
    discordPlayerCompatibility?: boolean;
}
/**
 * Type for YouTube Stream
 */
declare type YouTubeStream = Stream | LiveStream | SeekStream;

/**
 * YouTube Playlist Class containing vital informations about playlist.
 */
declare class YouTubePlayList {
    /**
     * YouTube Playlist ID
     */
    id?: string;
    /**
     * YouTube Playlist Name
     */
    title?: string;
    /**
     * YouTube Class type. == "playlist"
     */
    type: 'video' | 'playlist' | 'channel';
    /**
     * Total no of videos in that playlist
     */
    videoCount?: number;
    /**
     * Time when playlist was last updated
     */
    lastUpdate?: string;
    /**
     * Total views of that playlist
     */
    views?: number;
    /**
     * YouTube Playlist url
     */
    url?: string;
    /**
     * YouTube Playlist url with starting video url.
     */
    link?: string;
    /**
     * YouTube Playlist channel data
     */
    channel?: YouTubeChannel;
    /**
     * YouTube Playlist thumbnail Data
     */
    thumbnail?: YouTubeThumbnail;
    /**
     * Videos array containing data of first 100 videos
     */
    private videos?;
    /**
     * Map contaning data of all fetched videos
     */
    private fetched_videos;
    /**
     * Token containing API key, Token, ClientVersion.
     */
    private _continuation;
    /**
     * Total no of pages count.
     */
    private __count;
    /**
     * Constructor for YouTube Playlist Class
     * @param data Json Parsed YouTube Playlist data
     * @param searchResult If the data is from search or not
     */
    constructor(data: any, searchResult?: boolean);
    /**
     * Updates variable according to a normal data.
     * @param data Json Parsed YouTube Playlist data
     */
    private __patch;
    /**
     * Updates variable according to a searched data.
     * @param data Json Parsed YouTube Playlist data
     */
    private __patchSearch;
    /**
     * Parses next segment of videos from playlist and returns parsed data.
     * @param limit Total no of videos to parse.
     *
     * Default = Infinity
     * @returns Array of YouTube Video Class
     */
    next(limit?: number): Promise<YouTubeVideo[]>;
    /**
     * Fetches remaining data from playlist
     *
     * For fetching and getting all songs data, see `total_pages` property.
     * @param max Max no of videos to fetch
     *
     * Default = Infinity
     * @returns
     */
    fetch(max?: number): Promise<YouTubePlayList>;
    /**
     * YouTube Playlists are divided into pages.
     *
     * For example, if you want to get 101 - 200 songs
     *
     * ```ts
     * const playlist = await play.playlist_info('playlist url')
     *
     * await playlist.fetch()
     *
     * const result = playlist.page(2)
     * ```
     * @param number Page number
     * @returns Array of YouTube Video Class
     * @see {@link YouTubePlayList.all_videos}
     */
    page(number: number): YouTubeVideo[];
    /**
     * Gets total number of pages in that playlist class.
     * @see {@link YouTubePlayList.all_videos}
     */
    get total_pages(): number;
    /**
     * This tells total number of videos that have been fetched so far.
     *
     * This can be equal to videosCount if all videos in playlist have been fetched and they are not hidden.
     */
    get total_videos(): number;
    /**
     * Fetches all the videos in the playlist and returns them
     *
     * ```ts
     * const playlist = await play.playlist_info('playlist url')
     *
     * const videos = await playlist.all_videos()
     * ```
     * @returns An array of {@link YouTubeVideo} objects
     * @see {@link YouTubePlayList.fetch}
     */
    all_videos(): Promise<YouTubeVideo[]>;
    /**
     * Converts Playlist Class to a json parsed data.
     * @returns
     */
    toJSON(): PlaylistJSON$2;
}
interface PlaylistJSON$2 {
    /**
     * YouTube Playlist ID
     */
    id?: string;
    /**
     * YouTube Playlist Name
     */
    title?: string;
    /**
     * Total no of videos in that playlist
     */
    videoCount?: number;
    /**
     * Time when playlist was last updated
     */
    lastUpdate?: string;
    /**
     * Total views of that playlist
     */
    views?: number;
    /**
     * YouTube Playlist url
     */
    url?: string;
    /**
     * YouTube Playlist url with starting video url.
     */
    link?: string;
    /**
     * YouTube Playlist channel data
     */
    channel?: YouTubeChannel;
    /**
     * YouTube Playlist thumbnail Data
     */
    thumbnail?: {
        width: number | undefined;
        height: number | undefined;
        url: string | undefined;
    };
    /**
     * first 100 videos in that playlist
     */
    videos?: YouTubeVideo[];
}

interface InfoOptions {
    htmldata?: boolean;
    language?: string;
}
interface PlaylistOptions {
    incomplete?: boolean;
    language?: string;
}
/**
 * Validate YouTube URL or ID.
 *
 * **CAUTION :** If your search word is 11 or 12 characters long, you might get it validated as video ID.
 *
 * To avoid above, add one more condition to yt_validate
 * ```ts
 * if (url.startsWith('https') && yt_validate(url) === 'video') {
 *      // YouTube Video Url.
 * }
 * ```
 * @param url YouTube URL OR ID
 * @returns
 * ```
 * 'playlist' | 'video' | 'search' | false
 * ```
 */
declare function yt_validate(url: string): 'playlist' | 'video' | 'search' | false;
/**
 * Extract ID of YouTube url.
 * @param url ID or url of YouTube
 * @returns ID of video or playlist.
 */
declare function extractID(url: string): string;
/**
 * Basic function to get data from a YouTube url or ID.
 *
 * Example
 * ```ts
 * const video = await play.video_basic_info('youtube video url')
 *
 * const res = ... // Any https package get function.
 *
 * const video = await play.video_basic_info(res.body, { htmldata : true })
 * ```
 * @param url YouTube url or ID or html body data
 * @param options Video Info Options
 *  - `boolean` htmldata : given data is html data or not
 * @returns Video Basic Info {@link InfoData}.
 */
declare function video_basic_info(url: string, options?: InfoOptions): Promise<InfoData>;
/**
 * Gets data from YouTube url or ID or html body data and deciphers it.
 * ```
 * video_basic_info + decipher_info = video_info
 * ```
 *
 * Example
 * ```ts
 * const video = await play.video_info('youtube video url')
 *
 * const res = ... // Any https package get function.
 *
 * const video = await play.video_info(res.body, { htmldata : true })
 * ```
 * @param url YouTube url or ID or html body data
 * @param options Video Info Options
 *  - `boolean` htmldata : given data is html data or not
 * @returns Deciphered Video Info {@link InfoData}.
 */
declare function video_info(url: string, options?: InfoOptions): Promise<InfoData>;
/**
 * Function uses data from video_basic_info and deciphers it if it contains signatures.
 * @param data Data - {@link InfoData}
 * @param audio_only `boolean` - To decipher only audio formats only.
 * @returns Deciphered Video Info {@link InfoData}
 */
declare function decipher_info<T extends InfoData | StreamInfoData>(data: T, audio_only?: boolean): Promise<T>;
/**
 * Gets YouTube playlist info from a playlist url.
 *
 * Example
 * ```ts
 * const playlist = await play.playlist_info('youtube playlist url')
 *
 * const playlist = await play.playlist_info('youtube playlist url', { incomplete : true })
 * ```
 * @param url Playlist URL
 * @param options Playlist Info Options
 * - `boolean` incomplete : When this is set to `false` (default) this function will throw an error
 *                          if the playlist contains hidden videos.
 *                          If it is set to `true`, it parses the playlist skipping the hidden videos,
 *                          only visible videos are included in the resulting {@link YouTubePlaylist}.
 *
 * @returns YouTube Playlist
 */
declare function playlist_info(url: string, options?: PlaylistOptions): Promise<YouTubePlayList>;

/**
 * Type for YouTube returns
 */
declare type YouTube = YouTubeVideo | YouTubeChannel | YouTubePlayList;

interface TrackJSON {
    /**
     * Spotify Track Name
     */
    name: string;
    /**
     * Spotify Track ID
     */
    id: string;
    /**
     * Spotify Track url
     */
    url: string;
    /**
     * Spotify Track explicit info.
     */
    explicit: boolean;
    /**
     * Spotify Track Duration in seconds
     */
    durationInSec: number;
    /**
     * Spotify Track Duration in milli seconds
     */
    durationInMs: number;
    /**
     * Spotify Track Artists data [ array ]
     */
    artists: SpotifyArtists[];
    /**
     * Spotify Track Album data
     */
    album: SpotifyTrackAlbum | undefined;
    /**
     * Spotify Track Thumbnail Data
     */
    thumbnail: SpotifyThumbnail | undefined;
}
interface PlaylistJSON$1 {
    /**
     * Spotify Playlist Name
     */
    name: string;
    /**
     * Spotify Playlist collaborative boolean.
     */
    collaborative: boolean;
    /**
     * Spotify Playlist Description
     */
    description: string;
    /**
     * Spotify Playlist URL
     */
    url: string;
    /**
     * Spotify Playlist ID
     */
    id: string;
    /**
     * Spotify Playlist Thumbnail Data
     */
    thumbnail: SpotifyThumbnail;
    /**
     * Spotify Playlist Owner Artist data
     */
    owner: SpotifyArtists;
    /**
     * Spotify Playlist total tracks Count
     */
    tracksCount: number;
}
interface AlbumJSON {
    /**
     * Spotify Album Name
     */
    name: string;
    /**
     * Spotify Class type. == "album"
     */
    type: 'track' | 'playlist' | 'album';
    /**
     * Spotify Album url
     */
    url: string;
    /**
     * Spotify Album id
     */
    id: string;
    /**
     * Spotify Album Thumbnail data
     */
    thumbnail: SpotifyThumbnail;
    /**
     * Spotify Album artists [ array ]
     */
    artists: SpotifyArtists[];
    /**
     * Spotify Album copyright data [ array ]
     */
    copyrights: SpotifyCopyright[];
    /**
     * Spotify Album Release date
     */
    release_date: string;
    /**
     * Spotify Album Release Date **precise**
     */
    release_date_precision: string;
    /**
     * Spotify Album total no of tracks
     */
    tracksCount: number;
}

interface SpotifyTrackAlbum {
    /**
     * Spotify Track Album name
     */
    name: string;
    /**
     * Spotify Track Album url
     */
    url: string;
    /**
     * Spotify Track Album id
     */
    id: string;
    /**
     * Spotify Track Album release date
     */
    release_date: string;
    /**
     * Spotify Track Album release date **precise**
     */
    release_date_precision: string;
    /**
     * Spotify Track Album total tracks number
     */
    total_tracks: number;
}
interface SpotifyArtists {
    /**
     * Spotify Artist Name
     */
    name: string;
    /**
     * Spotify Artist Url
     */
    url: string;
    /**
     * Spotify Artist ID
     */
    id: string;
}
interface SpotifyThumbnail {
    /**
     * Spotify Thumbnail height
     */
    height: number;
    /**
     * Spotify Thumbnail width
     */
    width: number;
    /**
     * Spotify Thumbnail url
     */
    url: string;
}
interface SpotifyCopyright {
    /**
     * Spotify Copyright Text
     */
    text: string;
    /**
     * Spotify Copyright Type
     */
    type: string;
}
/**
 * Spotify Track Class
 */
declare class SpotifyTrack {
    /**
     * Spotify Track Name
     */
    name: string;
    /**
     * Spotify Class type. == "track"
     */
    type: 'track' | 'playlist' | 'album';
    /**
     * Spotify Track ID
     */
    id: string;
    /**
     * Spotify Track ISRC
     */
    isrc: string;
    /**
     * Spotify Track url
     */
    url: string;
    /**
     * Spotify Track explicit info.
     */
    explicit: boolean;
    /**
     * Spotify Track playability info.
     */
    playable: boolean;
    /**
     * Spotify Track Duration in seconds
     */
    durationInSec: number;
    /**
     * Spotify Track Duration in milli seconds
     */
    durationInMs: number;
    /**
     * Spotify Track Artists data [ array ]
     */
    artists: SpotifyArtists[];
    /**
     * Spotify Track Album data
     */
    album: SpotifyTrackAlbum | undefined;
    /**
     * Spotify Track Thumbnail Data
     */
    thumbnail: SpotifyThumbnail | undefined;
    /**
     * Constructor for Spotify Track
     * @param data
     */
    constructor(data: any);
    toJSON(): TrackJSON;
}
/**
 * Spotify Playlist Class
 */
declare class SpotifyPlaylist {
    /**
     * Spotify Playlist Name
     */
    name: string;
    /**
     * Spotify Class type. == "playlist"
     */
    type: 'track' | 'playlist' | 'album';
    /**
     * Spotify Playlist collaborative boolean.
     */
    collaborative: boolean;
    /**
     * Spotify Playlist Description
     */
    description: string;
    /**
     * Spotify Playlist URL
     */
    url: string;
    /**
     * Spotify Playlist ID
     */
    id: string;
    /**
     * Spotify Playlist Thumbnail Data
     */
    thumbnail: SpotifyThumbnail;
    /**
     * Spotify Playlist Owner Artist data
     */
    owner: SpotifyArtists;
    /**
     * Spotify Playlist total tracks Count
     */
    tracksCount: number;
    /**
     * Spotify Playlist Spotify data
     *
     * @private
     */
    private spotifyData;
    /**
     * Spotify Playlist fetched tracks Map
     *
     * @private
     */
    private fetched_tracks;
    /**
     * Boolean to tell whether it is a searched result or not.
     */
    private readonly search;
    /**
     * Constructor for Spotify Playlist Class
     * @param data JSON parsed data of playlist
     * @param spotifyData Data about sporify token for furhter fetching.
     */
    constructor(data: any, spotifyData: SpotifyDataOptions, search: boolean);
    /**
     * Fetches Spotify Playlist tracks more than 100 tracks.
     *
     * For getting all tracks in playlist, see `total_pages` property.
     * @returns Playlist Class.
     */
    fetch(): Promise<this>;
    /**
     * Spotify Playlist tracks are divided in pages.
     *
     * For example getting data of 101 - 200 videos in a playlist,
     *
     * ```ts
     * const playlist = await play.spotify('playlist url')
     *
     * await playlist.fetch()
     *
     * const result = playlist.page(2)
     * ```
     * @param num Page Number
     * @returns
     */
    page(num: number): SpotifyTrack[];
    /**
     * Gets total number of pages in that playlist class.
     * @see {@link SpotifyPlaylist.all_tracks}
     */
    get total_pages(): number;
    /**
     * Spotify Playlist total no of tracks that have been fetched so far.
     */
    get total_tracks(): number;
    /**
     * Fetches all the tracks in the playlist and returns them
     *
     * ```ts
     * const playlist = await play.spotify('playlist url')
     *
     * const tracks = await playlist.all_tracks()
     * ```
     * @returns An array of {@link SpotifyTrack}
     */
    all_tracks(): Promise<SpotifyTrack[]>;
    /**
     * Converts Class to JSON
     * @returns JSON data
     */
    toJSON(): PlaylistJSON$1;
}
/**
 * Spotify Album Class
 */
declare class SpotifyAlbum {
    /**
     * Spotify Album Name
     */
    name: string;
    /**
     * Spotify Class type. == "album"
     */
    type: 'track' | 'playlist' | 'album';
    /**
     * Spotify Album url
     */
    url: string;
    /**
     * Spotify Album id
     */
    id: string;
    /**
     * Spotify Album Thumbnail data
     */
    thumbnail: SpotifyThumbnail;
    /**
     * Spotify Album artists [ array ]
     */
    artists: SpotifyArtists[];
    /**
     * Spotify Album copyright data [ array ]
     */
    copyrights: SpotifyCopyright[];
    /**
     * Spotify Album Release date
     */
    release_date: string;
    /**
     * Spotify Album Release Date **precise**
     */
    release_date_precision: string;
    /**
     * Spotify Album total no of tracks
     */
    tracksCount: number;
    /**
     * Spotify Album Spotify data
     *
     * @private
     */
    private spotifyData;
    /**
     * Spotify Album fetched tracks Map
     *
     * @private
     */
    private fetched_tracks;
    /**
     * Boolean to tell whether it is a searched result or not.
     */
    private readonly search;
    /**
     * Constructor for Spotify Album Class
     * @param data Json parsed album data
     * @param spotifyData Spotify credentials
     */
    constructor(data: any, spotifyData: SpotifyDataOptions, search: boolean);
    /**
     * Fetches Spotify Album tracks more than 50 tracks.
     *
     * For getting all tracks in album, see `total_pages` property.
     * @returns Album Class.
     */
    fetch(): Promise<this>;
    /**
     * Spotify Album tracks are divided in pages.
     *
     * For example getting data of 51 - 100 videos in a album,
     *
     * ```ts
     * const album = await play.spotify('album url')
     *
     * await album.fetch()
     *
     * const result = album.page(2)
     * ```
     * @param num Page Number
     * @returns
     */
    page(num: number): SpotifyTrack[] | undefined;
    /**
     * Gets total number of pages in that album class.
     * @see {@link SpotifyAlbum.all_tracks}
     */
    get total_pages(): number;
    /**
     * Spotify Album total no of tracks that have been fetched so far.
     */
    get total_tracks(): number;
    /**
     * Fetches all the tracks in the album and returns them
     *
     * ```ts
     * const album = await play.spotify('album url')
     *
     * const tracks = await album.all_tracks()
     * ```
     * @returns An array of {@link SpotifyTrack}
     */
    all_tracks(): Promise<SpotifyTrack[]>;
    /**
     * Converts Class to JSON
     * @returns JSON data
     */
    toJSON(): AlbumJSON;
}

/**
 * Spotify Data options that are stored in spotify.data file.
 */
interface SpotifyDataOptions {
    client_id: string;
    client_secret: string;
    redirect_url?: string;
    authorization_code?: string;
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    expiry?: number;
    market?: string;
    file?: boolean;
}
/**
 * Gets Spotify url details.
 *
 * ```ts
 * let spot = await play.spotify('spotify url')
 *
 * // spot.type === "track" | "playlist" | "album"
 *
 * if (spot.type === "track") {
 *      spot = spot as play.SpotifyTrack
 *      // Code with spotify track class.
 * }
 * ```
 * @param url Spotify Url
 * @returns A {@link SpotifyTrack} or {@link SpotifyPlaylist} or {@link SpotifyAlbum}
 */
declare function spotify(url: string): Promise<Spotify>;
/**
 * Validate Spotify url
 * @param url Spotify URL
 * @returns
 * ```ts
 * 'track' | 'playlist' | 'album' | 'search' | false
 * ```
 */
declare function sp_validate(url: string): 'track' | 'playlist' | 'album' | 'search' | false;
/**
 * Checks if spotify token is expired or not.
 *
 * Update token if returned false.
 * ```ts
 * if (play.is_expired()) {
 *      await play.refreshToken()
 * }
 * ```
 * @returns boolean
 */
declare function is_expired(): boolean;
/**
 * type for Spotify Classes
 */
declare type Spotify = SpotifyAlbum | SpotifyPlaylist | SpotifyTrack;
/**
 * Refreshes Token
 *
 * ```ts
 * if (play.is_expired()) {
 *      await play.refreshToken()
 * }
 * ```
 * @returns boolean
 */
declare function refreshToken(): Promise<boolean>;

interface SoundTrackJSON {
    /**
     * SoundCloud Track Name
     */
    name: string;
    /**
     * SoundCloud Track ID
     */
    id: number;
    /**
     * SoundCloud Track url
     */
    url: string;
    /**
     * User friendly SoundCloud track URL
     */
    permalink: string;
    /**
     * SoundCloud Track fetched status
     */
    fetched: boolean;
    /**
     * SoundCloud Track Duration in seconds
     */
    durationInSec: number;
    /**
     * SoundCloud Track Duration in miili seconds
     */
    durationInMs: number;
    /**
     * SoundCloud Track formats data
     */
    formats: SoundCloudTrackFormat[];
    /**
     * SoundCloud Track Publisher Data
     */
    publisher: {
        name: string;
        id: number;
        artist: string;
        contains_music: boolean;
        writer_composer: string;
    } | null;
    /**
     * SoundCloud Track thumbnail
     */
    thumbnail: string;
    /**
     * SoundCloud Track user data
     */
    user: SoundCloudUser;
}
interface PlaylistJSON {
    /**
     * SoundCloud Playlist Name
     */
    name: string;
    /**
     * SoundCloud Playlist ID
     */
    id: number;
    /**
     * SoundCloud Playlist URL
     */
    url: string;
    /**
     * SoundCloud Playlist Sub type. == "album" for soundcloud albums
     */
    sub_type: string;
    /**
     * SoundCloud Playlist Total Duration in seconds
     */
    durationInSec: number;
    /**
     * SoundCloud Playlist Total Duration in milli seconds
     */
    durationInMs: number;
    /**
     * SoundCloud Playlist user data
     */
    user: SoundCloudUser;
    /**
     * SoundCloud Playlist tracks [ It can be fetched or not fetched ]
     */
    tracks: SoundCloudTrack[] | SoundCloudTrackDeprecated[];
    /**
     * SoundCloud Playlist tracks number
     */
    tracksCount: number;
}

interface SoundCloudUser {
    /**
     * SoundCloud User Name
     */
    name: string;
    /**
     * SoundCloud User ID
     */
    id: string;
    /**
     * SoundCloud User URL
     */
    url: string;
    /**
     * SoundCloud Class type. == "user"
     */
    type: 'track' | 'playlist' | 'user';
    /**
     * SoundCloud User Verified status
     */
    verified: boolean;
    /**
     * SoundCloud User Description
     */
    description: string;
    /**
     * SoundCloud User First Name
     */
    first_name: string;
    /**
     * SoundCloud User Full Name
     */
    full_name: string;
    /**
     * SoundCloud User Last Name
     */
    last_name: string;
    /**
     * SoundCloud User thumbnail URL
     */
    thumbnail: string;
}
interface SoundCloudTrackDeprecated {
    /**
     * SoundCloud Track fetched status
     */
    fetched: boolean;
    /**
     * SoundCloud Track ID
     */
    id: number;
    /**
     * SoundCloud Class type. == "track"
     */
    type: 'track';
}
interface SoundCloudTrackFormat {
    /**
     * SoundCloud Track Format Url
     */
    url: string;
    /**
     * SoundCloud Track Format preset
     */
    preset: string;
    /**
     * SoundCloud Track Format Duration
     */
    duration: number;
    /**
     * SoundCloud Track Format data containing protocol and mime_type
     */
    format: {
        protocol: string;
        mime_type: string;
    };
    /**
     * SoundCloud Track Format quality
     */
    quality: string;
}
/**
 * SoundCloud Track Class
 */
declare class SoundCloudTrack {
    /**
     * SoundCloud Track Name
     */
    name: string;
    /**
     * SoundCloud Track ID
     */
    id: number;
    /**
     * SoundCloud Track url
     */
    url: string;
    /**
     * User friendly SoundCloud track URL
     */
    permalink: string;
    /**
     * SoundCloud Track fetched status
     */
    fetched: boolean;
    /**
     * SoundCloud Class type. === "track"
     */
    type: 'track' | 'playlist' | 'user';
    /**
     * SoundCloud Track Duration in seconds
     */
    durationInSec: number;
    /**
     * SoundCloud Track Duration in miili seconds
     */
    durationInMs: number;
    /**
     * SoundCloud Track formats data
     */
    formats: SoundCloudTrackFormat[];
    /**
     * SoundCloud Track Publisher Data
     */
    publisher: {
        name: string;
        id: number;
        artist: string;
        contains_music: boolean;
        writer_composer: string;
    } | null;
    /**
     * SoundCloud Track thumbnail
     */
    thumbnail: string;
    /**
     * SoundCloud Track user data
     */
    user: SoundCloudUser;
    /**
     * Constructor for SoundCloud Track Class
     * @param data JSON parsed track html data
     */
    constructor(data: any);
    /**
     * Converts class to JSON
     * @returns JSON parsed Data
     */
    toJSON(): SoundTrackJSON;
}
/**
 * SoundCloud Playlist Class
 */
declare class SoundCloudPlaylist {
    /**
     * SoundCloud Playlist Name
     */
    name: string;
    /**
     * SoundCloud Playlist ID
     */
    id: number;
    /**
     * SoundCloud Playlist URL
     */
    url: string;
    /**
     * SoundCloud Class type. == "playlist"
     */
    type: 'track' | 'playlist' | 'user';
    /**
     * SoundCloud Playlist Sub type. == "album" for soundcloud albums
     */
    sub_type: string;
    /**
     * SoundCloud Playlist Total Duration in seconds
     */
    durationInSec: number;
    /**
     * SoundCloud Playlist Total Duration in milli seconds
     */
    durationInMs: number;
    /**
     * SoundCloud Playlist user data
     */
    user: SoundCloudUser;
    /**
     * SoundCloud Playlist tracks [ It can be fetched or not fetched ]
     */
    tracks: SoundCloudTrack[] | SoundCloudTrackDeprecated[];
    /**
     * SoundCloud Playlist tracks number
     */
    tracksCount: number;
    /**
     * SoundCloud Client ID provided by user
     * @private
     */
    private client_id;
    /**
     * Constructor for SoundCloud Playlist
     * @param data JSON parsed SoundCloud playlist data
     * @param client_id Provided SoundCloud Client ID
     */
    constructor(data: any, client_id: string);
    /**
     * Fetches all unfetched songs in a playlist.
     *
     * For fetching songs and getting all songs, see `fetched_tracks` property.
     * @returns playlist class
     */
    fetch(): Promise<SoundCloudPlaylist>;
    /**
     * Get total no. of fetched tracks
     * @see {@link SoundCloudPlaylist.all_tracks}
     */
    get total_tracks(): number;
    /**
     * Fetches all the tracks in the playlist and returns them
     *
     * ```ts
     * const playlist = await play.soundcloud('playlist url')
     *
     * const tracks = await playlist.all_tracks()
     * ```
     * @returns An array of {@link SoundCloudTrack}
     */
    all_tracks(): Promise<SoundCloudTrack[]>;
    /**
     * Converts Class to JSON data
     * @returns JSON parsed data
     */
    toJSON(): PlaylistJSON;
}
/**
 * SoundCloud Stream class
 */
declare class SoundCloudStream {
    /**
     * Readable Stream through which data passes
     */
    stream: Readable;
    /**
     * Type of audio data that we recieved from normal youtube url.
     */
    type: StreamType;
    /**
     * Dash Url containing segment urls.
     * @private
     */
    private url;
    /**
     * Total time of downloaded segments data.
     * @private
     */
    private downloaded_time;
    /**
     * Timer for looping code every 5 minutes
     * @private
     */
    private timer;
    /**
     * Total segments Downloaded so far
     * @private
     */
    private downloaded_segments;
    /**
     * Incoming message that we recieve.
     *
     * Storing this is essential.
     * This helps to destroy the TCP connection completely if you stopped player in between the stream
     * @private
     */
    private request;
    /**
     * Array of segment time. Useful for calculating downloaded_time.
     */
    private time;
    /**
     * Array of segment_urls in dash file.
     */
    private segment_urls;
    /**
     * Constructor for SoundCloud Stream
     * @param url Dash url containing dash file.
     * @param type Stream Type
     */
    constructor(url: string, type?: StreamType);
    /**
     * Parses SoundCloud dash file.
     * @private
     */
    private parser;
    /**
     * Starts looping of code for getting all segments urls data
     */
    private start;
    /**
     * Main Loop function for getting all segments urls data
     */
    private loop;
    /**
     * This cleans every used variable in class.
     *
     * This is used to prevent re-use of this class and helping garbage collector to collect it.
     */
    private cleanup;
    /**
     * Pauses timer.
     * Stops running of loop.
     *
     * Useful if you don't want to get excess data to be stored in stream.
     */
    pause(): void;
    /**
     * Resumes timer.
     * Starts running of loop.
     */
    resume(): void;
}

/**
 * Gets info from a soundcloud url.
 *
 * ```ts
 * let sound = await play.soundcloud('soundcloud url')
 *
 * // sound.type === "track" | "playlist" | "user"
 *
 * if (sound.type === "track") {
 *      spot = spot as play.SoundCloudTrack
 *      // Code with SoundCloud track class.
 * }
 * ```
 * @param url soundcloud url
 * @returns A {@link SoundCloudTrack} or {@link SoundCloudPlaylist}
 */
declare function soundcloud(url: string): Promise<SoundCloud>;
/**
 * Type of SoundCloud
 */
declare type SoundCloud = SoundCloudTrack | SoundCloudPlaylist;
/**
 * Gets Free SoundCloud Client ID.
 *
 * Use this in beginning of your code to add SoundCloud support.
 *
 * ```ts
 * play.getFreeClientID().then((clientID) => play.setToken({
 *      soundcloud : {
 *          client_id : clientID
 *      }
 * }))
 * ```
 * @returns client ID
 */
declare function getFreeClientID(): Promise<string>;
/**
 * Validates a soundcloud url
 * @param url soundcloud url
 * @returns
 * ```ts
 * false | 'track' | 'playlist'
 * ```
 */
declare function so_validate(url: string): Promise<false | 'track' | 'playlist' | 'search'>;

/**
 * Interface representing an image on Deezer
 * available in four sizes
 */
interface DeezerImage {
    /**
     * The largest version of the image
     */
    xl: string;
    /**
     * The second largest version of the image
     */
    big: string;
    /**
     * The second smallest version of the image
     */
    medium: string;
    /**
     * The smallest version of the image
     */
    small: string;
}
/**
 * Interface representing a Deezer genre
 */
interface DeezerGenre {
    /**
     * The name of the genre
     */
    name: string;
    /**
     * The thumbnail of the genre available in four sizes
     */
    picture: DeezerImage;
}
/**
 * Interface representing a Deezer user account
 */
interface DeezerUser {
    /**
     * The id of the user
     */
    id: number;
    /**
     * The name of the user
     */
    name: string;
}
/**
 * Class representing a Deezer track
 */
declare class DeezerTrack {
    /**
     * The id of the track
     */
    id: number;
    /**
     * The title of the track
     */
    title: string;
    /**
     * A shorter version of the title
     */
    shortTitle: string;
    /**
     * The URL of the track on Deezer
     */
    url: string;
    /**
     * The duration of the track in seconds
     */
    durationInSec: number;
    /**
     * The rank of the track
     */
    rank: number;
    /**
     * `true` if the track contains any explicit lyrics
     */
    explicit: boolean;
    /**
     * URL to a file containing the first 30 seconds of the track
     */
    previewURL: string;
    /**
     * The artist of the track
     */
    artist: DeezerArtist;
    /**
     * The album that this track is in
     */
    album: DeezerTrackAlbum;
    /**
     * The type, always `'track'`, useful to determine what the deezer function returned
     */
    type: 'track' | 'playlist' | 'album';
    /**
     * Signifies that some properties are not populated
     *
     * Partial tracks can be populated by calling {@link DeezerTrack.fetch}.
     *
     * `true` for tracks in search results and `false` if the track was fetched directly or expanded.
     */
    partial: boolean;
    /**
     * The position of the track in the album
     *
     * `undefined` for partial tracks
     *
     * @see {@link DeezerTrack.partial}
     */
    trackPosition?: number;
    /**
     * The number of the disk the track is on
     *
     * `undefined` for partial tracks
     *
     * @see {@link DeezerTrack.partial}
     */
    diskNumber?: number;
    /**
     * The release date
     *
     * `undefined` for partial tracks
     *
     * @see {@link DeezerTrack.partial}
     */
    releaseDate?: Date;
    /**
     * The number of beats per minute
     *
     * `undefined` for partial tracks
     *
     * @see {@link DeezerTrack.partial}
     */
    bpm?: number;
    /**
     * The gain of the track
     *
     * `undefined` for partial tracks
     *
     * @see {@link DeezerTrack.partial}
     */
    gain?: number;
    /**
     * The artists that have contributed to the track
     *
     * `undefined` for partial tracks
     *
     * @see {@link DeezerTrack.partial}
     */
    contributors?: DeezerArtist[];
    /**
     * Creates a Deezer track from the data in an API response
     * @param data the data to use to create the track
     * @param partial Whether the track should be partial
     * @see {@link DeezerTrack.partial}
     */
    constructor(data: any, partial: boolean);
    /**
     * Fetches and populates the missing fields
     *
     * The property {@link partial} will be `false` if this method finishes successfully.
     *
     * @returns A promise with the same track this method was called on.
     */
    fetch(): Promise<DeezerTrack>;
    /**
     * Converts instances of this class to JSON data
     * @returns JSON data.
     */
    toJSON(): {
        id: number;
        title: string;
        shortTitle: string;
        url: string;
        durationInSec: number;
        rank: number;
        explicit: boolean;
        previewURL: string;
        artist: DeezerArtist;
        album: DeezerTrackAlbum;
        type: "playlist" | "album" | "track";
        trackPosition: number | undefined;
        diskNumber: number | undefined;
        releaseDate: Date | undefined;
        bpm: number | undefined;
        gain: number | undefined;
        contributors: DeezerArtist[] | undefined;
    };
}
/**
 * Class for Deezer Albums
 */
declare class DeezerAlbum {
    /**
     * The id of the album
     */
    id: number;
    /**
     * The title of the album
     */
    title: string;
    /**
     * The URL to the album on Deezer
     */
    url: string;
    /**
     * The record type of the album (e.g. EP, ALBUM, etc ...)
     */
    recordType: string;
    /**
     * `true` if the album contains any explicit lyrics
     */
    explicit: boolean;
    /**
     * The artist of the album
     */
    artist: DeezerArtist;
    /**
     * The album cover available in four sizes
     */
    cover: DeezerImage;
    /**
     * The type, always `'album'`, useful to determine what the deezer function returned
     */
    type: 'track' | 'playlist' | 'album';
    /**
     * The number of tracks in the album
     */
    tracksCount: number;
    /**
     * Signifies that some properties are not populated
     *
     * Partial albums can be populated by calling {@link DeezerAlbum.fetch}.
     *
     * `true` for albums in search results and `false` if the album was fetched directly or expanded.
     */
    partial: boolean;
    /**
     * The **u**niversal **p**roduct **c**ode of the album
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    upc?: string;
    /**
     * The duration of the album in seconds
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    durationInSec?: number;
    /**
     * The number of fans the album has
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    numberOfFans?: number;
    /**
     * The release date of the album
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    releaseDate?: Date;
    /**
     * Whether the album is available
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    available?: boolean;
    /**
     * The list of genres present in this album
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    genres?: DeezerGenre[];
    /**
     * The contributors to the album
     *
     * `undefined` for partial albums
     *
     * @see {@link DeezerAlbum.partial}
     */
    contributors?: DeezerArtist[];
    /**
     * The list of tracks in the album
     *
     * empty (length === 0) for partial albums
     *
     * Use {@link DeezerAlbum.fetch} to populate the tracks and other properties
     *
     * @see {@link DeezerAlbum.partial}
     */
    tracks: DeezerTrack[];
    /**
     * Creates a Deezer album from the data in an API response
     * @param data the data to use to create the album
     * @param partial Whether the album should be partial
     * @see {@link DeezerAlbum.partial}
     */
    constructor(data: any, partial: boolean);
    /**
     * Fetches and populates the missing fields including all tracks.
     *
     * The property {@link DeezerAlbum.partial} will be `false` if this method finishes successfully.
     *
     * @returns A promise with the same album this method was called on.
     */
    fetch(): Promise<DeezerAlbum>;
    /**
     * Fetches all the tracks in the album and returns them
     *
     * ```ts
     * const album = await play.deezer('album url')
     *
     * const tracks = await album.all_tracks()
     * ```
     * @returns An array of {@link DeezerTrack}
     */
    all_tracks(): Promise<DeezerTrack[]>;
    /**
     * Converts instances of this class to JSON data
     * @returns JSON data.
     */
    toJSON(): {
        id: number;
        title: string;
        url: string;
        recordType: string;
        explicit: boolean;
        artist: DeezerArtist;
        cover: DeezerImage;
        type: "playlist" | "album" | "track";
        upc: string | undefined;
        tracksCount: number;
        durationInSec: number | undefined;
        numberOfFans: number | undefined;
        releaseDate: Date | undefined;
        available: boolean | undefined;
        genres: DeezerGenre[] | undefined;
        contributors: DeezerArtist[] | undefined;
        tracks: {
            id: number;
            title: string;
            shortTitle: string;
            url: string;
            durationInSec: number;
            rank: number;
            explicit: boolean;
            previewURL: string;
            artist: DeezerArtist;
            album: DeezerTrackAlbum;
            type: "playlist" | "album" | "track";
            trackPosition: number | undefined;
            diskNumber: number | undefined;
            releaseDate: Date | undefined;
            bpm: number | undefined;
            gain: number | undefined;
            contributors: DeezerArtist[] | undefined;
        }[];
    };
}
/**
 * Class for Deezer Playlists
 */
declare class DeezerPlaylist {
    /**
     * The id of the playlist
     */
    id: number;
    /**
     * The title of the playlist
     */
    title: string;
    /**
     * Whether the playlist is public or private
     */
    public: boolean;
    /**
     * The URL of the playlist on Deezer
     */
    url: string;
    /**
     * Cover picture of the playlist available in four sizes
     */
    picture: DeezerImage;
    /**
     * The date of the playlist's creation
     */
    creationDate: Date;
    /**
     * The type, always `'playlist'`, useful to determine what the deezer function returned
     */
    type: 'track' | 'playlist' | 'album';
    /**
     * The Deezer user that created the playlist
     */
    creator: DeezerUser;
    /**
     * The number of tracks in the playlist
     */
    tracksCount: number;
    /**
     * Signifies that some properties are not populated
     *
     * Partial playlists can be populated by calling {@link DeezerPlaylist.fetch}.
     *
     * `true` for playlists in search results and `false` if the album was fetched directly or expanded.
     */
    partial: boolean;
    /**
     * Description of the playlist
     *
     * `undefined` for partial playlists
     *
     * @see {@link DeezerPlaylist.partial}
     */
    description?: string;
    /**
     * Duration of the playlist in seconds
     *
     * `undefined` for partial playlists
     *
     * @see {@link DeezerPlaylist.partial}
     */
    durationInSec?: number;
    /**
     * `true` if the playlist is the loved tracks playlist
     *
     * `undefined` for partial playlists
     *
     * @see {@link DeezerPlaylist.partial}
     */
    isLoved?: boolean;
    /**
     * Whether multiple users have worked on the playlist
     *
     * `undefined` for partial playlists
     *
     * @see {@link DeezerPlaylist.partial}
     */
    collaborative?: boolean;
    /**
     * The number of fans the playlist has
     *
     * `undefined` for partial playlists
     *
     * @see {@link DeezerPlaylist.partial}
     */
    fans?: number;
    /**
     * The list of tracks in the playlist
     *
     * empty (length === 0) for partial and non public playlists
     *
     * Use {@link DeezerPlaylist.fetch} to populate the tracks and other properties
     *
     * @see {@link DeezerPlaylist.partial}
     * @see {@link DeezerPlaylist.public}
     */
    tracks: DeezerTrack[];
    /**
     * Creates a Deezer playlist from the data in an API response
     * @param data the data to use to create the playlist
     * @param partial Whether the playlist should be partial
     * @see {@link DeezerPlaylist.partial}
     */
    constructor(data: any, partial: boolean);
    /**
     * Fetches and populates the missing fields, including all tracks.
     *
     * The property {@link DeezerPlaylist.partial} will be `false` if this method finishes successfully.
     *
     * @returns A promise with the same playlist this method was called on.
     */
    fetch(): Promise<DeezerPlaylist>;
    /**
     * Fetches all the tracks in the playlist and returns them
     *
     * ```ts
     * const playlist = await play.deezer('playlist url')
     *
     * const tracks = await playlist.all_tracks()
     * ```
     * @returns An array of {@link DeezerTrack}
     */
    all_tracks(): Promise<DeezerTrack[]>;
    /**
     * Converts instances of this class to JSON data
     * @returns JSON data.
     */
    toJSON(): {
        id: number;
        title: string;
        public: boolean;
        url: string;
        picture: DeezerImage;
        creationDate: Date;
        type: "playlist" | "album" | "track";
        creator: DeezerUser;
        tracksCount: number;
        description: string | undefined;
        durationInSec: number | undefined;
        isLoved: boolean | undefined;
        collaborative: boolean | undefined;
        fans: number | undefined;
        tracks: {
            id: number;
            title: string;
            shortTitle: string;
            url: string;
            durationInSec: number;
            rank: number;
            explicit: boolean;
            previewURL: string;
            artist: DeezerArtist;
            album: DeezerTrackAlbum;
            type: "playlist" | "album" | "track";
            trackPosition: number | undefined;
            diskNumber: number | undefined;
            releaseDate: Date | undefined;
            bpm: number | undefined;
            gain: number | undefined;
            contributors: DeezerArtist[] | undefined;
        }[];
    };
}
declare class DeezerTrackAlbum {
    id: number;
    title: string;
    url: string;
    cover: DeezerImage;
    releaseDate?: Date;
    constructor(data: any);
}
/**
 * Class representing a Deezer artist
 */
declare class DeezerArtist {
    /**
     * The id of the artist
     */
    id: number;
    /**
     * The name of the artist
     */
    name: string;
    /**
     * The URL of the artist on Deezer
     */
    url: string;
    /**
     * The picture of the artist available in four sizes
     */
    picture?: DeezerImage;
    /**
     * The of the artist on the track
     */
    role?: string;
    constructor(data: any);
}

interface DeezerAdvancedSearchOptions {
    /**
     * The maximum number of results to return, maximum `100`, defaults to `10`.
     */
    limit?: number;
    /**
     * The name of the artist.
     */
    artist?: string;
    /**
     * The title of the album.
     */
    album?: string;
    /**
     * The title of the track.
     */
    title?: string;
    /**
     * The label that released the track.
     */
    label?: string;
    /**
     * The minimum duration in seconds.
     */
    minDurationInSec?: number;
    /**
     * The maximum duration in seconds.
     */
    maxDurationInSec?: number;
    /**
     * The minimum BPM.
     */
    minBPM?: number;
    /**
     * The minimum BPM.
     */
    maxBPM?: number;
}
/**
 * Shared type for Deezer tracks, playlists and albums
 */
declare type Deezer = DeezerTrack | DeezerPlaylist | DeezerAlbum;
/**
 * Fetches the information for a track, playlist or album on Deezer
 * @param url The track, playlist or album URL
 * @returns A {@link DeezerTrack}, {@link DeezerPlaylist} or {@link DeezerAlbum}
 * object depending on the provided URL.
 */
declare function deezer(url: string): Promise<Deezer>;
/**
 * Validates a Deezer URL
 * @param url The URL to validate
 * @returns The type of the URL either `'track'`, `'playlist'`, `'album'`, `'search'` or `false`.
 * `false` means that the provided URL was a wrongly formatted or an unsupported Deezer URL.
 */
declare function dz_validate(url: string): Promise<'track' | 'playlist' | 'album' | 'search' | false>;
/**
 * Searches Deezer for tracks using the specified metadata.
 * @param options The metadata and limit for the search
 *
 * * limit?: The maximum number of results to return, maximum `100`, defaults to `10`.
 * * artist?: The name of the artist
 * * album?: The title of the album
 * * title?: The title of the track
 * * label?: The label that released the track
 * * minDurationInSec?: The minimum duration in seconds
 * * maxDurationInSec?: The maximum duration in seconds
 * * minBpm?: The minimum BPM
 * * maxBpm?: The minimum BPM
 * @returns An array of tracks matching the metadata
 */
declare function dz_advanced_track_search(options: DeezerAdvancedSearchOptions): Promise<DeezerTrack[]>;

interface tokenOptions {
    spotify?: {
        client_id: string;
        client_secret: string;
        refresh_token: string;
        market: string;
    };
    soundcloud?: {
        client_id: string;
    };
    youtube?: {
        cookie: string;
    };
    useragent?: string[];
}
/**
 * Sets
 *
 *  i> YouTube :- cookies.
 *
 *  ii> SoundCloud :- client ID.
 *
 *  iii> Spotify :- client ID, client secret, refresh token, market.
 *
 *  iv> Useragents :- array of string.
 *
 * locally in memory.
 *
 * Example :
 * ```ts
 * play.setToken({
 *      youtube : {
 *          cookie : "Your Cookies"
 *      }
 * }) // YouTube Cookies
 *
 * await play.setToken({
 *      spotify : {
 *          client_id: 'ID',
            client_secret: 'secret',
            refresh_token: 'token',
            market: 'US'
 *      }
 * }) // Await this only when setting data for spotify
 *
 * play.setToken({
 *      useragent: ['Your User-agent']
 * }) // Use this to avoid 429 errors.
 * ```
 * @param options {@link tokenOptions}
 */
declare function setToken(options: tokenOptions): Promise<void>;

interface SearchOptions {
    limit?: number;
    source?: {
        youtube?: 'video' | 'playlist' | 'channel';
        spotify?: 'album' | 'playlist' | 'track';
        soundcloud?: 'tracks' | 'playlists' | 'albums';
        deezer?: 'track' | 'playlist' | 'album';
    };
    fuzzy?: boolean;
    language?: string;
    /**
     * !!! Before enabling this for public servers, please consider using Discord features like NSFW channels as not everyone in your server wants to see NSFW images. !!!
     * Unblurred images will likely have different dimensions than specified in the {@link YouTubeThumbnail} objects.
     */
    unblurNSFWThumbnails?: boolean;
}

declare function stream(url: string, options: {
    seek?: number;
} & StreamOptions): Promise<YouTubeStream>;
declare function stream(url: string, options?: StreamOptions): Promise<YouTubeStream | SoundCloudStream>;
declare function search(query: string, options: {
    source: {
        deezer: 'album';
    };
} & SearchOptions): Promise<DeezerAlbum[]>;
declare function search(query: string, options: {
    source: {
        deezer: 'playlist';
    };
} & SearchOptions): Promise<DeezerPlaylist[]>;
declare function search(query: string, options: {
    source: {
        deezer: 'track';
    };
} & SearchOptions): Promise<DeezerTrack[]>;
declare function search(query: string, options: {
    source: {
        soundcloud: 'albums';
    };
} & SearchOptions): Promise<SoundCloudPlaylist[]>;
declare function search(query: string, options: {
    source: {
        soundcloud: 'playlists';
    };
} & SearchOptions): Promise<SoundCloudPlaylist[]>;
declare function search(query: string, options: {
    source: {
        soundcloud: 'tracks';
    };
} & SearchOptions): Promise<SoundCloudTrack[]>;
declare function search(query: string, options: {
    source: {
        spotify: 'album';
    };
} & SearchOptions): Promise<SpotifyAlbum[]>;
declare function search(query: string, options: {
    source: {
        spotify: 'playlist';
    };
} & SearchOptions): Promise<SpotifyPlaylist[]>;
declare function search(query: string, options: {
    source: {
        spotify: 'track';
    };
} & SearchOptions): Promise<SpotifyTrack[]>;
declare function search(query: string, options: {
    source: {
        youtube: 'channel';
    };
} & SearchOptions): Promise<YouTubeChannel[]>;
declare function search(query: string, options: {
    source: {
        youtube: 'playlist';
    };
} & SearchOptions): Promise<YouTubePlayList[]>;
declare function search(query: string, options: {
    source: {
        youtube: 'video';
    };
} & SearchOptions): Promise<YouTubeVideo[]>;
declare function search(query: string, options: {
    limit: number;
} & SearchOptions): Promise<YouTubeVideo[]>;
declare function search(query: string, options?: SearchOptions): Promise<YouTubeVideo[]>;
declare function stream_from_info(info: SoundCloudTrack, options?: StreamOptions): Promise<SoundCloudStream>;
declare function stream_from_info(info: InfoData, options?: StreamOptions): Promise<YouTubeStream>;
/**
 * Validates url that play-dl supports.
 *
 * - `so` - SoundCloud
 * - `sp` - Spotify
 * - `dz` - Deezer
 * - `yt` - YouTube
 * @param url URL
 * @returns
 * ```ts
 * 'so_playlist' / 'so_track' | 'sp_track' | 'sp_album' | 'sp_playlist' | 'dz_track' | 'dz_playlist' | 'dz_album' | 'yt_video' | 'yt_playlist' | 'search' | false
 * ```
 */
declare function validate(url: string): Promise<'so_playlist' | 'so_track' | 'sp_track' | 'sp_album' | 'sp_playlist' | 'dz_track' | 'dz_playlist' | 'dz_album' | 'yt_video' | 'yt_playlist' | 'search' | false>;
/**
 * Authorization interface for Spotify, SoundCloud and YouTube.
 *
 * Either stores info in `.data` folder or shows relevant data to be used in `setToken` function.
 *
 * ```ts
 * const play = require('play-dl')
 *
 * play.authorization()
 * ```
 *
 * Just run the above command and you will get a interface asking some questions.
 */
declare function authorization(): void;
/**
 * Attaches paused, playing, autoPaused Listeners to discordjs voice AudioPlayer.
 *
 * Useful if you don't want extra data to be downloaded by play-dl.
 * @param player discordjs voice AudioPlayer
 * @param resource A {@link YouTubeStream} or {@link SoundCloudStream}
 */
declare function attachListeners(player: EventEmitter, resource: YouTubeStream | SoundCloudStream): void;

declare const _default: {
    DeezerAlbum: typeof DeezerAlbum;
    DeezerPlaylist: typeof DeezerPlaylist;
    DeezerTrack: typeof DeezerTrack;
    SoundCloudPlaylist: typeof SoundCloudPlaylist;
    SoundCloudStream: typeof SoundCloudStream;
    SoundCloudTrack: typeof SoundCloudTrack;
    SpotifyAlbum: typeof SpotifyAlbum;
    SpotifyPlaylist: typeof SpotifyPlaylist;
    SpotifyTrack: typeof SpotifyTrack;
    YouTubeChannel: typeof YouTubeChannel;
    YouTubePlayList: typeof YouTubePlayList;
    YouTubeVideo: typeof YouTubeVideo;
    attachListeners: typeof attachListeners;
    authorization: typeof authorization;
    decipher_info: typeof decipher_info;
    deezer: typeof deezer;
    dz_advanced_track_search: typeof dz_advanced_track_search;
    dz_validate: typeof dz_validate;
    extractID: typeof extractID;
    getFreeClientID: typeof getFreeClientID;
    is_expired: typeof is_expired;
    playlist_info: typeof playlist_info;
    refreshToken: typeof refreshToken;
    search: typeof search;
    setToken: typeof setToken;
    so_validate: typeof so_validate;
    soundcloud: typeof soundcloud;
    spotify: typeof spotify;
    sp_validate: typeof sp_validate;
    stream: typeof stream;
    stream_from_info: typeof stream_from_info;
    validate: typeof validate;
    video_basic_info: typeof video_basic_info;
    video_info: typeof video_info;
    yt_validate: typeof yt_validate;
};

export { Deezer, DeezerAlbum, DeezerPlaylist, DeezerTrack, InfoData, SoundCloud, SoundCloudPlaylist, SoundCloudStream, SoundCloudTrack, Spotify, SpotifyAlbum, SpotifyPlaylist, SpotifyTrack, YouTube, YouTubeChannel, YouTubePlayList, YouTubeStream, YouTubeVideo, attachListeners, authorization, decipher_info, deezer, _default as default, dz_advanced_track_search, dz_validate, extractID, getFreeClientID, is_expired, playlist_info, refreshToken, search, setToken, so_validate, soundcloud, sp_validate, spotify, stream, stream_from_info, validate, video_basic_info, video_info, yt_validate };
