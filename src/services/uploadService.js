const fs = require('fs').promises;
const path = require('path');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Upload Service
 * Business logic for file upload operations
 */

class UploadService {
    /**
     * Process uploaded file and extract metadata
     * @param {Object} file - Multer file object
     * @returns {Object} File metadata
     */
    static async processFile(file) {
        if (!file) {
            throw ErrorResponse.badRequest('No file provided', 'NO_FILE');
        }

        try {
            // Extract file metadata
            const metadata = {
                filename: file.filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path,
                destination: file.destination,
                url: this.generateFileUrl(file),
                uploadedAt: new Date(),
            };

            logger.info('File processed successfully', {
                filename: metadata.filename,
                size: metadata.size,
                mimetype: metadata.mimetype,
            });

            return metadata;
        } catch (error) {
            logger.error('Error processing file', { error: error.message });
            throw ErrorResponse.internal('Error processing file');
        }
    }

    /**
     * Process multiple uploaded files
     * @param {Array} files - Array of multer file objects
     * @returns {Array} Array of file metadata
     */
    static async processMultipleFiles(files) {
        if (!files || files.length === 0) {
            throw ErrorResponse.badRequest('No files provided', 'NO_FILES');
        }

        try {
            const processedFiles = await Promise.all(
                files.map(file => this.processFile(file))
            );

            logger.info('Multiple files processed successfully', {
                count: processedFiles.length,
            });

            return processedFiles;
        } catch (error) {
            logger.error('Error processing multiple files', { error: error.message });
            throw error;
        }
    }

    /**
     * Generate public URL for uploaded file
     * @param {Object} file - Multer file object
     * @returns {string} Public URL
     */
    static generateFileUrl(file) {
        // Extract relative path from the uploads directory
        const uploadsIndex = file.path.indexOf('uploads');
        if (uploadsIndex === -1) {
            return `/uploads/${file.filename}`;
        }

        const relativePath = file.path.substring(uploadsIndex);
        return `/${relativePath.replace(/\\/g, '/')}`;
    }

    /**
     * Validate file size
     * @param {number} size - File size in bytes
     * @param {number} maxSize - Maximum allowed size in bytes
     * @throws {ErrorResponse} If file is too large
     */
    static validateFileSize(size, maxSize) {
        if (size > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
            throw ErrorResponse.payloadTooLarge(
                `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
                'FILE_TOO_LARGE'
            );
        }
    }

    /**
     * Validate file type
     * @param {string} mimetype - File MIME type
     * @param {Array} allowedTypes - Array of allowed MIME types
     * @throws {ErrorResponse} If file type is not allowed
     */
    static validateFileType(mimetype, allowedTypes) {
        if (!allowedTypes.includes(mimetype)) {
            throw ErrorResponse.badRequest(
                `File type ${mimetype} is not allowed`,
                'INVALID_FILE_TYPE'
            );
        }
    }

    /**
     * Delete file from filesystem
     * @param {string} filePath - Path to file
     * @returns {boolean} Success status
     */
    static async deleteFile(filePath) {
        try {
            // Security check: ensure path is within uploads directory
            const uploadsDir = path.resolve(process.env.UPLOAD_PATH || './uploads');
            const resolvedPath = path.resolve(filePath);

            if (!resolvedPath.startsWith(uploadsDir)) {
                throw ErrorResponse.forbidden('Invalid file path', 'INVALID_PATH');
            }

            // Check if file exists
            try {
                await fs.access(resolvedPath);
            } catch {
                throw ErrorResponse.notFound('File not found', 'FILE_NOT_FOUND');
            }

            // Delete file
            await fs.unlink(resolvedPath);

            logger.info('File deleted successfully', { path: filePath });
            return true;
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error deleting file', { error: error.message, path: filePath });
            throw ErrorResponse.internal('Error deleting file');
        }
    }

    /**
     * Delete multiple files
     * @param {Array} filePaths - Array of file paths
     * @returns {Object} Deletion results
     */
    static async deleteMultipleFiles(filePaths) {
        const results = {
            deleted: [],
            failed: [],
        };

        for (const filePath of filePaths) {
            try {
                await this.deleteFile(filePath);
                results.deleted.push(filePath);
            } catch (error) {
                results.failed.push({
                    path: filePath,
                    error: error.message,
                });
            }
        }

        logger.info('Multiple files deletion completed', {
            deleted: results.deleted.length,
            failed: results.failed.length,
        });

        return results;
    }

    /**
     * Clean up file on error
     * @param {Object} file - Multer file object
     */
    static async cleanupFile(file) {
        if (file && file.path) {
            try {
                await fs.unlink(file.path);
                logger.info('Cleaned up file after error', { path: file.path });
            } catch (error) {
                logger.error('Error cleaning up file', { error: error.message, path: file.path });
            }
        }
    }

    /**
     * Clean up multiple files on error
     * @param {Array} files - Array of multer file objects
     */
    static async cleanupMultipleFiles(files) {
        if (files && files.length > 0) {
            await Promise.all(files.map(file => this.cleanupFile(file)));
        }
    }

    /**
     * Get file information
     * @param {string} filename - Filename to look up
     * @param {string} userId - User ID (optional)
     * @returns {Object} File information
     */
    static async getFileInfo(filename, userId = null) {
        try {
            const uploadsDir = path.resolve(process.env.UPLOAD_PATH || './uploads');
            let filePath;

            if (userId) {
                // Search in user's directory
                const userDir = path.join(uploadsDir, userId);
                filePath = await this.findFileInDirectory(userDir, filename);
            } else {
                // Search in entire uploads directory
                filePath = await this.findFileInDirectory(uploadsDir, filename);
            }

            if (!filePath) {
                throw ErrorResponse.notFound('File not found', 'FILE_NOT_FOUND');
            }

            const stats = await fs.stat(filePath);

            return {
                filename,
                path: filePath,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                url: this.generateFileUrl({ path: filePath, filename }),
            };
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error getting file info', { error: error.message, filename });
            throw ErrorResponse.internal('Error retrieving file information');
        }
    }

    /**
     * Find file in directory recursively
     * @param {string} directory - Directory to search
     * @param {string} filename - Filename to find
     * @returns {string|null} File path or null if not found
     */
    static async findFileInDirectory(directory, filename) {
        try {
            const entries = await fs.readdir(directory, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(directory, entry.name);

                if (entry.isDirectory()) {
                    const found = await this.findFileInDirectory(fullPath, filename);
                    if (found) return found;
                } else if (entry.name === filename) {
                    return fullPath;
                }
            }

            return null;
        } catch (error) {
            logger.error('Error searching directory', { error: error.message, directory });
            return null;
        }
    }
}

module.exports = UploadService;
