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
      created_at: category.created_at.toISOString(),
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
      reply_count: thread._count.posts,
      latest_activity: thread.posts[0]?.createdAt.toISOString() || thread.createdAt.toISOString(),
      author: {
        username: thread.author.username || 'Unknown User'
      },
      score: thread.score
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
      reply_count: thread._count.posts,
      latest_activity: thread.updatedAt.toISOString(),
      author: {
        username: thread.author.username || 'Unknown User'
      },
      score: thread.score
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
      },
      score: post.score
    }));
  },

  async createThread(categoryId: string, title: string, content: string, authorId: string): Promise<ForumThread> {
    const thread = await prisma.$transaction(async (tx) => {
      // Create the thread
      const newThread = await tx.forumThread.create({
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

      // Update the category's thread count and latest thread
      await tx.forumCategory.update({
        where: { id: categoryId },
        data: {
          thread_count: {
            increment: 1
          },
          latest_thread: newThread.createdAt
        }
      });

      return newThread;
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
      reply_count: 0,
      latest_activity: thread.createdAt.toISOString(),
      author: {
        username: thread.author.username || 'Unknown User'
      },
      score: thread.score
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
      },
      score: post.score
    };
  },

  async deleteThread(threadId: string): Promise<void> {
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      select: { categoryId: true }
    });

    if (!thread) return;

    await prisma.$transaction(async (tx) => {
      // Delete the thread
      await tx.forumThread.delete({
        where: { id: threadId }
      });

      // Update the category's thread count
      await tx.forumCategory.update({
        where: { id: thread.categoryId },
        data: {
          thread_count: {
            decrement: 1
          },
          // Update latest_thread to the most recent remaining thread's creation time
          latest_thread: {
            set: await tx.forumThread.findFirst({
              where: { categoryId: thread.categoryId },
              orderBy: { createdAt: 'desc' },
              select: { createdAt: true }
            }).then(t => t?.createdAt || null)
          }
        }
      });
    });
  }
}; 