const fs = require('fs');

let s = fs.readFileSync('supabase/social_schema.sql', 'utf8');

s = s.replace(/DO \$\s*\nBEGIN/, "DO $$\nBEGIN");
s = s.replace(/END \$;/, "END $$;");

fs.writeFileSync('supabase/social_schema.sql', s);
console.log("Syntax fixed");
