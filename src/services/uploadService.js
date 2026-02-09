const fs = require('fs').promises;
const path = require('path');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');
const Upload = require('../models/Upload');

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
        // Get upload root directory from env or default
        const uploadRoot = path.resolve(process.env.UPLOAD_PATH || './uploads');
        const filePath = path.resolve(file.path);

        // Calculate relative path from upload root to file
        let relativePath = path.relative(uploadRoot, filePath);

        // Normalize path separators to forward slashes
        relativePath = relativePath.replace(/\\/g, '/');

        // Ensure path starts with /uploads/
        return `/uploads/${relativePath}`;
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

    /**
     * Save upload metadata to database
     * @param {Object} fileMetadata - File metadata from processFile
     * @param {string} userId - User ID who uploaded the file
     * @param {Object} additionalData - Additional data (title, description, category)
     * @returns {Object} Created upload document
     */
    static async saveUploadToDatabase(fileMetadata, userId, additionalData = {}) {
        let uploadData; // Declare outside try block to avoid scope issues

        try {
            const fileType = Upload.getFileTypeFromMimetype(fileMetadata.mimetype);

            uploadData = {
                filename: fileMetadata.filename,
                originalName: fileMetadata.originalName,
                title: additionalData.title || fileMetadata.originalName,
                description: additionalData.description || '',
                category: additionalData.category,
                mimetype: fileMetadata.mimetype,
                size: fileMetadata.size,
                fileType,
                url: fileMetadata.url,
                uploadedBy: userId,
            };

            const upload = await Upload.create(uploadData);
            logger.info('Upload saved to database', { uploadId: upload._id, filename: upload.filename });

            return upload;
        } catch (error) {
            logger.error('Error saving upload to database', {
                error: error.message,
                stack: error.stack,
                uploadData: uploadData ? JSON.stringify(uploadData, null, 2) : 'Not available'
            });

            // If it's a validation error, provide more details
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(e => e.message);
                throw ErrorResponse.badRequest(`Validation error: ${validationErrors.join(', ')}`, 'VALIDATION_ERROR');
            }

            throw ErrorResponse.internal('Error saving upload metadata');
        }
    }

    /**
     * Get all uploads with pagination and filters
     * @param {Object} filters - Filter options (fileType, category, uploadedBy)
     * @param {Object} pagination - Pagination options (page, limit, sort)
     * @returns {Object} Uploads and pagination info
     */
    static async getAllUploads(filters = {}, pagination = {}) {
        try {
            const {
                fileType,
                category,
                uploadedBy,
                search,
            } = filters;

            const {
                page = 1,
                limit = 20,
                sort = '-createdAt',
            } = pagination;

            // Build query
            const query = {};
            if (fileType) query.fileType = fileType;
            if (category) query.category = category;
            if (uploadedBy) query.uploadedBy = uploadedBy;
            if (search) {
                query.$text = { $search: search };
            }

            // Execute query with pagination
            const skip = (page - 1) * limit;
            const [uploads, total] = await Promise.all([
                Upload.find(query)
                    .populate('uploadedBy', 'name email')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Upload.countDocuments(query),
            ]);

            return {
                uploads,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error getting uploads', { error: error.message });
            throw ErrorResponse.internal('Error retrieving uploads');
        }
    }

    /**
     * Get uploads by user
     * @param {string} userId - User ID
     * @param {Object} pagination - Pagination options
     * @returns {Object} User's uploads and pagination info
     */
    static async getUserUploads(userId, pagination = {}) {
        return this.getAllUploads({ uploadedBy: userId }, pagination);
    }

    /**
     * Update upload metadata
     * @param {string} uploadId - Upload ID
     * @param {Object} updates - Fields to update (title, description, category)
     * @param {string} userId - User ID (for authorization)
     * @returns {Object} Updated upload
     */
    static async updateUploadMetadata(uploadId, updates, userId) {
        try {
            const upload = await Upload.findById(uploadId);

            if (!upload) {
                throw ErrorResponse.notFound('Upload not found', 'UPLOAD_NOT_FOUND');
            }

            // Check if user owns the upload
            if (upload.uploadedBy.toString() !== userId) {
                throw ErrorResponse.forbidden('Not authorized to update this upload', 'NOT_AUTHORIZED');
            }

            // Update allowed fields
            const allowedUpdates = ['title', 'description', 'category'];
            allowedUpdates.forEach(field => {
                if (updates[field] !== undefined) {
                    upload[field] = updates[field];
                }
            });

            await upload.save();
            logger.info('Upload metadata updated', { uploadId: upload._id });

            return upload;
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error updating upload metadata', { error: error.message });
            throw ErrorResponse.internal('Error updating upload');
        }
    }

    /**
     * Get file information for download and increment counter
     * @param {string} uploadId - Upload ID
     * @returns {Object} Download information (filePath, originalName)
     */
    static async getDownloadInfo(uploadId) {
        try {
            const upload = await Upload.findById(uploadId);

            if (!upload) {
                throw ErrorResponse.notFound('Upload not found', 'UPLOAD_NOT_FOUND');
            }

            // Get absolute file path
            // upload.url is like /uploads/user/date/file.ext
            // We need to resolve this against the storage root
            const relativePath = upload.url.replace('/uploads/', '');
            const uploadRoot = path.resolve(process.env.UPLOAD_PATH || './uploads');
            const filePath = path.join(uploadRoot, relativePath);

            // Verify file exists
            try {
                await fs.access(filePath);
            } catch {
                logger.error('File not found on disk', { path: filePath, uploadId });
                throw ErrorResponse.notFound('Archivo físico no encontrado', 'FILE_NOT_FOUND');
            }

            // Increment downloads
            await this.incrementDownloads(uploadId);

            return {
                filePath,
                originalName: upload.originalName,
                mimetype: upload.mimetype
            };
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error getting download info', { error: error.message, uploadId });
            throw ErrorResponse.internal('Error al preparar la descarga');
        }
    }

    /**
     * Increment download counter
     * @param {string} uploadId - Upload ID
     * @returns {Object} Updated upload
     */
    static async incrementDownloads(uploadId) {
        try {
            const upload = await Upload.findById(uploadId);

            if (!upload) {
                throw ErrorResponse.notFound('Upload not found', 'UPLOAD_NOT_FOUND');
            }

            await upload.incrementDownloads();
            logger.info('Download counter incremented', { uploadId: upload._id, downloads: upload.downloads });

            return upload;
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error incrementing downloads', { error: error.message });
            throw ErrorResponse.internal('Error updating download counter');
        }
    }

    /**
     * Delete upload (file and database record)
     * @param {string} uploadId - Upload ID
     * @param {string} userId - User ID (for authorization)
     * @returns {boolean} Success status
     */
    static async deleteUpload(uploadId, userId) {
        try {
            const upload = await Upload.findById(uploadId);

            if (!upload) {
                throw ErrorResponse.notFound('Upload not found', 'UPLOAD_NOT_FOUND');
            }

            // Check if user owns the upload
            if (upload.uploadedBy.toString() !== userId) {
                throw ErrorResponse.forbidden('Not authorized to delete this upload', 'NOT_AUTHORIZED');
            }

            // Delete file from filesystem
            await this.deleteFile(upload.url.replace(/^\//, ''));

            // Delete database record
            await Upload.findByIdAndDelete(uploadId);

            logger.info('Upload deleted successfully', { uploadId });
            return true;
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error deleting upload', { error: error.message });
            throw ErrorResponse.internal('Error deleting upload');
        }
    }
}

module.exports = UploadService;
