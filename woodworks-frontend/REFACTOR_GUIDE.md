# WoodWorks frontend structure

This folder contains a drop-in refactor of the provided `App.tsx`. It keeps the current UI/business logic while separating presentation components, controller logic, types, app configuration, and storage helpers.

## Apply it

1. Back up your existing `src/App.tsx`.
2. Copy the contents of this archive's `src/` into your existing `src/` folder, preserving the directories. It replaces `src/App.tsx` and adds the new files.
3. Keep your existing `src/main.tsx`, `src/index.css`, Vite/Tailwind configuration, `package.json`, and `src/services/woodworksApi.ts` unchanged.
4. Run `npm run build` (and `npm run lint` if configured).

## New files

- `src/components/auth/AuthScreen.tsx` — login/register screen.
- `src/components/layout/AppHeader.tsx` — top header, search, sort, refresh, create, logout.
- `src/components/layout/Sidebar.tsx` — filters, task groups, progress, account-manager entry point.
- `src/components/tasks/MainContent.tsx` — main task list and daily-task card.
- `src/components/assistant/AssistantPanel.tsx` — collapsed rail and AI chat panel.
- `src/components/modals/TaskModal.tsx` — create/edit task dialog.
- `src/components/modals/GroupModal.tsx` — create-group dialog.
- `src/components/modals/AccountManagerModal.tsx` — account settings preview.
- `src/components/modals/DeleteAccountConfirmModal.tsx` — account deletion confirmation.
- `src/components/modals/TaskDeleteModal.tsx` — task deletion confirmation.
- `src/components/ui/ToastMessage.tsx` — toast/notification.
- `src/hooks/useAppController.ts` — state, effects, and event handlers.
- `src/hooks/useMediaQuery.ts` — responsive breakpoint hook.
- `src/types/task.ts` — shared application types.
- `src/config/appConfig.ts` — API base URL, storage keys, demo mode, chat defaults.
- `src/utils/storage.ts` — local storage parsing and current date helper.
- `src/utils/taskGroups.ts` — local task-group assignment hydration.

## About `src/services/woodworksApi.ts`

The current implementation still uses the same inline `fetch` calls as the supplied App.tsx, to reduce the risk of changing API behavior during a structural refactor. Your existing `woodworksApi.ts` is left untouched. A follow-up improvement would be to move request functions from `useAppController.ts` into that service, leaving the hook responsible for state and UI orchestration.
