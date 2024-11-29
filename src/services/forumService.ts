import { prisma } from '@/lib/prisma';
import { ForumCategory, ForumThread, ForumPost } from '@/types/database';

export const forumService = {
  async getCategories(): Promise<ForumCategory[]> {
    const categories = await prisma.forumCategory.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            threads: true
          }
        },
        threads: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      created_at: category.createdAt.toISOString(),
      thread_count: category._count.threads,
      latest_thread: category.threads[0]?.createdAt.toISOString()
    }));
  },

  async getThreadsByCategory(categoryId: string): Promise<ForumThread[]> {
    const threads = await prisma.forumThread.findMany({
      where: {
        categoryId
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        author: {
          select: {
            username: true
          }
        },
        _count: {
          select: {
            posts: true
          }
        },
        posts: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    return threads.map(thread => ({
      id: thread.id,
      category_id: thread.categoryId,
      title: thread.title,
      content: thread.content,
      author_id: thread.authorId,
      created_at: thread.createdAt.toISOString(),
      updated_at: thread.updatedAt.toISOString(),
      is_pinned: thread.isPinned,
      is_locked: thread.isLocked,
      post_count: thread._count.posts,
      last_post_at: thread.posts[0]?.createdAt.toISOString() || thread.createdAt.toISOString(),
      author: {
        username: thread.author.username || 'Unknown User'
      }
    }));
  },

  async getThread(threadId: string): Promise<ForumThread> {
    const thread = await prisma.forumThread.findUnique({
      where: {
        id: threadId
      },
      include: {
        author: {
          select: {
            username: true
          }
        },
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!thread) throw new Error('Thread not found');

    return {
      id: thread.id,
      category_id: thread.categoryId,
      title: thread.title,
      content: thread.content,
      author_id: thread.authorId,
      created_at: thread.createdAt.toISOString(),
      updated_at: thread.updatedAt.toISOString(),
      is_pinned: thread.isPinned,
      is_locked: thread.isLocked,
      post_count: thread._count.posts,
      last_post_at: thread.updatedAt.toISOString(),
      author: {
        username: thread.author.username || 'Unknown User'
      }
    };
  },

  async getPosts(threadId: string): Promise<ForumPost[]> {
    const posts = await prisma.forumPost.findMany({
      where: {
        threadId
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        author: {
          select: {
            username: true
          }
        }
      }
    });

    return posts.map(post => ({
      id: post.id,
      thread_id: post.threadId,
      content: post.content,
      author_id: post.authorId,
      created_at: post.createdAt.toISOString(),
      updated_at: post.updatedAt.toISOString(),
      author: {
        username: post.author.username || 'Unknown User'
      }
    }));
  },

  async createThread(categoryId: string, title: string, content: string, authorId: string): Promise<ForumThread> {
    const thread = await prisma.forumThread.create({
      data: {
        title,
        content,
        categoryId,
        authorId
      },
      include: {
        author: {
          select: {
            username: true
          }
        }
      }
    });

    return {
      id: thread.id,
      category_id: thread.categoryId,
      title: thread.title,
      content: thread.content,
      author_id: thread.authorId,
      created_at: thread.createdAt.toISOString(),
      updated_at: thread.updatedAt.toISOString(),
      is_pinned: thread.isPinned,
      is_locked: thread.isLocked,
      post_count: 0,
      last_post_at: thread.createdAt.toISOString(),
      author: {
        username: thread.author.username || 'Unknown User'
      }
    };
  },

  async createPost(threadId: string, content: string, authorId: string): Promise<ForumPost> {
    const post = await prisma.forumPost.create({
      data: {
        content,
        threadId,
        authorId
      },
      include: {
        author: {
          select: {
            username: true
          }
        }
      }
    });

    return {
      id: post.id,
      thread_id: post.threadId,
      content: post.content,
      author_id: post.authorId,
      created_at: post.createdAt.toISOString(),
      updated_at: post.updatedAt.toISOString(),
      author: {
        username: post.author.username || 'Unknown User'
      }
    };
  }
}; 