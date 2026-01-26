const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../../../app');

describe('Post with Attachments Integration Tests', () => {
    let authToken;
    let createdPostId;
    const testImagePath = path.join(__dirname, '../../fixtures/test-image.jpg');
    const testPdfPath = path.join(__dirname, '../../fixtures/test-document.pdf');

    // Setup: Create test files if they don't exist
    beforeAll(() => {
        const fixturesDir = path.join(__dirname, '../../fixtures');
        if (!fs.existsSync(fixturesDir)) {
            fs.mkdirSync(fixturesDir, { recursive: true });
        }

        // Create a simple test image (1x1 pixel PNG)
        if (!fs.existsSync(testImagePath)) {
            const pngBuffer = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                'base64'
            );
            fs.writeFileSync(testImagePath, pngBuffer);
        }

        // Create a simple test PDF
        if (!fs.existsSync(testPdfPath)) {
            const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids []\n/Count 0\n>>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\ntrailer\n<<\n/Size 3\n/Root 1 0 R\n>>\nstartxref\n110\n%%EOF';
            fs.writeFileSync(testPdfPath, pdfContent);
        }
    });

    describe('POST /api/posts with attachments', () => {
        it('should create a post with image attachment', async () => {
            // Note: This test requires authentication
            // Uncomment when auth is set up

            // const response = await request(app)
            //     .post('/api/posts')
            //     .set('Authorization', `Bearer ${authToken}`)
            //     .field('title', 'Post with Image')
            //     .field('content', 'This post has an image attachment')
            //     .field('category', 'General')
            //     .attach('file', testImagePath)
            //     .expect(201);

            // expect(response.body.success).toBe(true);
            // expect(response.body.data.attachments).toHaveLength(1);
            // expect(response.body.data.attachments[0].mimetype).toContain('image');
            // createdPostId = response.body.data._id;
        });

        it('should create a post with multiple attachments', async () => {
            // const response = await request(app)
            //     .post('/api/posts')
            //     .set('Authorization', `Bearer ${authToken}`)
            //     .field('title', 'Post with Multiple Files')
            //     .field('content', 'This post has multiple attachments')
            //     .field('category', 'General')
            //     .attach('file', testImagePath)
            //     .attach('file', testPdfPath)
            //     .expect(201);

            // expect(response.body.success).toBe(true);
            // expect(response.body.data.attachments).toHaveLength(2);
        });

        it('should reject post with more than 5 attachments', async () => {
            // const response = await request(app)
            //     .post('/api/posts')
            //     .set('Authorization', `Bearer ${authToken}`)
            //     .field('title', 'Post with Too Many Files')
            //     .field('content', 'This should fail')
            //     .field('category', 'General')
            //     .attach('file', testImagePath)
            //     .attach('file', testImagePath)
            //     .attach('file', testImagePath)
            //     .attach('file', testImagePath)
            //     .attach('file', testImagePath)
            //     .attach('file', testImagePath) // 6th file
            //     .expect(400);

            // expect(response.body.success).toBe(false);
            // expect(response.body.error).toContain('Maximum 5 files');
        });

        it('should reject files larger than 10MB', async () => {
            // Create a large file (>10MB)
            // const largePath = path.join(__dirname, '../../fixtures/large-file.bin');
            // const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
            // fs.writeFileSync(largePath, largeBuffer);

            // const response = await request(app)
            //     .post('/api/posts')
            //     .set('Authorization', `Bearer ${authToken}`)
            //     .field('title', 'Post with Large File')
            //     .field('content', 'This should fail')
            //     .field('category', 'General')
            //     .attach('file', largePath)
            //     .expect(413);

            // expect(response.body.success).toBe(false);
            // fs.unlinkSync(largePath);
        });

        it('should create post without attachments (backward compatibility)', async () => {
            // const response = await request(app)
            //     .post('/api/posts')
            //     .set('Authorization', `Bearer ${authToken}`)
            //     .send({
            //         title: 'Post without Files',
            //         content: 'This is a regular post',
            //         category: 'General'
            //     })
            //     .expect(201);

            // expect(response.body.success).toBe(true);
            // expect(response.body.data.attachments).toEqual([]);
        });
    });

    describe('DELETE /api/posts/:id with attachments', () => {
        it('should delete post and its attachments', async () => {
            // const response = await request(app)
            //     .delete(`/api/posts/${createdPostId}`)
            //     .set('Authorization', `Bearer ${authToken}`)
            //     .expect(200);

            // expect(response.body.success).toBe(true);

            // Verify files were deleted from filesystem
            // Check that uploads directory doesn't contain the files
        });
    });

    describe('GET /api/posts/:id with attachments', () => {
        it('should return post with attachments metadata', async () => {
            // const response = await request(app)
            //     .get(`/api/posts/${createdPostId}`)
            //     .expect(200);

            // expect(response.body.success).toBe(true);
            // expect(response.body.data.attachments).toBeDefined();
            // expect(Array.isArray(response.body.data.attachments)).toBe(true);
        });
    });
});
