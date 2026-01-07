import { auth, db } from '@/constants/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, increment, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const XP_PARA_PROXIMO_NIVEL = 500;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "usuarios", user.uid);

    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (!docSnap.exists()) {
        const novoPerfil = {
          email: user.email,
          xp: 0,
          nivel: 1,
          missoes_concluidas: [],
          dataCriacao: new Date()
        };
        await setDoc(userRef, novoPerfil);
        setUserData(novoPerfil);
      } else {
        const data = docSnap.data();
        setUserData(data);

        if (data.xp >= XP_PARA_PROXIMO_NIVEL) {
          await updateDoc(userRef, {
            nivel: increment(1),
            xp: data.xp - XP_PARA_PROXIMO_NIVEL
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isConcluida = (id: string) => userData?.missoes_concluidas?.includes(id);

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color="#eab308" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcome}>Painel do Agente</Text>
            <Text style={styles.userEmail}>{auth.currentUser?.email}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Lvl {userData?.nivel || 1}</Text>
          </View>
        </View>

        <View style={styles.xpContainer}>
          <View style={styles.xpBarBackground}>
            <View 
              style={[
                styles.xpBarFill, 
                { width: `${Math.min((userData?.xp || 0) / XP_PARA_PROXIMO_NIVEL * 100, 100)}%` } 
              ]} 
            />
          </View>
          <View style={styles.xpInfoRow}>
            <Text style={styles.xpLabel}>Progresso de Carreira</Text>
            <Text style={styles.xpProgressText}>{userData?.xp || 0} / {XP_PARA_PROXIMO_NIVEL} XP</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Missões de Campo</Text>
        
        <TouchableOpacity 
          style={[styles.missionCard, isConcluida("whatsapp_nivel_1") && styles.cardConcluido]}
          onPress={() => router.push({ pathname: '/ChatMissao', params: { id: 'whatsapp_nivel_1' } })} 
        >
          <View style={styles.missionIcon}>
            <Ionicons name="logo-whatsapp" size={30} color={isConcluida("whatsapp_nivel_1") ? "#22c55e" : "#25D366"} />
          </View>
          <View style={styles.missionInfo}>
            <Text style={styles.missionTitle}>Caso #1: O Novo Número</Text>
            <Text style={styles.missionSubtitle}>
              {isConcluida("whatsapp_nivel_1") ? "Status: CONCLUÍDA ✅" : "Status: Disponível 🔓"}
            </Text>
          </View>
          <Ionicons name={isConcluida("whatsapp_nivel_1") ? "checkmark-circle" : "chevron-forward"} size={24} color={isConcluida("whatsapp_nivel_1") ? "#22c55e" : "#94a3b8"} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.missionCard, !isConcluida("whatsapp_nivel_1") && styles.cardBloqueado]}
          onPress={() => {
            if (isConcluida("whatsapp_nivel_1")) {
               router.push({ pathname: '/ChatMissao', params: { id: 'whatsapp_nivel_2' } });
            } else {
              alert("Missão Bloqueada! Complete o Caso #1 primeiro.");
            }
          }} 
        >
          <View style={styles.missionIcon}>
            <Ionicons name="logo-whatsapp" size={30} color="#64748b" />
          </View>
          <View style={styles.missionInfo}>
            <Text style={[styles.missionTitle, !isConcluida("whatsapp_nivel_1") && { color: '#64748b' }]}>Caso #2: O Golpe do Pix</Text>
            <Text style={styles.missionSubtitle}>
              {!isConcluida("whatsapp_nivel_1") ? "Requer Caso #1 concluído" : "Status: Disponível 🔓"}
            </Text>
          </View>
          {!isConcluida("whatsapp_nivel_1") && <Ionicons name="lock-closed" size={20} color="#ef4444" />}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 25 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  welcome: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  userEmail: { color: '#94a3b8', fontSize: 14 },
  levelBadge: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#eab308' },
  levelBadgeText: { color: '#eab308', fontWeight: 'bold', fontSize: 14 },
  xpContainer: { width: '100%', backgroundColor: '#1e293b', padding: 12, borderRadius: 12 },
  xpBarBackground: { height: 8, backgroundColor: '#0f172a', borderRadius: 4, width: '100%', overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: '#eab308', borderRadius: 4 },
  xpInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  xpLabel: { color: '#64748b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  xpProgressText: { color: '#eab308', fontSize: 11, fontWeight: 'bold' },
  content: { alignItems: 'center', paddingBottom: 30 },
  sectionTitle: { color: '#fff', fontSize: 18, marginBottom: 15, alignSelf: 'flex-start', fontWeight: 'bold' },
  missionCard: { backgroundColor: '#1e293b', width: '100%', padding: 18, borderRadius: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  cardConcluido: { borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.05)' },
  cardBloqueado: { opacity: 0.5, borderColor: '#1e293b' },
  missionIcon: { backgroundColor: '#0f172a', padding: 10, borderRadius: 12 },
  missionInfo: { flex: 1, marginLeft: 15 },
  missionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  missionSubtitle: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
});