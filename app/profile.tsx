import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  async function handleLogout() {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  }

  const userName = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário';
  const userEmail = user?.email || '';
  const initials = userName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Editar Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Meus Locais Favoritos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Notificações</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Ajuda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={[styles.menuItemText, styles.logoutText]}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '600',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  menu: {
    gap: 12,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  logoutText: {
    color: '#E53935',
  },
});