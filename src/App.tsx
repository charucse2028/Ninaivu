/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Loader2,
  Sparkles,
  Inbox,
  Search,
  Layers,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { Language, Profile, ItemWithLocations } from './types';
import { getTranslation } from './i18n/translations';
import { profilesService } from './services/profiles';
import { itemsService } from './services/items';
import { useVoiceSearch } from './hooks/useVoiceSearch';
import { useTheme } from './hooks/useTheme';
import { getItemDisplayName } from './utils/itemTranslation';

import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ProfileModal } from './components/ProfileModal';
import { ProfileViewModal } from './components/ProfileViewModal';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import { SearchSection } from './components/SearchSection';
import { ItemCard } from './components/ItemCard';
import { SearchResultView } from './components/SearchResultView';
import { ItemDetailsModal } from './components/ItemDetailsModal';
import { ItemFormModal } from './components/ItemFormModal';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { AIAssistantResponseCard } from './components/AIAssistantResponseCard';
import { generateAIAssistantResponse, AIAssistantResult } from './services/aiAssistantService';
import { speechSynthesisService } from './services/speechSynthesisService';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('ninaivu_language');
      return saved === 'ta' ? 'ta' : 'en';
    } catch {
      return 'en';
    }
  });

  // Session state: tracks whether initial local session check is in progress
  const [isInitializingSession, setIsInitializingSession] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const [items, setItems] = useState<ItemWithLocations[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<ItemWithLocations[]>([]);
  const [selectedSearchResultItem, setSelectedSearchResultItem] = useState<ItemWithLocations | null>(null);
  const [aiResponse, setAiResponse] = useState<AIAssistantResult | null>(null);

  // Modals & Dialogs State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemWithLocations | null>(null);

  const [viewingItem, setViewingItem] = useState<ItemWithLocations | null>(null);

  const [itemToDelete, setItemToDelete] = useState<ItemWithLocations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; locationName: string } | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  const t = getTranslation(language);

  // Show auto-dismiss notification toast
  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Voice Search Hook & Helpful Spoken Response System
  const handleVoiceResult = useCallback(
    (transcript: string) => {
      const query = transcript.trim();
      setSearchQuery(query);
      if (!query) return;

      // Stop any prior speech synthesis immediately
      speechSynthesisService.stop();

      // Generate AI location guidance strictly from current user's saved items
      const aiResult = generateAIAssistantResponse(query, items, language);
      setAiResponse(aiResult);

      // Automatically speak the response in en-US or ta-IN
      speechSynthesisService.speak(aiResult.responseText, aiResult.speechLang);

      if (aiResult.matchedItem) {
        setSelectedSearchResultItem(aiResult.matchedItem);
      }
    },
    [items, language]
  );

  // Manual search submit or "Enter" trigger for AI Assistant
  const handleSearchSubmit = useCallback(
    (queryText: string) => {
      const query = queryText.trim();
      if (!query) {
        setAiResponse(null);
        speechSynthesisService.stop();
        return;
      }

      speechSynthesisService.stop();
      const aiResult = generateAIAssistantResponse(query, items, language);
      setAiResponse(aiResult);
      speechSynthesisService.speak(aiResult.responseText, aiResult.speechLang);

      if (aiResult.matchedItem) {
        setSelectedSearchResultItem(aiResult.matchedItem);
      }
    },
    [items, language]
  );

  const {
    isListening,
    isSupported: isSpeechSupported,
    error: voiceError,
    processing: processingVoice,
    startListening,
    stopListening,
  } = useVoiceSearch(language, handleVoiceResult);

  // Check active local session on App Mount
  useEffect(() => {
    let isMounted = true;

    const initProfile = async () => {
      try {
        const storedId = profilesService.getCurrentProfileId();
        if (storedId) {
          const found = await profilesService.getProfile(storedId);
          if (isMounted && found) {
            setProfile(found);
            if (found.language) {
              setLanguage(found.language);
            }
            setIsInitializingSession(false);
            return;
          }
        }
      } catch (err) {
        console.error('[Session] Error restoring local session:', err);
      }

      if (isMounted) {
        // No active local session -> directly show Welcome / Profile screen
        setProfile(null);
        setIsInitializingSession(false);
      }
    };

    initProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Language Change Handler
  const handleLanguageChange = async (newLang: Language) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('ninaivu_language', newLang);
    } catch {
      // ignore
    }
    if (profile) {
      setProfile(prev => (prev ? { ...prev, language: newLang } : null));
      await profilesService.updateLanguage(profile.id, newLang);
    }
  };

  // Welcome Screen Continue Handler (New Phone / Returning User / New User)
  const handleWelcomeContinue = async (name: string, age: number) => {
    try {
      // 1. Search Supabase public.profiles for an existing user matching exact Name + Age
      const existing = await profilesService.findProfileByNameAge(name, age);
      if (existing) {
        // Returning user: reuse existing profile_id, do NOT create a new profile
        profilesService.setCurrentProfileId(existing.id);
        setProfile(existing);
        if (existing.language) {
          setLanguage(existing.language);
          try {
            localStorage.setItem('ninaivu_language', existing.language);
          } catch {
            // ignore
          }
        }
        showNotification(`${t.welcomeBack}, ${existing.name}!`);
      } else {
        // Brand new user: create new profile in Supabase with a fresh unique profile_id
        const saved = await profilesService.createProfile(name, age, language);
        profilesService.setCurrentProfileId(saved.id);
        setProfile(saved);
        showNotification(
          language === 'ta'
            ? `நல்வரவு, ${saved.name}!`
            : `Welcome to Ninaivu, ${saved.name}!`
        );
      }
    } catch (err: any) {
      console.error('[App] Failed to continue with profile:', err);
      throw err;
    }
  };

  // Profile Update Handler (for Edit Profile modal while logged in)
  const handleSaveProfile = async (name: string, age: number) => {
    try {
      if (profile) {
        // Update the existing profile in Supabase, keeping the exact same profile_id
        const updated = await profilesService.updateProfile(profile.id, name, age);
        setProfile(updated);
        showNotification(t.profileUpdatedSuccess);
      }
      setIsProfileModalOpen(false);
      setIsEditingProfile(false);
    } catch (err: any) {
      console.error('[App] Failed to update profile:', err);
      showNotification(err?.message || 'Failed to update profile');
    }
  };

  // Logout Handler
  // Ends only the current user active session.
  // Clears active profile from current app session.
  // Navigates back to the Welcome/Profile setup screen.
  // IMPORTANT: Logout NEVER deletes anything from Supabase (profiles, items, locations, photos are safe).
  const handleLogout = () => {
    // 0. Stop any ongoing voice speech
    speechSynthesisService.stop();

    // 1. Clear current active session key from local storage
    profilesService.clearCurrentProfile();

    // 2. Clear current user profile and session memory
    setProfile(null);
    setItems([]);
    setFilteredItems([]);
    setSelectedSearchResultItem(null);
    setAiResponse(null);
    setSearchQuery('');
    setIsEditingProfile(false);
    setIsProfileViewOpen(false);
    setIsLogoutConfirmOpen(false);
    setViewingItem(null);
    setEditingItem(null);
    setItemToDelete(null);

    // 3. App returns to WelcomeScreen automatically because profile === null
    showNotification(t.loggedOutSuccess);
  };

  // Load User Items
  const loadItems = useCallback(async () => {
    if (!profile) return;
    setIsLoadingItems(true);
    try {
      const data = await itemsService.getItems(profile.id);
      setItems(data);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setIsLoadingItems(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      loadItems();
    }
  }, [profile, loadItems]);

  // Handle Search Filtering
  useEffect(() => {
    if (!profile) return;

    if (!searchQuery.trim()) {
      setFilteredItems(items);
      setSelectedSearchResultItem(null);
      setAiResponse(null);
      speechSynthesisService.stop();
      return;
    }

    const runSearch = async () => {
      const results = await itemsService.searchItems(profile.id, searchQuery);
      setFilteredItems(results);

      // Check if user is typing an item question
      const lowerQ = searchQuery.toLowerCase();
      const isQuestion =
        lowerQ.includes('where') ||
        lowerQ.includes('enga') ||
        lowerQ.includes('yenga') ||
        lowerQ.includes('iruku') ||
        lowerQ.includes('irukku') ||
        lowerQ.includes('எங்கே') ||
        lowerQ.includes('எங்க') ||
        lowerQ.includes('?') ||
        lowerQ.includes('find');

      if (isQuestion) {
        const aiResult = generateAIAssistantResponse(searchQuery, items, language);
        setAiResponse(aiResult);
      }

      // If exactly 1 matching item found or user specifically asked, focus on that result view
      if (results.length === 1) {
        setSelectedSearchResultItem(results[0]);
      } else {
        setSelectedSearchResultItem(null);
      }
    };

    const timer = setTimeout(runSearch, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, items, profile, language]);

  // Seed demo items
  const handleSeedDemoData = async () => {
    if (!profile) return;
    setIsLoadingItems(true);
    try {
      const seeded = await itemsService.seedDemoData(profile.id);
      setItems(prev => [...seeded, ...prev]);
      showNotification(t.sampleDataLoaded);
    } catch (err) {
      console.error('Failed to seed demo data:', err);
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Save Item (Create or Edit)
  const handleSaveItem = async (
    itemName: string,
    locations: { id?: string; location_name: string; photo_url: string | null }[]
  ) => {
    if (!profile) return;
    try {
      const saved = await itemsService.saveItem(profile.id, itemName, locations, editingItem?.id);

      setItems(prev => {
        const index = prev.findIndex(i => i.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        }
        return [saved, ...prev];
      });

      if (viewingItem && viewingItem.id === saved.id) {
        setViewingItem(saved);
      }
      if (selectedSearchResultItem && selectedSearchResultItem.id === saved.id) {
        setSelectedSearchResultItem(saved);
      }

      showNotification(t.itemSavedSuccess);
    } catch (err: any) {
      console.error('[App] Error during handleSaveItem:', err);
      showNotification(err?.message || 'Error saving item');
      throw err;
    }
  };

  // Delete Item
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await itemsService.deleteItem(itemToDelete.id);
      setItems(prev => prev.filter(i => i.id !== itemToDelete.id));

      if (viewingItem && viewingItem.id === itemToDelete.id) {
        setViewingItem(null);
      }
      if (selectedSearchResultItem && selectedSearchResultItem.id === itemToDelete.id) {
        setSelectedSearchResultItem(null);
      }
      showNotification(t.itemDeletedSuccess);
      setItemToDelete(null);
    } catch (err: any) {
      console.error('[App] Error during handleConfirmDelete:', err);
      showNotification(err?.message || 'Error deleting item');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats calculation
  const totalLocationsCount = useMemo(() => {
    return items.reduce((acc, curr) => acc + (curr.locations?.length || 0), 0);
  }, [items]);

  // 1. Initial Session Verification Screen (brief loader while checking local session on app start)
  if (isInitializingSession) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-lg mb-4 animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {language === 'ta' ? 'நினைவு' : 'Ninaivu'}
        </h1>
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          <span>{language === 'ta' ? 'ஏற்றப்படுகிறது...' : 'Loading...'}</span>
        </div>
      </div>
    );
  }

  // 2. Welcome / Profile Screen for new phone or logged out state (NO active session)
  // Do NOT directly open the Home screen!
  if (!profile) {
    return (
      <WelcomeScreen
        language={language}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onThemeToggle={toggleTheme}
        onContinue={handleWelcomeContinue}
        notification={notification}
        onClearNotification={() => setNotification(null)}
      />
    );
  }

  // 3. Main Home Screen (Active Session)
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Navigation Header */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onThemeToggle={toggleTheme}
        profile={profile}
        onViewProfile={() => setIsProfileViewOpen(true)}
        onEditProfile={() => {
          setIsEditingProfile(true);
          setIsProfileModalOpen(true);
        }}
        onLogout={() => setIsLogoutConfirmOpen(true)}
        onOpenSetup={() => setIsSetupModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8">
        {/* Welcome Greeting & Add Item Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {t.greeting}, {profile?.name || 'Friend'}!
              </span>
              <span className="text-xl sm:text-2xl animate-pulse">👋</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t.heroSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="add-new-item-btn"
              onClick={() => {
                setEditingItem(null);
                setIsFormModalOpen(true);
              }}
              className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
            >
              <span>{t.addItem}</span>
            </button>
          </div>
        </div>

        {/* Search Section with Voice Recognition & AI Spoken Assistance */}
        <section aria-label="Item search section" className="space-y-3 sm:space-y-4">
          <SearchSection
            language={language}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            isListening={isListening}
            isSpeechSupported={isSpeechSupported}
            voiceError={voiceError}
            processingVoice={processingVoice}
            onStartVoice={startListening}
            onStopVoice={stopListening}
          />

          {/* AI Assistant Voice-Enabled Helpful Response Card */}
          {aiResponse && (
            <AIAssistantResponseCard
              response={aiResponse}
              language={language}
              onClose={() => {
                speechSynthesisService.stop();
                setAiResponse(null);
              }}
              onViewItem={item => {
                setSelectedSearchResultItem(item);
                setViewingItem(item);
              }}
              onAddNewItem={prefilledName => {
                speechSynthesisService.stop();
                setEditingItem({
                  id: '',
                  profile_id: profile?.id || '',
                  item_name: prefilledName || '',
                  locations: [],
                });
                setIsFormModalOpen(true);
              }}
            />
          )}
        </section>

        {/* Quick Stats Banner (when user has items) */}
        {items.length > 0 && !selectedSearchResultItem && !searchQuery && (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{t.totalItemsCount}</p>
                <p className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">{items.length}</p>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{t.allLocationsCount}</p>
                <p className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">{totalLocationsCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Focused Single Search Result (when exactly 1 item matches or clicked) */}
        {selectedSearchResultItem ? (
          <SearchResultView
            item={selectedSearchResultItem}
            language={language}
            onBack={() => {
              setSelectedSearchResultItem(null);
              setSearchQuery('');
            }}
            onViewPhoto={(photoUrl, locationName) => setViewingPhoto({ url: photoUrl, locationName })}
            onEditItem={item => {
              setEditingItem(item);
              setIsFormModalOpen(true);
            }}
            onDeleteItem={item => setItemToDelete(item)}
            onAddLocation={item => {
              setEditingItem(item);
              setIsFormModalOpen(true);
            }}
          />
        ) : (
          /* Item List or Multiple Search Results */
          <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {searchQuery ? t.matchingItems(filteredItems.length) : t.savedItems}
                </h2>
              </div>

              {/* Sample Data Quick Button */}
              {items.length === 0 && !isLoadingItems && (
                <button
                  onClick={handleSeedDemoData}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.seedSampleData}</span>
                </button>
              )}
            </div>

            {/* Loading Skeleton */}
            {isLoadingItems ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                <p className="text-xs">{t.loadingItems}</p>
              </div>
            ) : filteredItems.length > 0 ? (
              /* Items Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    language={language}
                    onView={it => setViewingItem(it)}
                    onEdit={it => {
                      setEditingItem(it);
                      setIsFormModalOpen(true);
                    }}
                    onDelete={it => setItemToDelete(it)}
                  />
                ))}
              </div>
            ) : searchQuery ? (
              /* Search Empty State */
              <div className="py-12 sm:py-16 px-4 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.noSearchResultsTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {t.noSearchResultsSubtitle(searchQuery)}
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer min-h-[40px]"
                >
                  {t.clearSearch}
                </button>
              </div>
            ) : (
              /* Global Empty State */
              <div className="py-12 sm:py-16 px-4 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <Inbox className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t.noItemsTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {t.noItemsSubtitle}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-2 max-w-sm mx-auto sm:max-w-none">
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setIsFormModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
                  >
                    {t.addFirstItem}
                  </button>
                  <button
                    onClick={handleSeedDemoData}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{t.seedSampleData}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="font-bold text-slate-700 dark:text-slate-300">Ninaivu (நினைவு)</span>
            <span>– {t.appBrandTagline}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              PostgreSQL Schema &amp; Storage
            </button>
            <span>•</span>
            <span>English / தமிழ்</span>
          </div>
        </div>
      </footer>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-medium flex items-center gap-2 border border-slate-800 dark:border-slate-700 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Modals & Dialogs */}
      <ProfileViewModal
        isOpen={isProfileViewOpen}
        language={language}
        profile={profile}
        onClose={() => setIsProfileViewOpen(false)}
        onEdit={() => {
          setIsProfileViewOpen(false);
          setIsEditingProfile(true);
          setIsProfileModalOpen(true);
        }}
        onLogout={() => {
          setIsProfileViewOpen(false);
          setIsLogoutConfirmOpen(true);
        }}
      />

      <LogoutConfirmModal
        isOpen={isLogoutConfirmOpen}
        language={language}
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        language={language}
        initialProfile={isEditingProfile ? profile : null}
        onSave={handleSaveProfile}
        isDismissable={isEditingProfile}
        onClose={() => {
          setIsEditingProfile(false);
          setIsProfileModalOpen(false);
        }}
      />

      <ItemFormModal
        isOpen={isFormModalOpen}
        language={language}
        initialItem={editingItem}
        profileId={profile?.id || 'guest'}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      <ItemDetailsModal
        isOpen={Boolean(viewingItem)}
        language={language}
        item={viewingItem}
        onClose={() => setViewingItem(null)}
        onEdit={item => {
          setViewingItem(null);
          setEditingItem(item);
          setIsFormModalOpen(true);
        }}
        onDelete={item => {
          setViewingItem(null);
          setItemToDelete(item);
        }}
        onViewPhoto={(photoUrl, locationName) => setViewingPhoto({ url: photoUrl, locationName })}
        onAddLocation={item => {
          setViewingItem(null);
          setEditingItem(item);
          setIsFormModalOpen(true);
        }}
      />

      <PhotoViewerModal
        isOpen={Boolean(viewingPhoto)}
        photoUrl={viewingPhoto?.url || null}
        locationName={viewingPhoto?.locationName || ''}
        language={language}
        onClose={() => setViewingPhoto(null)}
      />

      <DeleteConfirmDialog
        isOpen={Boolean(itemToDelete)}
        itemName={itemToDelete ? getItemDisplayName(itemToDelete, language) : ''}
        language={language}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
        isDeleting={isDeleting}
      />

      <SupabaseSetupModal
        isOpen={isSetupModalOpen}
        language={language}
        onClose={() => setIsSetupModalOpen(false)}
      />
    </div>
  );
}
