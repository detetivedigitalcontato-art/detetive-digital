import { auth, db } from '@/constants/firebaseConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
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
  const { id } = useLocalSearchParams();
  const idDocMissao = id || "whatsapp_nivel_1"; 

  const scrollViewRef = useRef<ScrollView>(null);
  const [missao, setMissao] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mensagensVisiveis, setMensagensVisiveis] = useState<any[]>([]);
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarDicaDenuncia, setMostrarDicaDenuncia] = useState(false);
  const [aguardandoBloqueio, setAguardandoBloqueio] = useState(false);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const docRef = doc(db, "cenarios", idDocMissao as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const dados = docSnap.data();
          setMissao(dados);
          if (dados.mensagens && Array.isArray(dados.mensagens)) {
            setMensagensVisiveis([]);
            exibirMensagensGradualmente(dados.mensagens);
          }
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    buscarDados();
  }, [idDocMissao]);

  const exibirMensagensGradualmente = async (mensagens: any[]) => {
    for (const msg of mensagens) {
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      setMensagensVisiveis(prev => [...prev, msg]);
    }
  };

  const escolherResposta = async (index: number) => {
    const opcao = missao.opcoes[index];
    setMostrarOpcoes(false);
    
    setMensagensVisiveis(prev => [...prev, { sender: 'agente', texto: opcao.texto }]);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setMensagensVisiveis(prev => [...prev, { 
        sender: 'suspeito', 
        texto: opcao.resposta_golpista,
        url_imagem: opcao.url_imagem 
    }]);

    setTimeout(() => {
      if (opcao.tipo === 'correto') {
        Alert.alert("✅ Excelente Agente!", opcao.explicacao, [
          { text: "Continuar", onPress: () => {
            setAguardandoBloqueio(true);
            setMostrarDicaDenuncia(true); // Ativa a instrução para o usuário
          }}
        ]);
      } else {
        Alert.alert("⚠️ Cuidado!", opcao.explicacao, [{ text: "Tentar de novo", onPress: () => {
          setMensagensVisiveis(prev => prev.slice(0, -2));
          setMostrarOpcoes(true);
        }}]);
      }
    }, 800);
  };

  const finalizarMissao = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, "usuarios", user.uid), {
        xp: increment(100),
        missoes_concluidas: arrayUnion(idDocMissao)
      });
      router.replace('/');
    } catch (error) { console.error(error); }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#075E54" /></View>;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
            <Ionicons name="arrow-back" size={24} color="white" />
            <View style={styles.avatarPlaceholder}><Ionicons name="person" size={20} color="#ccc" /></View>
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerNome} numberOfLines={1}>{missao?.titulo || "Suspeito"}</Text>
            <Text style={styles.headerStatus}>online</Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity style={{marginRight: 15}}><Ionicons name="videocam" size={22} color="white" /></TouchableOpacity>
            <TouchableOpacity style={{marginRight: 15}}><Ionicons name="call" size={20} color="white" /></TouchableOpacity>
            <TouchableOpacity onPress={() => { setMostrarMenu(true); setMostrarDicaDenuncia(false); }}>
              <MaterialCommunityIcons name="dots-vertical" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* BALÃO DE DICA EDUCATIVA */}
        {mostrarDicaDenuncia && (
          <View style={styles.containerDica}>
            <View style={styles.balaoDica}>
              <Text style={styles.textoDica}>
                Agente, agora clique nos três pontinhos no topo e selecione "Denunciar e Bloquear" para encerrar o caso!
              </Text>
              <TouchableOpacity onPress={() => setMostrarDicaDenuncia(false)} style={styles.btnEntendi}>
                <Text style={styles.btnEntendiTexto}>ENTENDI</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.setaDica} />
          </View>
        )}

        {/* CHAT BACKGROUND */}
        <ImageBackground source={{ uri: 'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png' }} style={styles.chatBackground}>
          <ScrollView ref={scrollViewRef} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()} contentContainerStyle={{padding: 10, paddingBottom: 20}}>
            {mensagensVisiveis.map((msg, idx) => (
              <View key={idx} style={[styles.balaoContainer, msg.sender === 'suspeito' ? styles.esquerdaContainer : styles.direitaContainer]}>
                <View style={[styles.balao, msg.sender === 'suspeito' ? styles.balaoEsquerda : styles.balaoDireita]}>
                  {msg.url_imagem && <Image source={{ uri: msg.url_imagem }} style={styles.imagemChat} />}
                  <Text style={styles.textoBalao}>{msg.texto}</Text>
                  <Text style={styles.hora}>12:00</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </ImageBackground>

        {/* FOOTER / INPUT */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.inputArea} onPress={() => setMostrarOpcoes(true)} disabled={aguardandoBloqueio}>
            <Ionicons name="happy-outline" size={24} color="#85959f" />
            <Text style={styles.inputText}>{aguardandoBloqueio ? "Missão pronta para finalizar" : "Escolher resposta..."}</Text>
            <Ionicons name="attach" size={24} color="#85959f" />
            <Ionicons name="camera" size={24} color="#85959f" />
          </TouchableOpacity>
        </View>

        {/* MODAL RESPOSTAS */}
        <Modal visible={mostrarOpcoes} transparent animationType="slide">
          <View style={styles.modalOverlay}><View style={styles.modalContent}>
               <View style={styles.modalHeaderBar} />
               <Text style={styles.modalTitulo}>Ação do Agente:</Text>
               {missao?.opcoes?.map((op: any, i: number) => (
                 <TouchableOpacity key={i} style={styles.opcaoBotao} onPress={() => escolherResposta(i)}>
                   <Text style={styles.opcaoTexto}>{op.texto}</Text>
                 </TouchableOpacity>
               ))}
               <TouchableOpacity style={styles.btnCancelar} onPress={() => setMostrarOpcoes(false)}><Text style={styles.btnCancelarTexto}>Cancelar</Text></TouchableOpacity>
          </View></View>
        </Modal>

        {/* MODAL MENU 3 PONTINHOS */}
        <Modal visible={mostrarMenu} transparent animationType="fade">
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMostrarMenu(false)}>
            <View style={styles.menuPopUp}>
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => { if(aguardandoBloqueio) { setMostrarMenu(false); finalizarMissao(); } }}
              >
                <Text style={[styles.menuItemText, { color: aguardandoBloqueio ? '#ef4444' : '#ccc' }]}>Denunciar e Bloquear</Text>
                {!aguardandoBloqueio && <Ionicons name="lock-closed" size={16} color="#ccc" />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}><Text style={styles.menuItemText}>Silenciar</Text></TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#075E54' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: { backgroundColor: '#075E54', height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 35, height: 35, borderRadius: 20, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerNome: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  headerStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  chatBackground: { flex: 1, backgroundColor: '#efe7dd' },
  balaoContainer: { width: '100%', marginBottom: 5 },
  esquerdaContainer: { alignItems: 'flex-start' },
  direitaContainer: { alignItems: 'flex-end' },
  balao: { maxWidth: '85%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, elevation: 1 },
  balaoEsquerda: { backgroundColor: 'white', borderTopLeftRadius: 0 },
  balaoDireita: { backgroundColor: '#dcf8c6', borderTopRightRadius: 0 },
  textoBalao: { fontSize: 16, color: '#111' },
  imagemChat: { width: 200, height: 200, borderRadius: 10, marginBottom: 5 },
  hora: { fontSize: 10, color: '#888', alignSelf: 'flex-end', marginTop: 2 },
  footer: { flexDirection: 'row', padding: 8, alignItems: 'center', backgroundColor: '#efe7dd' },
  inputArea: { flex: 1, backgroundColor: 'white', borderRadius: 25, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  inputText: { flex: 1, color: '#85959f', marginHorizontal: 10, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, paddingBottom: 40 },
  modalHeaderBar: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', color: '#075E54', marginBottom: 20, textAlign: 'center' },
  opcaoBotao: { backgroundColor: '#f0f2f5', padding: 18, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#e1e4e8' },
  opcaoTexto: { fontSize: 16, fontWeight: '600', color: '#111', textAlign: 'center' },
  btnCancelar: { marginTop: 10, padding: 10 },
  btnCancelarTexto: { color: '#ef4444', textAlign: 'center', fontWeight: 'bold' },
  menuOverlay: { flex: 1 },
  menuPopUp: { position: 'absolute', top: 50, right: 10, backgroundColor: 'white', paddingVertical: 10, borderRadius: 8, width: 200, elevation: 5 },
  menuItem: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between' },
  menuItemText: { fontSize: 16 },
  // ESTILOS DA DICA EDUCATIVA
  containerDica: { position: 'absolute', top: 65, right: 10, zIndex: 9999, alignItems: 'flex-end' },
  balaoDica: { backgroundColor: '#2563eb', padding: 15, borderRadius: 12, width: 220, elevation: 10 },
  textoDica: { color: 'white', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  setaDica: { width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 15, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#2563eb', position: 'absolute', top: -10, right: 10 },
  btnEntendi: { marginTop: 8, backgroundColor: 'white', padding: 5, borderRadius: 5 },
  btnEntendiTexto: { color: '#2563eb', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }
});