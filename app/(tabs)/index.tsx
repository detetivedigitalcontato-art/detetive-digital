import { auth, db } from '@/constants/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, increment, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [missoes, setMissoes] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  const XP_PARA_PROXIMO_NIVEL = 500;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "usuarios", user.uid);

    // 1. ESCUTA DADOS DO USUÁRIO EM TEMPO REAL
    const unsubUser = onSnapshot(userRef, async (docSnap) => {
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
        // Lógica de subir de nível
        if (data.xp >= XP_PARA_PROXIMO_NIVEL) {
          await updateDoc(userRef, { 
            nivel: increment(1), 
            xp: data.xp - XP_PARA_PROXIMO_NIVEL 
          });
        }
      }
    });

    // 2. ESCUTA A COLEÇÃO DE CENÁRIOS (DINÂMICO)
    // Ele busca todos os documentos e ordena pelo campo 'ordem' que você criou
    const q = query(collection(db, "cenarios"), orderBy("ordem", "asc"));
    
    const unsubMissoes = onSnapshot(q, (querySnapshot) => {
      const lista: any[] = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      setMissoes(lista);
      setLoading(false);
    });

    return () => { 
      unsubUser(); 
      unsubMissoes(); 
    };
  }, []);

  // Verifica se o ID da missão está na lista de concluídas do usuário
  const isConcluida = (id: string) => userData?.missoes_concluidas?.includes(id);

  // Lógica de Bloqueio: Bloqueia se a missão anterior não estiver concluída
  const estaBloqueada = (index: number) => {
    if (index === 0) return false; // A primeira (ordem 1) nunca está bloqueada
    const missaoAnteriorId = missoes[index - 1]?.id;
    return !userData?.missoes_concluidas?.includes(missaoAnteriorId);
  };

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color="#eab308" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER DE STATUS DO AGENTE */}
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
        <Text style={styles.sectionTitle}>Missões de Campo Ativas</Text>
        
        {/* MAPEIA AS MISSÕES DO FIREBASE AUTOMATICAMENTE */}
        {missoes.map((item, index) => {
          const concluida = isConcluida(item.id);
          const bloqueada = estaBloqueada(index);

          return (
            <TouchableOpacity 
              key={item.id}
              style={[
                styles.missionCard, 
                concluida && styles.cardConcluido,
                bloqueada && styles.cardBloqueado
              ]}
              onPress={() => {
                if (bloqueada) {
                  Alert.alert("Acesso Negado", "Complete a missão anterior para desbloquear este caso.");
                } else {
                  router.push({ pathname: '/ChatMissao', params: { id: item.id } });
                }
              }} 
            >
              <View style={styles.missionIcon}>
                <Ionicons 
                  name="logo-whatsapp" 
                  size={30} 
                  color={concluida ? "#22c55e" : bloqueada ? "#64748b" : "#25D366"} 
                />
              </View>
              <View style={styles.missionInfo}>
                <Text style={[styles.missionTitle, bloqueada && { color: '#64748b' }]}>
                  {item.titulo || `Caso #${index + 1}`}
                </Text>
                <Text style={styles.missionSubtitle}>
                  {concluida ? "CONCLUÍDA ✅" : bloqueada ? "Bloqueada 🔒" : "Disponível 🔓"}
                </Text>
              </View>
              <Ionicons 
                name={concluida ? "checkmark-circle" : bloqueada ? "lock-closed" : "chevron-forward"} 
                size={24} 
                color={concluida ? "#22c55e" : "#94a3b8"} 
              />
            </TouchableOpacity>
          );
        })}
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
  content: { width: '100%', paddingBottom: 30 },
  sectionTitle: { color: '#fff', fontSize: 18, marginBottom: 15, fontWeight: 'bold' },
  missionCard: { backgroundColor: '#1e293b', width: '100%', padding: 18, borderRadius: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  cardConcluido: { borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.05)' },
  cardBloqueado: { opacity: 0.5, borderColor: '#1e293b' },
  missionIcon: { backgroundColor: '#0f172a', padding: 10, borderRadius: 12 },
  missionInfo: { flex: 1, marginLeft: 15 },
  missionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  missionSubtitle: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
});