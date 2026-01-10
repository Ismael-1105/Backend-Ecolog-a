const { createUploadMiddleware, uploadMiddlewares, FILE_TYPES, sanitizeFilename } = require('../../../src/middlewares/upload.unified');

describe('Upload Middleware', () => {
    describe('sanitizeFilename', () => {
        it('should remove special characters from filename', () => {
            const result = sanitizeFilename('test file!@#$%.txt');
            expect(result).toBe('test_file_____');
        });

        it('should limit filename length to 50 characters', () => {
            const longName = 'a'.repeat(100) + '.txt';
            const result = sanitizeFilename(longName);
            expect(result.length).toBeLessThanOrEqual(50);
        });

        it('should preserve alphanumeric characters and hyphens', () => {
            const result = sanitizeFilename('test-file_123.txt');
            expect(result).toBe('test-file_123');
        });
    });

    describe('FILE_TYPES', () => {
        it('should have image file types defined', () => {
            expect(FILE_TYPES.image).toBeDefined();
            expect(FILE_TYPES.image.mimeTypes).toContain('image/jpeg');
            expect(FILE_TYPES.image.extensions).toContain('.jpg');
            expect(FILE_TYPES.image.maxSize).toBe(10 * 1024 * 1024);
        });

        it('should have video file types defined', () => {
            expect(FILE_TYPES.video).toBeDefined();
            expect(FILE_TYPES.video.mimeTypes).toContain('video/mp4');
            expect(FILE_TYPES.video.extensions).toContain('.mp4');
            expect(FILE_TYPES.video.maxSize).toBe(50 * 1024 * 1024);
        });

        it('should have document file types defined', () => {
            expect(FILE_TYPES.document).toBeDefined();
            expect(FILE_TYPES.document.mimeTypes).toContain('application/pdf');
            expect(FILE_TYPES.document.extensions).toContain('.pdf');
            expect(FILE_TYPES.document.maxSize).toBe(10 * 1024 * 1024);
        });

        it('should have audio file types defined', () => {
            expect(FILE_TYPES.audio).toBeDefined();
            expect(FILE_TYPES.audio.mimeTypes).toContain('audio/mpeg');
            expect(FILE_TYPES.audio.extensions).toContain('.mp3');
            expect(FILE_TYPES.audio.maxSize).toBe(20 * 1024 * 1024);
        });

        it('should have "any" type with all file types', () => {
            expect(FILE_TYPES.any).toBeDefined();
            expect(FILE_TYPES.any.mimeTypes.length).toBeGreaterThan(0);
            expect(FILE_TYPES.any.extensions.length).toBeGreaterThan(0);
            expect(FILE_TYPES.any.maxSize).toBe(50 * 1024 * 1024);
        });
    });

    describe('uploadMiddlewares', () => {
        it('should have singleImage middleware', () => {
            expect(uploadMiddlewares.singleImage).toBeDefined();
        });

        it('should have singleVideo middleware', () => {
            expect(uploadMiddlewares.singleVideo).toBeDefined();
        });

        it('should have singleDocument middleware', () => {
            expect(uploadMiddlewares.singleDocument).toBeDefined();
        });

        it('should have singleAudio middleware', () => {
            expect(uploadMiddlewares.singleAudio).toBeDefined();
        });

        it('should have singleFile middleware', () => {
            expect(uploadMiddlewares.singleFile).toBeDefined();
        });

        it('should have multipleFiles middleware', () => {
            expect(uploadMiddlewares.multipleFiles).toBeDefined();
        });
    });

    describe('createUploadMiddleware', () => {
        it('should create middleware with default options', () => {
            const middleware = createUploadMiddleware();
            expect(middleware).toBeDefined();
            expect(typeof middleware).toBe('function');
        });

        it('should create middleware with custom options', () => {
            const middleware = createUploadMiddleware({
                allowedTypes: 'image',
                maxSize: 5 * 1024 * 1024,
                fieldName: 'photo'
            });
            expect(middleware).toBeDefined();
            expect(typeof middleware).toBe('function');
        });

        it('should create middleware for multiple fields', () => {
            const middleware = createUploadMiddleware({
                fields: [
                    { name: 'avatar', maxCount: 1 },
                    { name: 'gallery', maxCount: 5 }
                ]
            });
            expect(middleware).toBeDefined();
            expect(typeof middleware).toBe('function');
        });
    });
});
