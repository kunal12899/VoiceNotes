-- Drop existing policies if they exist
drop policy if exists "Users can view their own todos" on todos;
drop policy if exists "Users can create their own todos" on todos;
drop policy if exists "Users can update their own todos" on todos;
drop policy if exists "Users can delete their own todos" on todos;

-- Create updated policies
create policy "Users can view their own todos"
  on todos for select
  using (auth.uid() = user_id);

create policy "Users can create their own todos"
  on todos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own todos"
  on todos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own todos"
  on todos for delete
  using (auth.uid() = user_id);

-- Enable RLS if not already enabled
alter table todos enable row level security; 