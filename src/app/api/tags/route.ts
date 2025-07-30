import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { randomUUID } from 'crypto';

// GET /api/tags
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST /api/tags
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description } = await request.json();
    
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Check if a tag with the same name already exists (case-insensitive)
    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .ilike('name', name.trim())
      .maybeSingle();

    if (existingTag) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 400 }
      );
    }

    // Create new tag with UUID
    const { data: tag, error: insertError } = await supabase
      .from('tags')
      .insert([{
        id: randomUUID(),
        name: name.trim(),
        description: description?.trim(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    const message = error instanceof Error ? error.message : 'Failed to create tag';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 