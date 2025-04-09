import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get todos that need reminders
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000)

    const { data: todos, error: todosError } = await supabaseClient
      .from('todos')
      .select('*, profiles(email)')
      .eq('reminder_sent', false)
      .gte('reminder_date', now.toISOString())
      .lte('reminder_date', fiveMinutesFromNow.toISOString())

    if (todosError) throw todosError

    // Send emails for each todo
    for (const todo of todos) {
      const { error: emailError } = await supabaseClient
        .from('emails')
        .insert({
          to: todo.profiles.email,
          subject: `Reminder: ${todo.title}`,
          html: `
            <h1>Reminder for your todo: ${todo.title}</h1>
            <p>${todo.description || ''}</p>
            <p>Due date: ${todo.due_date ? new Date(todo.due_date).toLocaleString() : 'No due date'}</p>
            <p>Priority: ${todo.priority}</p>
          `,
        })

      if (emailError) throw emailError

      // Mark reminder as sent
      const { error: updateError } = await supabaseClient
        .from('todos')
        .update({ reminder_sent: true })
        .eq('id', todo.id)

      if (updateError) throw updateError
    }

    return new Response(
      JSON.stringify({ message: `Successfully processed ${todos.length} reminders` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 