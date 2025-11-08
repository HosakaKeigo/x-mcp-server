import type { TwitterApi } from "twitter-api-v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadImage, uploadVideo } from "../src/utils/media-upload.js";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

vi.mock("node:fs/promises");

const mockUploadMedia = vi.hoisted(() => vi.fn());

describe("uploadImage", () => {
	let mockClient: TwitterApi;

	beforeEach(() => {
		mockUploadMedia.mockClear();
		vi.mocked(stat).mockClear();
		vi.mocked(readFile).mockClear();

		mockClient = {
			v1: {
				uploadMedia: mockUploadMedia,
			},
		} as unknown as TwitterApi;
	});

	it("should successfully upload a valid PNG image", async () => {
		const imagePath = "/path/to/image.png";
		const mockBuffer = Buffer.from("fake image data");
		const mockMediaId = "1234567890";

		vi.mocked(stat).mockResolvedValue({
			isFile: () => true,
			size: 1024 * 1024, // 1MB
		} as any);

		vi.mocked(readFile).mockResolvedValue(mockBuffer);
		mockUploadMedia.mockResolvedValue(mockMediaId);

		const result = await uploadImage(mockClient, imagePath);

		expect(result).toBe(mockMediaId);
		expect(stat).toHaveBeenCalledWith(resolve(imagePath));
		expect(readFile).toHaveBeenCalledWith(resolve(imagePath));
		expect(mockUploadMedia).toHaveBeenCalledWith(mockBuffer, {
			mimeType: "image/png",
		});
	});

	it.each([
		{ ext: "jpg", mime: "image/jpeg" },
		{ ext: "jpeg", mime: "image/jpeg" },
		{ ext: "gif", mime: "image/gif" },
		{ ext: "webp", mime: "image/webp" },
	])("should upload $ext image with correct MIME type", async ({ ext, mime }) => {
		const imagePath = `/path/to/image.${ext}`;
		const mockBuffer = Buffer.from("fake image data");
		const mockMediaId = "1234567890";

		vi.mocked(stat).mockResolvedValue({
			isFile: () => true,
			size: 1024 * 1024,
		} as any);

		vi.mocked(readFile).mockResolvedValue(mockBuffer);
		mockUploadMedia.mockResolvedValue(mockMediaId);

		await uploadImage(mockClient, imagePath);

		expect(mockUploadMedia).toHaveBeenCalledWith(mockBuffer, {
			mimeType: mime,
		});
	});

	it("should throw error when file does not exist", async () => {
		vi.mocked(stat).mockRejectedValue(new Error("ENOENT"));

		await expect(uploadImage(mockClient, "/nonexistent/image.png")).rejects.toThrow(
			"File not found: image.png",
		);
	});

	it("should throw error when path is a directory", async () => {
		vi.mocked(stat).mockResolvedValue({
			isFile: () => false,
		} as any);

		await expect(uploadImage(mockClient, "/path/to/directory")).rejects.toThrow(
			"Path is not a file: directory",
		);
	});

	it("should throw error when image exceeds 5MB limit", async () => {
		const largeSize = 6 * 1024 * 1024; // 6MB

		vi.mocked(stat).mockResolvedValue({
			isFile: () => true,
			size: largeSize,
		} as any);

		await expect(uploadImage(mockClient, "/path/to/large-image.png")).rejects.toThrow(
			"Image size exceeds 5MB limit",
		);
	});

	it("should throw error for unsupported image format", async () => {
		vi.mocked(stat).mockResolvedValue({
			isFile: () => true,
			size: 1024 * 1024,
		} as any);

		await expect(uploadImage(mockClient, "/path/to/image.bmp")).rejects.toThrow(
			"Unsupported image format. Supported formats: png, jpg, jpeg, gif, webp",
		);
	});
});

describe("uploadVideo", () => {
	let mockClient: TwitterApi;

	beforeEach(() => {
		mockUploadMedia.mockClear();
		vi.mocked(stat).mockClear();
		vi.mocked(readFile).mockClear();

		mockClient = {
			v1: {
				uploadMedia: mockUploadMedia,
			},
		} as unknown as TwitterApi;
	});

	it("should successfully upload a valid MP4 video", async () => {
		const videoPath = "/path/to/video.mp4";
		const mockBuffer = Buffer.from("fake video data");
		const mockMediaId = "9876543210";

		vi.mocked(stat).mockResolvedValue({
			isFile: () => true,
			size: 10 * 1024 * 1024, // 10MB
		} as any);

		vi.mocked(readFile).mockResolvedValue(mockBuffer);
		mockUploadMedia.mockResolvedValue(mockMediaId);

		const result = await uploadVideo(mockClient, videoPath);

		expect(result).toBe(mockMediaId);
		expect(stat).toHaveBeenCalledWith(resolve(videoPath));
		expect(readFile).toHaveBeenCalledWith(resolve(videoPath));
		expect(mockUploadMedia).toHaveBeenCalledWith(mockBuffer, {
			mimeType: "video/mp4",
			target: "tweet",
			longVideo: false,
		});
	});

	it("should use longVideo flag for videos larger than 15MB", async () => {
		const videoPath = "/path/to/large-video.mp4";
		const mockBuffer = Buffer.from("fake large video data");
		const mockMediaId = "9876543210";

		vi.mocked(stat).mockResolvedValue({
			isFile: () => true,
			size: 20 * 1024 * 1024, // 20MB
		} as any);

		vi.mocked(readFile).mockResolvedValue(mockBuffer);
		mockUploadMedia.mockResolvedValue(mockMediaId);

		await uploadVideo(mockClient, videoPath);

		expect(mockUploadMedia).toHaveBeenCalledWith(mockBuffer, {
			mimeType: "video/mp4",
			target: "tweet",
			longVideo: true,
		});
	});

	it.each([
		{ ext: "mp4", mime: "video/mp4" },
		{ ext: "mov", mime: "video/quicktime" },
		{ ext: "avi", mime: "video/x-msvideo" },
		{ ext: "webm", mime: "video/webm" },
		{ ext: "m4v", mime: "video/x-m4v" },
	])("should upload $ext video with correct MIME type", async ({ ext, mime }) => {
		const videoPath = `/path/to/video.${ext}`;
		const mockBuffer = Buffer.from("fake video data");
		const mockMediaId = "9876543210";

		vi.mocked(stat).mockResolvedValue({
			isFile: () => true,
			size: 10 * 1024 * 1024,
		} as any);

		vi.mocked(readFile).mockResolvedValue(mockBuffer);
		mockUploadMedia.mockResolvedValue(mockMediaId);

		await uploadVideo(mockClient, videoPath);

		expect(mockUploadMedia).toHaveBeenCalledWith(mockBuffer, {
			mimeType: mime,
			target: "tweet",
			longVideo: false,
		});
	});

	it("should throw error when video file does not exist", async () => {
		vi.mocked(stat).mockRejectedValue(new Error("ENOENT"));

		await expect(uploadVideo(mockClient, "/nonexistent/video.mp4")).rejects.toThrow(
			"File not found: video.mp4",
		);
	});

	it("should throw error when video path is a directory", async () => {
		vi.mocked(stat).mockResolvedValue({
			isFile: () => false,
		} as any);

		await expect(uploadVideo(mockClient, "/path/to/directory")).rejects.toThrow(
			"Path is not a file: directory",
		);
	});

	it("should throw error when video exceeds 512MB limit", async () => {
		const largeSize = 513 * 1024 * 1024; // 513MB

		vi.mocked(stat).mockResolvedValue({
			isFile: () => true,
			size: largeSize,
		} as any);

		await expect(uploadVideo(mockClient, "/path/to/large-video.mp4")).rejects.toThrow(
			"Video size exceeds 512MB limit",
		);
	});

	it("should throw error for unsupported video format", async () => {
		vi.mocked(stat).mockResolvedValue({
			isFile: () => true,
			size: 10 * 1024 * 1024,
		} as any);

		await expect(uploadVideo(mockClient, "/path/to/video.mkv")).rejects.toThrow(
			"Unsupported video format. Supported formats: mp4, mov, avi, webm, m4v",
		);
	});
});
