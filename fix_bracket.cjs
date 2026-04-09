const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
    /setReminderSettings\(savedReminderSettings\n\/\/ removed local state\n\/\/ removed local state/g,
    'updateReminderSetting(savedReminderSettings ? { ...DEFAULT_HYDRATION_REMINDER_SETTINGS, ...JSON.parse(savedReminderSettings) } : { ...DEFAULT_HYDRATION_REMINDER_SETTINGS });\n// removed local state\n// removed local state'
);
code = code.replace(
    /setIsCalendarSynced\(false\);\n\/\/ removed local state/g,
    'setIsCalendarSynced(false);\nupdateReminderSetting({ ...DEFAULT_HYDRATION_REMINDER_SETTINGS });\n// removed local state'
);
fs.writeFileSync('src/App.tsx', code);
