import { ImageBackground, StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { Calendar, MapPin, Trophy, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { heroSectionStyles } from './HeroSectionStyle';
import { assets } from '@/utils/assets';

const heroImage = assets.images.heroFutevolei;

export function HeroSection(): JSX.Element {
  const router = useRouter();

  const styles = heroSectionStyles

  const handleNavigate = () => {
    router.push('/(auth)/login');
  };

  return (
    <ImageBackground source={heroImage} style={styles.background} resizeMode="cover">
      <LinearGradient colors={['rgba(37,99,235,0.65)', 'rgba(37,99,235,0.35)']} style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title}>Arevo</Text>
        <Text style={styles.subtitle}>A plataforma para futevôlei mais completa do mundo</Text>

        <View style={styles.actions}>
          <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={handleNavigate}>
            <Trophy color="#1D4ED8" size={18} />
            <Text style={[styles.actionText, styles.primaryText]}>Criar Campeonato</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.outlineButton]} onPress={handleNavigate}>
            <Users color="#FFFFFF" size={18} />
            <Text style={[styles.actionText, styles.outlineText]}>Encontrar Jogadores</Text>
          </Pressable>
        </View>

        <View style={styles.highlights}>
          <View style={styles.highlightCard}>
            <Calendar color="#FB923C" size={28} />
            <Text style={styles.highlightTitle}>Organize Campeonatos</Text>
            <Text style={styles.highlightDescription}>Chaveamento automático com dupla eliminação</Text>
          </View>
          <View style={styles.highlightCard}>
            <MapPin color="#34D399" size={28} />
            <Text style={styles.highlightTitle}>Encontre Arenas</Text>
            <Text style={styles.highlightDescription}>Localize quadras em Salvador e região</Text>
          </View>
          <View style={styles.highlightCard}>
            <Users color="#A78BFA" size={28} />
            <Text style={styles.highlightTitle}>Conecte-se</Text>
            <Text style={styles.highlightDescription}>Forme duplas e marque jogos</Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}




