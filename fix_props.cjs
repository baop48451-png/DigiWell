const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add back the missing local states for refs and file (which are not in Zustand)
code = code.replace(
    /\/\/ Local useState removed in favor of Zustand/g,
    '// Local useState removed in favor of Zustand\n  const [socialImageFile, setSocialImageFile] = useState<File | null>(null);\n  const chatEndRef = useRef<HTMLDivElement>(null);'
);

// 2. Fix AddFriendModal props
code = code.replace(
    /handleSearchSocialUsers=\{handleSearchSocialUsers\}/g,
    'handleSearchUser={handleSearchSocialUsers}'
);
code = code.replace(
    /isSearching=\{isSearching\}/g,
    'isSearching={isSocialSearching}'
);
code = code.replace(
    /searchResults=\{searchResults\}/g,
    'searchResults={socialSearchResults}'
);
code = code.replace(
    /setSearchResults=\{setSearchResults\}/g,
    'setSearchResults={setSocialSearchResults}'
);

fs.writeFileSync('src/App.tsx', code);
