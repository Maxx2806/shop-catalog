import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  RefreshControl, StatusBar, SafeAreaView,
  Animated, Modal, Image, ScrollView, Pressable,
} from 'react-native';

// ─── THEME ───────────────────────────────────────────────────────────────────
const COLORS = {
  bg: '#F7F8FA', card: '#FFFFFF', primary: '#6C63FF',
  primaryLight: '#EEF0FF', text: '#1A1A2E', textSub: '#4A4A6A',
  textMuted: '#9B9BB4', border: '#EBEBF5', skeleton: '#E8E8F0', star: '#F59E0B',
};
const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, pill: 100 };
const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

const API_URL = 'https://fakestoreapi.com/products';
const CATEGORIES = ['All', 'electronics', "men's clothing", "women's clothing", 'jewelery'];
const CATEGORY_EMOJI = {
  electronics: '💻',
  "men's clothing": '👔',
  "women's clothing": '👗',
  jewelery: '💎',
};
const SORT_OPTIONS = [
  { key: 'default', label: 'Default', icon: '🔀' },
  { key: 'price_asc', label: 'Harga: Terendah', icon: '⬆️' },
  { key: 'price_desc', label: 'Harga: Tertinggi', icon: '⬇️' },
  { key: 'name_asc', label: 'Nama: A → Z', icon: '🔤' },
  { key: 'name_desc', label: 'Nama: Z → A', icon: '🔡' },
  { key: 'rating', label: 'Rating Tertinggi', icon: '⭐' },
];

// ─── SKELETON CARD ────────────────────────────────────────────────────────────
function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const Box = ({ style }) => (
    <Animated.View style={[{ backgroundColor: COLORS.skeleton, borderRadius: RADIUS.sm }, style, { opacity }]} />
  );
  return (
    <View style={{
      backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
      overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, flex: 1,
    }}>
      <Box style={{ height: 150, borderRadius: 0 }} />
      <View style={{ padding: SPACING.md, gap: SPACING.sm }}>
        <Box style={{ height: 12, width: '100%' }} />
        <Box style={{ height: 12, width: '70%' }} />
        <Box style={{ height: 10, width: '50%' }} />
        <Box style={{ height: 18, width: '40%' }} />
      </View>
    </View>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ query, category, onClear }) {
  const isFiltered = query || category !== 'All';
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: SPACING.xl }}>
      <Text style={{ fontSize: 64, marginBottom: SPACING.lg }}>{isFiltered ? '🔍' : '📦'}</Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center' }}>
        {isFiltered ? 'Tidak ada hasil' : 'Belum ada produk'}
      </Text>
      <Text style={{ fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.lg }}>
        {isFiltered ? 'Tidak ada produk yang cocok dengan pencarianmu.' : 'Coba lagi nanti!'}
      </Text>
      {isFiltered && (
        <TouchableOpacity
          style={{ backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.lg }}
          onPress={onClear}
        >
          <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 14 }}>✕  Hapus Filter</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product, onPress, index = 0 }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: (index % 6) * 80, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay: (index % 6) * 80, useNativeDriver: true }),
    ]).start();
  }, []);
  const stars = Math.round(product.rating?.rate || 0);
  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY }] }}>
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
          overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, elevation: 3,
        }}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={{ backgroundColor: '#FAFAFA', height: 150, alignItems: 'center', justifyContent: 'center', padding: SPACING.md }}>
          <Image source={{ uri: product.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          <View style={{
            position: 'absolute', top: SPACING.sm, right: SPACING.sm,
            backgroundColor: COLORS.card, borderRadius: RADIUS.md,
            width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 14 }}>{CATEGORY_EMOJI[product.category] || '🏷️'}</Text>
          </View>
        </View>
        <View style={{ padding: SPACING.md, gap: SPACING.xs }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.text, lineHeight: 17, minHeight: 34 }} numberOfLines={2}>
            {product.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 10, color: COLORS.star, letterSpacing: 1 }}>
              {'★'.repeat(Math.min(stars, 5))}{'☆'.repeat(Math.max(0, 5 - stars))}
            </Text>
            <Text style={{ fontSize: 10, color: COLORS.textMuted }}>({product.rating?.count})</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 }}>
            ${product.price.toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── PRODUCT DETAIL MODAL ─────────────────────────────────────────────────────
function ProductDetailModal({ product, visible, onClose }) {
  if (!product) return null;
  const stars = Math.round(product.rating?.rate || 0);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2 }} />
          <TouchableOpacity
            style={{
              position: 'absolute', right: SPACING.lg, width: 32, height: 32,
              borderRadius: 16, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
            }}
            onPress={onClose}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted }}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}>
          <View style={{
            backgroundColor: COLORS.card, borderRadius: RADIUS.xl, height: 240,
            alignItems: 'center', justifyContent: 'center', padding: SPACING.lg,
            marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
          }}>
            <Image source={{ uri: product.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </View>
          <View style={{ alignSelf: 'flex-start', backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.pill, marginBottom: SPACING.sm }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.primary, textTransform: 'capitalize' }}>{product.category}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text, lineHeight: 28, marginBottom: SPACING.md }}>{product.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.primary, letterSpacing: -1 }}>${product.price.toFixed(2)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 13, color: COLORS.star }}>
                {'★'.repeat(Math.min(stars, 5))}{'☆'.repeat(Math.max(0, 5 - stars))}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text }}>{product.rating?.rate}</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>({product.rating?.count})</Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.lg }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm }}>📋 Deskripsi</Text>
          <Text style={{ fontSize: 14, color: COLORS.textSub, lineHeight: 22, marginBottom: SPACING.lg }}>{product.description}</Text>
          <View style={{ flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' }}>
            {[
              { val: `${product.rating?.rate}/5`, label: 'Rating' },
              { val: String(product.rating?.count), label: 'Reviews' },
              { val: product.price > 100 ? 'Premium' : product.price > 50 ? 'Mid' : 'Budget', label: 'Tier' },
            ].map((s, i) => (
              <View key={i} style={{ flex: 1, padding: SPACING.md, alignItems: 'center', borderLeftWidth: i > 0 ? 1 : 0, borderColor: COLORS.border }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>{s.val}</Text>
                <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, backgroundColor: COLORS.card, borderTopWidth: 1, borderColor: COLORS.border, gap: SPACING.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Total Price</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>${product.price.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={{ flex: 1.5, backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center' }}
            onPress={onClose}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>🛒  Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── SORT MODAL ───────────────────────────────────────────────────────────────
function SortModal({ visible, currentSort, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable style={{ backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: SPACING.lg }}>Urutkan</Text>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={{
                flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
                borderRadius: RADIUS.lg, gap: SPACING.md, marginBottom: SPACING.xs,
                backgroundColor: currentSort === opt.key ? COLORS.primaryLight : 'transparent',
              }}
              onPress={() => onSelect(opt.key)}
            >
              <Text style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{opt.icon}</Text>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: currentSort === opt.key ? '700' : '500', color: currentSort === opt.key ? COLORS.primary : COLORS.textSub }}>
                {opt.label}
              </Text>
              {currentSort === opt.key && <Text style={{ fontSize: 16, color: COLORS.primary, fontWeight: '700' }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── APP (MAIN) ───────────────────────────────────────────────────────────────
export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState('default');
  const listOpacity = useRef(new Animated.Value(0)).current;

  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      listOpacity.setValue(0);
    }
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      setProducts(data);
      Animated.timing(listOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [listOpacity]);

  useEffect(() => { fetchProducts(); }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedCategory !== 'All') result = result.filter(p => p.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }
    switch (sortOption) {
      case 'price_asc': result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'name_asc': result.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'name_desc': result.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'rating': result.sort((a, b) => b.rating.rate - a.rating.rate); break;
    }
    return result;
  }, [products, searchQuery, selectedCategory, sortOption]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 }}>🛍️ ShopCatalog</Text>
        <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>Discover amazing products</Text>
      </View>

      {/* Search + Sort */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.sm }}>
        <View style={{
          flex: 1, flexDirection: 'row', alignItems: 'center',
          backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
          paddingHorizontal: SPACING.md, height: 44,
          borderWidth: 1.5, borderColor: COLORS.border,
        }}>
          <Text style={{ fontSize: 16, marginRight: SPACING.sm }}>🔍</Text>
          <TextInput
            style={{ flex: 1, fontSize: 14, color: COLORS.text }}
            placeholder="Cari produk..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={{
            width: 44, height: 44, borderRadius: RADIUS.md,
            backgroundColor: sortOption !== 'default' ? COLORS.primary : COLORS.card,
            borderWidth: 1.5,
            borderColor: sortOption !== 'default' ? COLORS.primary : COLORS.border,
            alignItems: 'center', justifyContent: 'center',
          }}
          onPress={() => setSortVisible(true)}
        >
          <Text style={{ fontSize: 20 }}>⇅</Text>
        </TouchableOpacity>
      </View>

      {/* Category Chips — FIX: tambah height agar tidak melar */}
      <View style={{ height: 40, marginBottom: SPACING.sm }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm, alignItems: 'center' }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                paddingHorizontal: SPACING.md,
                paddingVertical: 6,
                height: 32,
                borderRadius: RADIUS.pill,
                backgroundColor: selectedCategory === item ? COLORS.primary : COLORS.card,
                borderWidth: 1.5,
                borderColor: selectedCategory === item ? COLORS.primary : COLORS.border,
                marginRight: SPACING.sm,
                justifyContent: 'center',
              }}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={{
                fontSize: 12, fontWeight: '600',
                color: selectedCategory === item ? '#fff' : COLORS.textMuted,
                textTransform: 'capitalize',
              }}>
                {item === 'All' ? '✨ All' : item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Result Count */}
      {!loading && !error && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm }}>
          <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{filteredProducts.length} produk ditemukan</Text>
          {(searchQuery || selectedCategory !== 'All') && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
              <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>Hapus filter ✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Loading — Skeleton */}
      {loading && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.md, gap: SPACING.sm, paddingTop: SPACING.sm }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl }}>
          <Text style={{ fontSize: 56, marginBottom: SPACING.md }}>⚠️</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center' }}>
            Oops! Terjadi Kesalahan
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.lg, lineHeight: 20 }}>
            {error}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, elevation: 4 }}
            onPress={() => fetchProducts()}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>🔄 Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success — FlatList */}
      {!loading && !error && (
        <Animated.View style={{ flex: 1, opacity: listOpacity }}>
          <FlatList
            data={filteredProducts}
            renderItem={({ item, index }) => (
              <ProductCard
                product={item}
                index={index}
                onPress={() => { setSelectedProduct(item); setDetailVisible(true); }}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={{ gap: SPACING.sm, marginBottom: SPACING.sm }}
            contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                query={searchQuery}
                category={selectedCategory}
                onClear={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              />
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchProducts(true)}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
          />
        </Animated.View>
      )}

      {/* Modals */}
      <ProductDetailModal
        product={selectedProduct}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />
      <SortModal
        visible={sortVisible}
        currentSort={sortOption}
        onSelect={(opt) => { setSortOption(opt); setSortVisible(false); }}
        onClose={() => setSortVisible(false)}
      />
    </SafeAreaView>
  );
}