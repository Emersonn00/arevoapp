import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '../components/HomeHeader';
import { HeroSection } from '../components/HeroSection/HeroSection';
import { ArenaSearchSection } from '../components/ArenaSearchSection';
import { AgendaHighlights } from '../components/AgendaHighlights';

export default function HomeScreen(): JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <HomeHeader />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <HeroSection />
        <View style={styles.sectionSpacing}>
          <ArenaSearchSection limit={6} enableSearch showSeeAllLink />
        </View>
        <AgendaHighlights />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
  },
  sectionSpacing: {
    marginTop: -32,
  },
});

