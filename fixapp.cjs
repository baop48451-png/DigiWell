const fs = require('fs');

function fixApp() {
    let code = fs.readFileSync('src/App.tsx', 'utf8');
    let lines = code.split('\n');

    // 1. Fix line 97: destructure missing logic from useSocialLogic
    lines[96] = '  const { refreshSocialFeed, handleSearchSocialUsers, handleFollowUser, handleUnfollowUser, handleToggleLikePost, handleDeleteSocialPost, startEditSocialPost, handleReportPost, handlePublishSocialPost, loadSocialDirectory, openSocialComposer, closeSocialComposer } = useSocialLogic();';

    // 1.1 Fix line 95: destructure missing logic from useHydrationLogic
    lines[94] = '  const { handleAddWater, handleDeleteEntry, flushPendingSyncs, handleEditEntry, savePresets, handleApplyReminderSettings, handleUpdatePreset, queuePendingHydrationAction } = useHydrationLogic();';

    // 2. Remove the duplicated/old functions from lines 235 to 558
    let startIndex = lines.findIndex(l => l.includes('// Gọi AI Gemini thật'));
    let endIndex = lines.findIndex(l => l.includes('setIsPublishingSocialPost(false);'));
    if (startIndex !== -1 && endIndex !== -1) {
        let trueEndIndex = endIndex + 2; 
        lines.splice(startIndex, trueEndIndex - startIndex + 1);
    }

    code = lines.join('\n');

    // Add missed refs
    code = code.replace(/const fileInputRef = useRef<HTMLInputElement>\\(null\\);/, 'const fileInputRef = useRef<HTMLInputElement>(null);\n  const socialImageInputRef = useRef<HTMLInputElement>(null);');

    // Mappings of precise old substrings to new substrings.
    // By providing specific replacements that include the surrounding code, we avoid messing up props/keys.
    
    const tokenReplacements = [
        ['reminderSettings', 'hydration.reminderSettings'],
        ['setStoryProgress', 'social.setStoryProgress'],
        ['storyProgress', 'social.storyProgress'],
        ['recordWaterIntake', 'recordWaterIntake'], // dummy
        ['queuePendingHydrationAction', 'queuePendingHydrationAction'],
        ['waterIntakeRef', 'waterIntake'],
        ['setIsAiLoading', 'setAiLoading'],
        ['handleExportPDF', 'handleExportPDF'],
        ['toggleFastingMode', 'toggleFastingMode'],
        ['setIsChatLoading', 'setIsChatLoading'],
        ['setShowAiChat', 'ui.setShowAiChat'],
        ['activePostActionMenu', 'social.activePostActionMenu'],
        ['setActivePostActionMenu', 'social.setActivePostActionMenu'],
        ['reportingPostId', 'social.reportingPostId'],
        ['setReportingPostId', 'social.setReportingPostId'],
        ['isSubmittingReport', 'social.isSubmittingReport'],
        ['setIsSubmittingReport', 'social.setIsSubmittingReport'],
        ['reportReason', 'social.reportReason'],
        ['setReportReason', 'social.setReportReason'],
        ['socialImageFile', 'social.socialImageFile'],
        ['setIsPublishingSocialPost', 'social.setIsPublishingSocialPost'],
        ['isPublishingSocialPost', 'social.isPublishingSocialPost'],
        ['editingSocialPostId', 'social.editingSocialPostId'],
        ['streak', 'health.streak'],
        ['setIsExportingPDF', 'ui.setIsExportingPDF'],
        ['isExportingPDF', 'ui.isExportingPDF'],
        ['editProfileData', 'social.editProfileData'],
        ['setEditProfileData', 'social.setEditProfileData'],
        ['setIsUpdatingProfile', 'auth.setIsUpdatingProfile'],
        ['setIsScanning', 'ui.setIsScanning'],
        ['isScanning', 'ui.isScanning'],
        ['loginPrefill', 'auth.loginPrefill'],
        ['setLoginPrefill', 'auth.setLoginPrefill'],
        ['hasPendingCloudSync', 'hydration.hasPendingCloudSync'],
        ['setShowSmartHub', 'ui.setShowSmartHub'],
        ['showSmartHub', 'ui.showSmartHub'],
        ['setEditingPresets', 'hydration.setEditingPresets'],
        ['editingPresets', 'hydration.editingPresets'],
        ['setShowPresetManager', 'hydration.setShowPresetManager'],
        ['showPresetManager', 'hydration.showPresetManager'],
        ['setStoryViewerIndex', 'social.setStoryViewerIndex'],
        ['storyViewerIndex', 'social.storyViewerIndex'],
        ['setStoryPaused', 'social.setStoryPaused'],
        ['storyPaused', 'social.storyPaused'],
        ['isSocialLoading', 'social.isSocialLoading'],
        ['setExpandedPostId', 'social.setExpandedPostId'],
        ['expandedPostId', 'social.expandedPostId'],
        ['isReminderPermissionGranted', 'hydration.isReminderPermissionGranted'],
        ['updateReminderSetting', 'hydration.updateReminderSetting'],
        ['isApplyingReminderSettings', 'hydration.isApplyingReminderSettings'],
        ['currentActivity', 'health.currentActivity'],
        ['setCurrentActivity', 'health.setCurrentActivity'],
        ['onboardingStep', 'auth.onboardingStep'],
        ['setOnboardingStep', 'auth.setOnboardingStep'],
        ['socialSearchQuery', 'social.socialSearchQuery'],
        ['socialImagePreview', 'social.socialImagePreview'],
        ['setSocialImagePreview', 'social.setSocialImagePreview'],
        ['setSearchQuery', 'ui.setSearchQuery'],
        ['searchQuery', 'ui.searchQuery'],
        ['isSocialSearching', 'social.isSocialSearching']
    ];

    for (const [oldVar, newVar] of tokenReplacements) {
        if (oldVar === newVar) continue;

        // More safe regex:
        // Negative lookbehind for letter/digit/_/. OR { OR it's inside "<" or "'" or '"'
        // Actually, let's match word, then verify the surrounding structure
        const regex = new RegExp('(\\\\b)' + oldVar + '(\\\\b)', 'g');
        
        let newCode = "";
        let cursor = 0;
        
        let match;
        while ((match = regex.exec(code)) !== null) {
            let start = match.index;
            let end = regex.lastIndex;
            
            let before = code.substring(0, start);
            
            // Check if preceded by dot (e.g. social.streak) or shorthand ({streak}) or prop (streak={)
            let prevChar = code[start - 1];
            let nextChar = code[end];
            
            let skip = false;
            if (prevChar === '.') skip = true;
            
            // check for prop: ` streak={` or ` streak=`
            // check for destructuring: ` { streak }` -- actually, we don't have destructuring of these except what we just replaced
            let nextSubstring = code.substring(end, end + 10).trim();
            if (nextSubstring.startsWith('=')) {
                // it's a prop assignment
                skip = true;
            }
            if (nextSubstring.startsWith(':')) {
                // it's an object property key
                skip = true;
            }

            // check for Object shorthand: { streak } or , streak, or , streak }
            let beforeSubstring = code.substring(start - 5, start);
            if (nextSubstring.startsWith('}') && (beforeSubstring.endsWith('{ ') || beforeSubstring.endsWith(', '))) {
                // this is a tricky one. `{ streak }` needs to become `{ streak: health.streak }`
                skip = 'shorthand';
            }
            if (nextSubstring.startsWith(',') && (beforeSubstring.endsWith('{ ') || beforeSubstring.endsWith(', '))) {
                 skip = 'shorthand';
            }

            // also check "..." for ...editProfileData
            if (beforeSubstring.endsWith('...')) {
                skip = false; // we WANT to append social! 
            }

            // if preceded by < or </ like <toggleFastingMode
            if (beforeSubstring.endsWith('<') || beforeSubstring.endsWith('/')) {
                skip = true;
            }

            newCode += code.substring(cursor, start);
            if (skip === 'shorthand') {
                newCode += oldVar + ': ' + newVar;
            } else if (skip) {
                newCode += oldVar;
            } else {
                newCode += newVar;
            }
            
            cursor = end;
        }
        newCode += code.substring(cursor);
        code = newCode;
    }

    fs.writeFileSync('src/App.tsx.fixed', code);
    console.log('Fixed saved');
}

fixApp();
