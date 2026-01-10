const PostService = require('../../../src/services/postService');
const Post = require('../../../src/models/Post');
const ErrorResponse = require('../../../src/utils/ErrorResponse');

// Mock the Post model
jest.mock('../../../src/models/Post');

describe('PostService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createPost', () => {
        it('should create a post with valid data', async () => {
            const mockPost = {
                _id: 'post123',
                title: 'Test Post',
                content: 'Test content',
                category: 'general',
                author: 'user123',
                populate: jest.fn().mockResolvedValue({
                    _id: 'post123',
                    title: 'Test Post',
                    author: { name: 'Test User' }
                })
            };

            Post.create = jest.fn().mockResolvedValue(mockPost);

            const result = await PostService.createPost({
                title: 'Test Post',
                content: 'Test content',
                category: 'general'
            }, 'user123');

            expect(Post.create).toHaveBeenCalledWith({
                title: 'Test Post',
                content: 'Test content',
                category: 'general',
                author: 'user123'
            });
            expect(result).toBeDefined();
        });

        it('should throw error if title is missing', async () => {
            await expect(PostService.createPost({
                content: 'Test content',
                category: 'general'
            }, 'user123')).rejects.toThrow(ErrorResponse);
        });

        it('should throw error if content is missing', async () => {
            await expect(PostService.createPost({
                title: 'Test Post',
                category: 'general'
            }, 'user123')).rejects.toThrow(ErrorResponse);
        });

        it('should throw error if category is missing', async () => {
            await expect(PostService.createPost({
                title: 'Test Post',
                content: 'Test content'
            }, 'user123')).rejects.toThrow(ErrorResponse);
        });
    });

    describe('getPosts', () => {
        it('should return paginated posts', async () => {
            const mockPosts = [
                { _id: 'post1', title: 'Post 1' },
                { _id: 'post2', title: 'Post 2' }
            ];

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockPosts)
            };

            Post.find = jest.fn().mockReturnValue(mockQuery);
            Post.countDocuments = jest.fn().mockResolvedValue(10);

            const result = await PostService.getPosts({ page: 1, limit: 20 });

            expect(result.posts).toEqual(mockPosts);
            expect(result.pagination).toBeDefined();
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.total).toBe(10);
        });
    });

    describe('getPostById', () => {
        it('should return post by ID', async () => {
            const mockPost = {
                _id: 'post123',
                title: 'Test Post'
            };

            const mockQuery = {
                populate: jest.fn().mockResolvedValue(mockPost)
            };

            Post.findById = jest.fn().mockReturnValue(mockQuery);

            const result = await PostService.getPostById('post123');

            expect(Post.findById).toHaveBeenCalledWith('post123');
            expect(result).toEqual(mockPost);
        });

        it('should throw error if post not found', async () => {
            const mockQuery = {
                populate: jest.fn().mockResolvedValue(null)
            };

            Post.findById = jest.fn().mockReturnValue(mockQuery);

            await expect(PostService.getPostById('invalid')).rejects.toThrow(ErrorResponse);
        });
    });

    describe('updatePost', () => {
        it('should update post if user is author', async () => {
            const mockPost = {
                _id: 'post123',
                title: 'Old Title',
                content: 'Old Content',
                author: 'user123',
                save: jest.fn().mockResolvedValue(true),
                populate: jest.fn().mockResolvedValue({
                    _id: 'post123',
                    title: 'New Title'
                })
            };

            Post.findById = jest.fn().mockResolvedValue(mockPost);

            const result = await PostService.updatePost(
                'post123',
                { title: 'New Title' },
                'user123',
                'user'
            );

            expect(mockPost.title).toBe('New Title');
            expect(mockPost.save).toHaveBeenCalled();
        });

        it('should throw error if user is not authorized', async () => {
            const mockPost = {
                _id: 'post123',
                author: 'user123'
            };

            Post.findById = jest.fn().mockResolvedValue(mockPost);

            await expect(PostService.updatePost(
                'post123',
                { title: 'New Title' },
                'user456',
                'user'
            )).rejects.toThrow(ErrorResponse);
        });
    });

    describe('deletePost', () => {
        it('should delete post if user is author', async () => {
            const mockPost = {
                _id: 'post123',
                author: 'user123',
                deleteOne: jest.fn().mockResolvedValue(true)
            };

            Post.findById = jest.fn().mockResolvedValue(mockPost);

            const result = await PostService.deletePost('post123', 'user123', 'user');

            expect(mockPost.deleteOne).toHaveBeenCalled();
            expect(result.message).toBe('Post deleted successfully');
        });

        it('should allow admin to delete any post', async () => {
            const mockPost = {
                _id: 'post123',
                author: 'user123',
                deleteOne: jest.fn().mockResolvedValue(true)
            };

            Post.findById = jest.fn().mockResolvedValue(mockPost);

            const result = await PostService.deletePost('post123', 'admin456', 'admin');

            expect(mockPost.deleteOne).toHaveBeenCalled();
        });
    });

    describe('toggleLike', () => {
        it('should add like if not already liked', async () => {
            const mockPost = {
                _id: 'post123',
                likes: [],
                save: jest.fn().mockResolvedValue(true)
            };

            Post.findById = jest.fn().mockResolvedValue(mockPost);

            const result = await PostService.toggleLike('post123', 'user123');

            expect(mockPost.likes).toContain('user123');
            expect(result.liked).toBe(true);
            expect(result.likeCount).toBe(1);
        });

        it('should remove like if already liked', async () => {
            const mockPost = {
                _id: 'post123',
                likes: ['user123'],
                save: jest.fn().mockResolvedValue(true)
            };

            Post.findById = jest.fn().mockResolvedValue(mockPost);

            const result = await PostService.toggleLike('post123', 'user123');

            expect(mockPost.likes).not.toContain('user123');
            expect(result.liked).toBe(false);
            expect(result.likeCount).toBe(0);
        });
    });
});
