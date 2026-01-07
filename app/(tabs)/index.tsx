import { auth } from '@/constants/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Painel do Agente</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Missões Ativas</Text>
        
        <TouchableOpacity 
          style={styles.missionCard}
          onPress={() => router.push('/ChatMissao')} 
        >
          <View style={styles.missionIcon}>
            <Ionicons name="logo-whatsapp" size={30} color="#25D366" />
          </View>
          <View style={styles.missionInfo}>
            <Text style={styles.missionTitle}>Caso #1: O Novo Número</Text>
            <Text style={styles.missionSubtitle}>Status: Pendente</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 30 },
  welcome: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  userEmail: { color: '#eab308', fontSize: 16 },
  content: { alignItems: 'center' },
  sectionTitle: { color: '#fff', fontSize: 18, marginBottom: 15, alignSelf: 'flex-start' },
  missionCard: { backgroundColor: '#1e293b', width: '100%', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  missionIcon: { backgroundColor: '#0f172a', padding: 10, borderRadius: 10 },
  missionInfo: { flex: 1, marginLeft: 15 },
  missionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  missionSubtitle: { color: '#94a3b8', fontSize: 14 },
});