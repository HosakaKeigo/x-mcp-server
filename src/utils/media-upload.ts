import type { TwitterApi } from "twitter-api-v2";
import { readFile, stat } from "node:fs/promises";
import { resolve, basename } from "node:path";

/**
 * Supported image formats and their MIME types
 */
const IMAGE_MIME_TYPES: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	webp: "image/webp",
};

/**
 * Supported video formats and their MIME types
 */
const VIDEO_MIME_TYPES: Record<string, string> = {
	mp4: "video/mp4",
	mov: "video/quicktime",
	avi: "video/x-msvideo",
	webm: "video/webm",
	m4v: "video/x-m4v",
};

/**
 * Maximum file size for images (5MB)
 */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Maximum file size for videos (512MB)
 */
const MAX_VIDEO_SIZE = 512 * 1024 * 1024;

/**
 * Upload an image to Twitter and return the media ID
 * @param client - Authenticated Twitter API client
 * @param imagePath - Absolute or relative path to the image file
 * @returns Media ID for the uploaded image
 * @throws Error if file is invalid or upload fails
 */
export async function uploadImage(client: TwitterApi, imagePath: string): Promise<string> {
	// Sanitize path to prevent directory traversal
	const sanitizedPath = resolve(imagePath);

	// Validate file exists and get stats
	let fileStats;
	try {
		fileStats = await stat(sanitizedPath);
	} catch {
		throw new Error(`File not found: ${basename(sanitizedPath)}`);
	}

	// Check if it's a file (not a directory)
	if (!fileStats.isFile()) {
		throw new Error(`Path is not a file: ${basename(sanitizedPath)}`);
	}

	// Check file size (Twitter image limit: 5MB)
	if (fileStats.size > MAX_IMAGE_SIZE) {
		throw new Error(
			`Image size exceeds 5MB limit (${(fileStats.size / 1024 / 1024).toFixed(2)}MB)`,
		);
	}

	// Detect MIME type from file extension
	const ext = sanitizedPath.toLowerCase().split(".").pop();
	if (!ext || !IMAGE_MIME_TYPES[ext]) {
		const supported = Object.keys(IMAGE_MIME_TYPES).join(", ");
		throw new Error(`Unsupported image format. Supported formats: ${supported}`);
	}

	const mimeType = IMAGE_MIME_TYPES[ext];

	// Read and upload file
	const imageBuffer = await readFile(sanitizedPath);
	return await client.v1.uploadMedia(imageBuffer, { mimeType });
}

/**
 * Upload a video to Twitter and return the media ID
 * @param client - Authenticated Twitter API client
 * @param videoPath - Absolute or relative path to the video file
 * @returns Media ID for the uploaded video
 * @throws Error if file is invalid or upload fails
 */
export async function uploadVideo(client: TwitterApi, videoPath: string): Promise<string> {
	// Sanitize path to prevent directory traversal
	const sanitizedPath = resolve(videoPath);

	// Validate file exists and get stats
	let fileStats;
	try {
		fileStats = await stat(sanitizedPath);
	} catch {
		throw new Error(`File not found: ${basename(sanitizedPath)}`);
	}

	// Check if it's a file (not a directory)
	if (!fileStats.isFile()) {
		throw new Error(`Path is not a file: ${basename(sanitizedPath)}`);
	}

	// Check file size (Twitter video limit: 512MB)
	if (fileStats.size > MAX_VIDEO_SIZE) {
		throw new Error(
			`Video size exceeds 512MB limit (${(fileStats.size / 1024 / 1024).toFixed(2)}MB)`,
		);
	}

	// Detect MIME type from file extension
	const ext = sanitizedPath.toLowerCase().split(".").pop();
	if (!ext || !VIDEO_MIME_TYPES[ext]) {
		const supported = Object.keys(VIDEO_MIME_TYPES).join(", ");
		throw new Error(`Unsupported video format. Supported formats: ${supported}`);
	}

	const mimeType = VIDEO_MIME_TYPES[ext];

	// Read video file
	const videoBuffer = await readFile(sanitizedPath);

	// Upload video using chunked upload
	// Use longVideo flag for files > 15MB
	return await client.v1.uploadMedia(videoBuffer, {
		mimeType,
		target: "tweet",
		longVideo: fileStats.size > 15 * 1024 * 1024,
	});
}
