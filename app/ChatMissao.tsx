import { db } from '@/constants/firebaseConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image // Adicionado Image aqui
    ,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function ChatMissao() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [missao, setMissao] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mensagensVisiveis, setMensagensVisiveis] = useState<any[]>([]);
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [mostrarMenuTresPontos, setMostrarMenuTresPontos] = useState(false);
  const [aguardandoBloqueio, setAguardandoBloqueio] = useState(false);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const docRef = doc(db, "cenarios", "whatsapp_nivel_1");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const dados = docSnap.data();
          setMissao(dados);
          
          if (dados.mensagens && Array.isArray(dados.mensagens)) {
            exibirMensagensGradualmente(dados.mensagens);
          }
        }
      } catch (error) { 
        console.error("Erro ao carregar missão:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    buscarDados();
  }, []);

  const exibirMensagensGradualmente = async (mensagens: any[]) => {
    for (const msg of mensagens) {
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      setMensagensVisiveis(prev => [...prev, msg]);
    }
  };

  const escolherResposta = async (index: number) => {
    if (!missao.opcoes || !missao.opcoes[index]) return;
    
    const opcaoEscolhida = missao.opcoes[index];
    setMostrarOpcoes(false);

    // 1. O usuário (Agente) envia a mensagem
    setMensagensVisiveis(prev => [...prev, { sender: 'agente', texto: opcaoEscolhida.texto }]);

    // 2. Tempo de "digitação" do golpista
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 3. Resposta do Golpista (incluindo a imagem do Firebase se existir)
    setMensagensVisiveis(prev => [...prev, { 
      sender: 'suspeito', 
      texto: opcaoEscolhida.resposta_golpista,
      url_imagem: opcaoEscolhida.url_imagem // Captura o novo campo que você criou
    }]);

    // 4. Alerta Informativo após 1.5s
    setTimeout(() => {
      if (opcaoEscolhida.tipo === 'correto') {
        Alert.alert("✅ Decisão Correta!", opcaoEscolhida.explicacao, [
          { text: "Próximo Passo", onPress: () => setAguardandoBloqueio(true) }
        ]);
      } else {
        Alert.alert("⚠️ Cuidado!", opcaoEscolhida.explicacao, [
          { 
            text: "Tentar outro caminho", 
            onPress: () => {
                setMensagensVisiveis(prev => prev.slice(0, -2));
                setMostrarOpcoes(true);
            } 
          }
        ]);
      }
    }, 1500); 
  };

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#075E54" />
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="white" /></TouchableOpacity>
            <Ionicons name="person-circle" size={40} color="#cbd5e1" style={{marginHorizontal: 5}} />
            <View>
              <Text style={styles.headerNome}>+55 11 98234-XXXX</Text>
              <Text style={styles.headerStatus}>online</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => setMostrarMenuTresPontos(true)} 
            style={[styles.tresPontos, aguardandoBloqueio && styles.destaqueVerde]}
          >
            <MaterialCommunityIcons name="dots-vertical" size={26} color="white" />
          </TouchableOpacity>
        </View>

        {/* CHAT BACKGROUND */}
        <View style={styles.chatBackground}>
          <ScrollView 
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={styles.scrollContent}
          >
            {mensagensVisiveis.map((msg, index) => (
              <View key={index} style={[styles.balao, msg.sender === 'suspeito' ? styles.esquerda : styles.direita]}>
                
                {/* RENDERIZAÇÃO DA IMAGEM DENTRO DO BALÃO */}
                {msg.url_imagem && (
                  <Image 
                    source={{ uri: msg.url_imagem }} 
                    style={styles.imagemBalao} 
                    resizeMode="cover"
                  />
                )}

                <Text style={styles.textoBalao}>{msg.texto}</Text>
                <Text style={styles.hora}>11:45 {msg.sender !== 'suspeito' && <Ionicons name="checkmark-done" size={16} color="#34B7F1" />}</Text>
              </View>
            ))}
            
            {aguardandoBloqueio && (
              <View style={styles.dicaTutorial}>
                <Text style={styles.textoDica}>☝️ Agora denuncie o golpista nos 3 pontinhos acima!</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* BARRA INFERIOR */}
        <View style={styles.footerContainer}>
          <TouchableOpacity 
            style={[styles.inputFake, aguardandoBloqueio && { opacity: 0.3 }]} 
            disabled={aguardandoBloqueio}
            onPress={() => setMostrarOpcoes(true)}
          >
            <MaterialCommunityIcons name="emoticon-happy-outline" size={24} color="#85959f" />
            <Text style={styles.placeholderText}>Escolha sua resposta...</Text>
            <Ionicons name="attach" size={24} color="#85959f" />
          </TouchableOpacity>
        </View>

        {/* MODAL DE RESPOSTAS */}
        <Modal visible={mostrarOpcoes} transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setMostrarOpcoes(false)}>
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>O que você diz?</Text>
               {missao?.opcoes?.map((opcao: any, index: number) => (
                 <TouchableOpacity key={index} style={styles.opcaoBotao} onPress={() => escolherResposta(index)}>
                   <Text style={styles.opcaoTexto}>{opcao.texto}</Text>
                 </TouchableOpacity>
               ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* MENU DE DENÚNCIA */}
        <Modal visible={mostrarMenuTresPontos} transparent animationType="none">
          <TouchableOpacity style={styles.menuOverlay} onPress={() => setMostrarMenuTresPontos(false)}>
            <View style={styles.menuTresPontosContainer}>
              <TouchableOpacity 
                style={[styles.itemMenu, aguardandoBloqueio && { backgroundColor: '#fee2e2' }]} 
                onPress={() => {
                  setMostrarMenuTresPontos(false);
                  if(aguardandoBloqueio) {
                     Alert.alert("🛡️ Sucesso", "Contato bloqueado! Você concluiu a missão.", [{ text: "Sair", onPress: () => router.replace('/') }]);
                  }
                }}>
                <Text style={{color: '#ef4444', fontWeight: 'bold'}}>Denunciar contato</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#075E54' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E5DDD5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingBottom: 10, backgroundColor: '#075E54' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerNome: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerStatus: { color: '#fff', fontSize: 11, opacity: 0.8 },
  chatBackground: { flex: 1, backgroundColor: '#E5DDD5' },
  scrollContent: { padding: 10, paddingBottom: 20 },
  balao: { padding: 10, borderRadius: 10, marginBottom: 8, maxWidth: '85%', elevation: 1 },
  esquerda: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderTopLeftRadius: 0 },
  direita: { backgroundColor: '#DCF8C6', alignSelf: 'flex-end', borderTopRightRadius: 0 },
  textoBalao: { fontSize: 16, color: '#333' },
  imagemBalao: { width: 220, height: 160, borderRadius: 8, marginBottom: 8 }, // Estilo da imagem no chat
  hora: { fontSize: 10, color: '#999', alignSelf: 'flex-end', marginTop: 4 },
  tresPontos: { padding: 5 },
  destaqueVerde: { backgroundColor: '#128C7E', borderRadius: 20 },
  dicaTutorial: { backgroundColor: 'rgba(7, 94, 84, 0.9)', padding: 15, borderRadius: 10, marginTop: 20 },
  textoDica: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  footerContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingBottom: 20, backgroundColor: '#E5DDD5' },
  inputFake: { flex: 1, flexDirection: 'row', backgroundColor: 'white', borderRadius: 25, padding: 12, alignItems: 'center' },
  placeholderText: { flex: 1, color: '#85959f', marginLeft: 10, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#075E54' },
  opcaoBotao: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, marginBottom: 10 },
  opcaoTexto: { textAlign: 'center', fontWeight: 'bold', color: '#075E54' },
  menuOverlay: { flex: 1 },
  menuTresPontosContainer: { position: 'absolute', top: 60, right: 10, backgroundColor: 'white', borderRadius: 4, elevation: 5, width: 200 },
  itemMenu: { padding: 15 }
});