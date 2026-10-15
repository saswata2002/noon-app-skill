import { useEffect, useRef, useState } from 'react';
import { Screen, SearchBarButton } from '../../components';
import { useNav, useParams, usePageLoader } from '../../kit/Navigator';
import { openSearch } from '../../kit/searchMorph';
import { AdBannerModule } from './components/AdBannerModule';
import { CollapsibleBannerModule } from './components/CollapsibleBannerModule';
import { ErrorView } from './components/ErrorView';
import { ProgressLoader } from './components/ProgressLoader';
import { bannerId, categoriesPage, copy, plpQuery, taxonomyFor } from './data';
import { categoriesTokens as k } from './tokens';
import styles from './categories.module.css';

type ViewState = 'loading' | 'error' | 'content';
export interface CategoriesParams {
  /** pin a FeedbackView state: `loading` (ProgressLoader) or `error` (EmptyView + Retry) */
  state?: 'loading' | 'error';
  /** main banner to open on mount, by id (`mobiles-accessories`, `electronics`, …) */
  open?: string;
}

/** the app fetches /categories once per tab mount; the demo shows the loader on the first visit of the session */
let warmed = false;

/**
 * NoonCategoriesScreen → DynamicLoaderScreen(unstructured "/categories", isCategoriesScreen, isTabScreen) →
 * FeedbackView (ProgressLoader while loading, EmptyView on error) → StaticPage: fixed NoonSearchBarButton
 * (no back button on the tab) above a CompoundFlatList of the CMS modules: adBannerModule + collapsibleBannerModule.
 */
export function CategoriesScreen() {
  const nav = useNav();
  const { state: pinned, open } = useParams<CategoriesParams>();
  // with the page loader the wait is already covered: no ProgressLoader sweep line after it
  const pageLoader = usePageLoader();
  const [view, setView] = useState<ViewState>(pinned ?? (warmed || pageLoader ? 'content' : 'loading'));
  const scrollerRef = useRef<HTMLDivElement>(null);
  const page = categoriesPage;

  useEffect(() => {
    if (view !== 'loading' || pinned === 'loading') return;
    const t = setTimeout(() => {
      warmed = true;
      setView('content');
    }, k.demoLoadMs);
    return () => clearTimeout(t);
  }, [view, pinned]);

  if (view === 'loading') {
    return (
      <Screen background="bgSurface" withTabBar safeTop={false} contentStyle={{ paddingBottom: 0 }}>
        <ProgressLoader />
      </Screen>
    );
  }

  if (view === 'error') {
    return (
      <Screen background="bgSurface" withTabBar contentStyle={{ display: 'flex' }}>
        <ErrorView onRetry={() => setView('loading')} />
      </Screen>
    );
  }

  const header = (
    <div className={styles.searchBarContainer}>
      <SearchBarButton placeholder={copy.searchPlaceholder} onPress={(e) => openSearch(nav, e.currentTarget)} />
    </div>
  );

  const openIndex = open ? page.banners.findIndex((b) => bannerId(b) === open) : -1;

  return (
    <Screen ref={scrollerRef} header={header} background="bgSurface" withTabBar contentStyle={{ paddingBottom: 'calc(var(--nk-layout-tab-bar) + var(--nk-inset-bottom))' }}>
      <AdBannerModule image={page.adBanner.image} ratio={page.adBanner.ratio} onPress={() => nav.toast(copy.adToast)} />
      <CollapsibleBannerModule
        title={page.moduleHeader.titleText}
        banners={page.banners}
        numPerRow={page.numPerRow}
        initialOpen={openIndex >= 0 ? openIndex : undefined}
        scrollerRef={scrollerRef}
        onSubBannerPress={(main, sub) => nav.push('plp/listing', { query: plpQuery(main, sub), categoryId: taxonomyFor(main)?.id })}
      />
    </Screen>
  );
}
