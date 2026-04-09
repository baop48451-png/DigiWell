const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Replace store assignments with complete destructuring
const authDestruct = `  const { profile, setProfile, loginPrefill, setLoginPrefill, isUpdatingProfile, setIsUpdatingProfile, onboardingStep, setOnboardingStep, logout } = useAuthStore();`;
const hydrationDestruct = `  const { waterIntake, setWaterIntake, waterEntries, setWaterEntries, lastSyncTime, setLastSyncTime, hasPendingCloudSync, setHasPendingCloudSync, editingPresets, setEditingPresets, showPresetManager, setShowPresetManager, isApplyingReminderSettings, setIsApplyingReminderSettings, reminderSettings, updateReminderSetting, isReminderPermissionGranted, setIsReminderPermissionGranted } = useHydrationStore();`;
const healthDestruct = `  const { streak, setStreak, currentActivity, setCurrentActivity } = useHealthStore(); // removed waterGoal to avoid conflict`;
const socialDestruct = `  const { friendsList, setFriendsList, socialStories, setSocialStories, socialPosts, setSocialPosts, socialProfileStats, setSocialProfileStats, socialFollowingIds, setSocialFollowingIds, socialSearchResults, setSocialSearchResults, socialComposer, setSocialComposer, socialError, setSocialError, socialImagePreview, setSocialImagePreview, socialSearchQuery, setSocialSearchQuery, editingSocialPostId, setEditingSocialPostId, reportingPostId, setReportingPostId, isSubmittingReport, setIsSubmittingReport, reportReason, setReportReason, isPublishingSocialPost, setIsPublishingSocialPost, isSocialSearching, setIsSocialSearching, isSocialLoading, setIsSocialLoading, expandedPostId, setExpandedPostId, activePostActionMenu, setActivePostActionMenu, storyViewerIndex, setStoryViewerIndex, storyProgress, setStoryProgress, storyPaused, setStoryPaused, editProfileData, setEditProfileData } = useSocialStore();`;
const uiDestruct = `  const { view, setView, activeTab, setActiveTab, isScanning, setIsScanning, isPremium, setIsPremium, showPremiumModal, setShowPremiumModal, isExportingPDF, setIsExportingPDF, isWatchConnected, setIsWatchConnected, isWeatherSynced, setIsWeatherSynced, isCalendarSynced, setIsCalendarSynced, searchQuery, setSearchQuery, isFastingMode, setIsFastingMode, fastingStartTime, setFastingStartTime, showOnboarding, setShowOnboarding, showAddFriend, setShowAddFriend, showEditProfile, setShowEditProfile, showSocialProfile, setShowSocialProfile, showDiscoverPeople, setShowDiscoverPeople, leagueMode, setLeagueMode, showProfileSettings, setShowProfileSettings, showAiChat, setShowAiChat, showHistory, setShowHistory, showCustomDrink, setShowCustomDrink, showSmartHub, setShowSmartHub, customDrinkForm, setCustomDrinkForm, editingEntry, setEditingEntry, editAmount, setEditAmount } = useUIStore();`;

code = code.replace(
    /const auth = useAuthStore\(\);[\s\n]*const hydration = useHydrationStore\(\);[\s\n]*const health = useHealthStore\(\);[\s\n]*const social = useSocialStore\(\);[\s\n]*const ui = useUIStore\(\);/gs,
    `${authDestruct}\n${hydrationDestruct}\n${healthDestruct}\n${socialDestruct}\n${uiDestruct}`
);

// 2. Add missing functions to logic hooks
code = code.replace(
    /const \{ refreshSocialFeed, handleSearchUser, handleAddFriend, loadSocialDirectory \} = useSocialLogic\(\);/g,
    `const { refreshSocialFeed, handleSearchSocialUsers, handleFollowUser, handleUnfollowUser, handleToggleLikePost, handleDeleteSocialPost, startEditSocialPost, handleReportPost, handlePublishSocialPost, loadSocialDirectory, openSocialComposer, closeSocialComposer, handleSocialImagePicked } = useSocialLogic();`
);
code = code.replace(
    /const \{ handleAddWater, handleDeleteEntry, flushPendingSyncs \} = useHydrationLogic\(\);/g,
    `const { handleAddWater, handleDeleteEntry, flushPendingSyncs, handleEditEntry, savePresets, handleApplyReminderSettings, handleUpdatePreset, queuePendingHydrationAction } = useHydrationLogic();`
);

// 3. Remove redundant local useState variables from lines ~107 to ~132
// We find '[loginPrefill]' and delete up to '[isSocialSearching]'
code = code.replace(/const \[loginPrefill[\s\S]*?const \[isSocialSearching, setIsSocialSearching\] = useState\(false\);/, 
    `// Local useState removed in favor of Zustand`);

// 4. Also remove the redundant properties that the user mistakenly left:
// "const [now, setNow] = useState(() => new Date());" and "const [isPrefsLoaded...]" and "const [socialImageFile..."
// Actually the regex above doesn't catch them all. Let's just remove the exact chunk:
let lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
    let l = lines[i];
    // Remove local states that were moved
    if (l.includes('const [loginPrefill, setLoginPrefill] = useState') ||
        l.includes('const [currentActivity, setCurrentActivity] = useState') ||
        l.includes('const [streak] = useState') ||
        l.includes('const [isExportingPDF, setIsExportingPDF] = useState') ||
        l.includes('const [reminderSettings, setReminderSettings] = useState') ||
        l.includes('const [isReminderPermissionGranted') ||
        l.includes('const [isApplyingReminderSettings') ||
        l.includes('const [socialImageFile, setSocialImageFile] = useState') ||
        l.includes('const [socialImagePreview, setSocialImagePreview] = useState') ||
        l.includes('const [expandedPostId, setExpandedPostId] = useState') ||
        l.includes('const [activePostActionMenu, setActivePostActionMenu] = useState') ||
        l.includes('const [editingSocialPostId, setEditingSocialPostId] = useState') ||
        l.includes('const [reportingPostId, setReportingPostId] = useState') ||
        l.includes('const [reportReason, setReportReason] = useState') ||
        l.includes('const [isSubmittingReport, setIsSubmittingReport] = useState') ||
        l.includes('const [storyViewerIndex, setStoryViewerIndex] = useState') ||
        l.includes('const [storyProgress, setStoryProgress] = useState') ||
        l.includes('const [storyPaused, setStoryPaused] = useState') ||
        l.includes('const [isSocialLoading, setIsSocialLoading] = useState') ||
        l.includes('const [isPublishingSocialPost, setIsPublishingSocialPost] = useState') ||
        l.includes('const [isSocialSearching, setIsSocialSearching] = useState')
    ) {
        lines[i] = '// removed local state';
    }
}

// 5. Remove the duplicated AI/Social logic from old AppContent scope
let dupStart = lines.findIndex(l => l.includes('// Gọi AI Gemini thật'));
let dupEnd = lines.findIndex(l => l.includes('setIsPublishingSocialPost(false);'));

if (dupStart !== -1 && dupEnd !== -1) {
    for (let i = dupStart; i <= dupEnd + 2; i++) {
        lines[i] = '// removed duplicated code'; // overwrite line
    }
}

code = lines.join('\n');

// Add socialImageInputRef
code = code.replace(/const chatEndRef = useRef<HTMLDivElement>\(null\);/, 
    `const socialImageInputRef = useRef<HTMLInputElement>(null);\n  const chatEndRef = useRef<HTMLDivElement>(null);`);

// Some missing fixes:
// "handleSearchUser" was used in the UI, we should map it to "handleSearchSocialUsers"
code = code.replace(/handleSearchUser/g, 'handleSearchSocialUsers');
// "handleAddFriend" mapping:
code = code.replace(/handleAddFriend/g, 'handleFollowUser');

// Missing 'watchData' and 'weatherData' in useUIStore destructuring!
// User error: "Cannot find name 'watchData'" "Cannot find name 'weatherData'".
// We also didn't destructure `DEFAULT_HYDRATION_REMINDER_SETTINGS` and `REPORT_REASONS` which are probably from imports.
// We added the missing imports at the top
let imports = `
import { DEFAULT_HYDRATION_REMINDER_SETTINGS, type HydrationReminderSettings } from './types';
import { REPORT_REASONS, type ReportReason } from './types';
`;
code = code.replace(/import type \{ UserProfile, Friend, SearchResult, LocalWaterEntry \} from '\.\/types';/, 
    `import type { UserProfile, Friend, SearchResult, LocalWaterEntry } from './types';\n${imports}`);

// We also need to add watchData, weatherData, calendarEvents to useUIStore, but they're not in the store JSON!
// Why not? Let's check where they are using "Cannot find name 'watchData'".
// If they aren't in useUIStore, maybe they were also removed?
// Let's add them as useStates if they're completely missing!
let localVars = `
  const [watchData, setWatchData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [drinkPresets, setDrinkPresets] = useState<any[]>([]);
`;
code = code.replace(/const \[isPrefsLoaded, setIsPrefsLoaded\] = useState\(false\);/, 
    `const [isPrefsLoaded, setIsPrefsLoaded] = useState(false);\n${localVars}`);

code = code.replace(/setReminderSettings\(/g, "updateReminderSetting(");
fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx cleanly refactored.');
