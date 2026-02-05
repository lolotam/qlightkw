import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlogPost {
  id: string;
  title_en: string;
  slug: string;
  scheduled_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting scheduled posts publisher...');

    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find posts that are scheduled and due for publishing
    const now = new Date().toISOString();
    console.log(`Checking for posts scheduled before: ${now}`);

    const { data: postsToPublish, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title_en, slug, scheduled_at')
      .eq('is_published', false)
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', now);

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError);
      throw fetchError;
    }

    if (!postsToPublish || postsToPublish.length === 0) {
      console.log('No posts due for publishing');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No posts due for publishing',
          publishedCount: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${postsToPublish.length} posts to publish:`, postsToPublish.map(p => p.title_en));

    // Publish each post
    const publishedPosts: BlogPost[] = [];
    const errors: { id: string; error: string }[] = [];

    for (const post of postsToPublish as BlogPost[]) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (updateError) {
        console.error(`Failed to publish post ${post.id}:`, updateError);
        errors.push({ id: post.id, error: updateError.message });
      } else {
        console.log(`Successfully published: ${post.title_en}`);
        publishedPosts.push(post);
      }
    }

    // Send email notifications for published posts (if RESEND_API_KEY is configured)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const notificationResults: { postId: string; emailSent: boolean; error?: string }[] = [];

    if (resendApiKey && publishedPosts.length > 0) {
      console.log('Sending email notifications...');
      
      for (const post of publishedPosts) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Quality Light <noreply@qlightkw.lovable.app>',
              to: ['admin@qualitylight.kw'], // Configure admin email
              subject: `Blog Post Published: ${post.title_en}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">📝 Scheduled Post Published</h2>
                  <p>Your scheduled blog post has been automatically published:</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0;">${post.title_en}</h3>
                    <p style="margin: 0; color: #6b7280;">
                      Originally scheduled for: ${new Date(post.scheduled_at).toLocaleString()}
                    </p>
                  </div>
                  <a href="https://qlightkw.lovable.app/blog/${post.slug}" 
                     style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    View Post
                  </a>
                  <p style="color: #9ca3af; margin-top: 30px; font-size: 12px;">
                    This is an automated notification from Quality Light CMS.
                  </p>
                </div>
              `,
            }),
          });

          if (emailResponse.ok) {
            console.log(`Email sent for post: ${post.title_en}`);
            notificationResults.push({ postId: post.id, emailSent: true });
          } else {
            const errorText = await emailResponse.text();
            console.error(`Failed to send email for post ${post.id}:`, errorText);
            notificationResults.push({ postId: post.id, emailSent: false, error: errorText });
          }
        } catch (emailError) {
          console.error(`Email error for post ${post.id}:`, emailError);
          notificationResults.push({ 
            postId: post.id, 
            emailSent: false, 
            error: emailError instanceof Error ? emailError.message : 'Unknown email error' 
          });
        }
      }
    } else if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email notifications');
    }

    const response = {
      success: true,
      message: `Published ${publishedPosts.length} posts`,
      publishedCount: publishedPosts.length,
      publishedPosts: publishedPosts.map(p => ({ id: p.id, title: p.title_en, slug: p.slug })),
      errors: errors.length > 0 ? errors : undefined,
      notifications: notificationResults.length > 0 ? notificationResults : undefined,
      emailsConfigured: !!resendApiKey,
    };

    console.log('Publish job completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Publish scheduled posts error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
