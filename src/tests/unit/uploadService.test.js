const UploadService = require('../../../src/services/uploadService');
const ErrorResponse = require('../../../src/utils/ErrorResponse');

describe('UploadService', () => {
    describe('processFile', () => {
        it('should process file and return metadata', async () => {
            const mockFile = {
                filename: 'test-123.jpg',
                originalname: 'test.jpg',
                mimetype: 'image/jpeg',
                size: 1024,
                path: '/uploads/user123/2026-01-09/test-123.jpg',
                destination: '/uploads/user123/2026-01-09'
            };

            const result = await UploadService.processFile(mockFile);

            expect(result).toBeDefined();
            expect(result.filename).toBe('test-123.jpg');
            expect(result.originalName).toBe('test.jpg');
            expect(result.mimetype).toBe('image/jpeg');
            expect(result.size).toBe(1024);
            expect(result.url).toBeDefined();
            expect(result.uploadedAt).toBeInstanceOf(Date);
        });

        it('should throw error if no file provided', async () => {
            await expect(UploadService.processFile(null)).rejects.toThrow();
        });
    });

    describe('processMultipleFiles', () => {
        it('should process multiple files', async () => {
            const mockFiles = [
                {
                    filename: 'test1-123.jpg',
                    originalname: 'test1.jpg',
                    mimetype: 'image/jpeg',
                    size: 1024,
                    path: '/uploads/user123/2026-01-09/test1-123.jpg',
                    destination: '/uploads/user123/2026-01-09'
                },
                {
                    filename: 'test2-456.jpg',
                    originalname: 'test2.jpg',
                    mimetype: 'image/jpeg',
                    size: 2048,
                    path: '/uploads/user123/2026-01-09/test2-456.jpg',
                    destination: '/uploads/user123/2026-01-09'
                }
            ];

            const result = await UploadService.processMultipleFiles(mockFiles);

            expect(result).toHaveLength(2);
            expect(result[0].filename).toBe('test1-123.jpg');
            expect(result[1].filename).toBe('test2-456.jpg');
        });

        it('should throw error if no files provided', async () => {
            await expect(UploadService.processMultipleFiles([])).rejects.toThrow();
        });
    });

    describe('generateFileUrl', () => {
        it('should generate correct URL from file path', () => {
            const mockFile = {
                path: 'c:\\uploads\\user123\\2026-01-09\\test.jpg',
                filename: 'test.jpg'
            };

            const url = UploadService.generateFileUrl(mockFile);

            expect(url).toContain('/uploads/');
            expect(url).toContain('test.jpg');
        });

        it('should handle path without uploads directory', () => {
            const mockFile = {
                path: '/some/other/path/test.jpg',
                filename: 'test.jpg'
            };

            const url = UploadService.generateFileUrl(mockFile);

            expect(url).toBe('/uploads/test.jpg');
        });
    });

    describe('validateFileSize', () => {
        it('should not throw for valid file size', () => {
            expect(() => {
                UploadService.validateFileSize(1024, 2048);
            }).not.toThrow();
        });

        it('should throw error for oversized file', () => {
            expect(() => {
                UploadService.validateFileSize(3000, 2048);
            }).toThrow(ErrorResponse);
        });
    });

    describe('validateFileType', () => {
        it('should not throw for valid file type', () => {
            expect(() => {
                UploadService.validateFileType('image/jpeg', ['image/jpeg', 'image/png']);
            }).not.toThrow();
        });

        it('should throw error for invalid file type', () => {
            expect(() => {
                UploadService.validateFileType('application/exe', ['image/jpeg', 'image/png']);
            }).toThrow(ErrorResponse);
        });
    });
});
