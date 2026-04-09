const fs = require('fs');
let s = fs.readFileSync('supabase/social_schema.sql', 'utf8');

const target = `CREATE TYPE notification_type AS ENUM (
    'like_post',
    'like_comment', 
    'comment',
    'follow',
    'mention',
    'dm'
);`;

// To avoid exact spacing issues, let's substitute using regex
s = s.replace(/CREATE TYPE notification_type AS ENUM \([\s\S]*?\);/g, 
`DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'like_post',
            'like_comment', 
            'comment',
            'follow',
            'mention',
            'dm'
        );
    END IF;
END $$;`);

fs.writeFileSync('supabase/social_schema.sql', s);
console.log('Fixed ENUM issue.');
