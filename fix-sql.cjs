const fs = require('fs');

let s = fs.readFileSync('supabase/social_schema.sql', 'utf8');

// Match: create policy "Policy_Name" on table_name
s = s.replace(/create policy "([^"]+)" on\s+([a-zA-Z0-9_\.]+)/gi, (match, policyName, tableName) => {
    return `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};\n${match}`;
});

fs.writeFileSync('supabase/social_schema.sql', s);
console.log('Fixed saved to social_schema.sql');
