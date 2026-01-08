import { db } from '@/constants/firebaseConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AdminScreen() {
  const router = useRouter();

  // Estados dos Campos
  const [idDoc, setIdDoc] = useState('');
  const [titulo, setTitulo] = useState('');
  const [ordem, setOrdem] = useState('');

  // Listas Dinâmicas
  const [mensagens, setMensagens] = useState([{ sender: 'suspeito', texto: '' }]);
  const [opcoes, setOpcoes] = useState([{ texto: '', tipo: 'errado', resposta_golpista: '', explicacao: '' }]);

  // FUNÇÃO: Carregar Missão Existente para Editar
  const carregarMissao = async () => {
    if (!idDoc) {
      alert("Digite o ID do documento para buscar.");
      return;
    }
    try {
      const docSnap = await getDoc(doc(db, "cenarios", idDoc));
      if (docSnap.exists()) {
        const dados = docSnap.data();
        setTitulo(dados.titulo || '');
        setOrdem(String(dados.ordem || ''));
        setMensagens(dados.mensagens || [{ sender: 'suspeito', texto: '' }]);
        setOpcoes(dados.opcoes || [{ texto: '', tipo: 'errado', resposta_golpista: '', explicacao: '' }]);
        alert("✅ Missão carregada! Agora você pode editar e salvar.");
      } else {
        alert("❌ Nenhuma missão encontrada com esse ID.");
      }
    } catch (error) {
      alert("Erro ao buscar missão.");
    }
  };

  // FUNÇÃO: Salvar ou Atualizar
  const salvarMissao = async () => {
    if (!idDoc || !titulo || !ordem) {
      alert("⚠️ Preencha os campos obrigatórios (ID, Título e Ordem).");
      return;
    }
    try {
      await setDoc(doc(db, "cenarios", idDoc), {
        titulo,
        ordem: Number(ordem),
        mensagens,
        opcoes
      });
      alert("✅ Missão salva com sucesso no Firebase!");
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    }
  };

  // FUNÇÃO: Excluir Missão (Cuidado!)
  const excluirMissao = async () => {
    if (!idDoc) return;
    const confirmar = window.confirm("Tem certeza que deseja EXCLUIR permanentemente esta missão?");
    if (confirmar) {
      try {
        await deleteDoc(doc(db, "cenarios", idDoc));
        alert("🗑️ Missão excluída com sucesso.");
        // Limpar campos
        setIdDoc(''); setTitulo(''); setOrdem('');
        setMensagens([{ sender: 'suspeito', texto: '' }]);
        setOpcoes([{ texto: '', tipo: 'errado', resposta_golpista: '', explicacao: '' }]);
      } catch (error) {
        alert("Erro ao excluir.");
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#075E54" /></TouchableOpacity>
        <Text style={styles.header}>Gerenciador de Conteúdo (CMS)</Text>
      </View>

      {/* ÁREA DE BUSCA E ID */}
      <View style={styles.card}>
        <Text style={styles.label}>ID do Documento (Para Criar ou Editar)</Text>
        <View style={styles.rowSearch}>
          <TextInput 
            style={[styles.input, { flex: 1 }]} 
            value={idDoc} 
            onChangeText={setIdDoc} 
            placeholder="Ex: whatsapp_nivel_1" 
          />
          <TouchableOpacity style={styles.btnBuscar} onPress={carregarMissao}>
            <Ionicons name="search" size={20} color="white" />
            <Text style={styles.btnTextWhite}>CARREGAR</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.label}>Título da Missão</Text>
        <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholder="Ex: Caso #7: Falso Leilão" />
        
        <Text style={styles.label}>Ordem de Exibição</Text>
        <TextInput style={styles.input} value={ordem} onChangeText={setOrdem} keyboardType="numeric" placeholder="Ex: 7" />
      </View>

      {/* MENSAGENS */}
      <Text style={styles.sectionTitle}>Mensagens do Golpista</Text>
      {mensagens.map((m, i) => (
        <View key={i} style={styles.card}>
          <TextInput 
            style={styles.input} 
            value={m.texto} 
            onChangeText={(t) => {
              const novas = [...mensagens];
              novas[i].texto = t;
              setMensagens(novas);
            }} 
            placeholder="Texto da mensagem..." 
            multiline
          />
        </View>
      ))}
      <TouchableOpacity style={styles.btnSecundario} onPress={() => setMensagens([...mensagens, { sender: 'suspeito', texto: '' }])}>
        <Text style={styles.btnTextWhite}>+ ADICIONAR MENSAGEM</Text>
      </TouchableOpacity>

      {/* OPÇÕES */}
      <Text style={styles.sectionTitle}>Opções de Resposta</Text>
      {opcoes.map((op, i) => (
        <View key={i} style={[styles.card, op.tipo === 'correto' && styles.cardCorreto]}>
          <TextInput 
            style={styles.input} 
            value={op.texto} 
            onChangeText={(v) => {
              const novas = [...opcoes] as any;
              novas[i].texto = v;
              setOpcoes(novas);
            }} 
            placeholder="Texto do botão" 
          />
          
          <View style={styles.row}>
            <TouchableOpacity 
                style={[styles.chip, op.tipo === 'correto' && styles.chipCorreto]} 
                onPress={() => { const n = [...opcoes] as any; n[i].tipo = 'correto'; setOpcoes(n); }}
            >
                <Text style={op.tipo === 'correto' ? {color: '#fff'} : null}>Correto</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.chip, op.tipo === 'errado' && styles.chipErrado]} 
                onPress={() => { const n = [...opcoes] as any; n[i].tipo = 'errado'; setOpcoes(n); }}
            >
                <Text style={op.tipo === 'errado' ? {color: '#fff'} : null}>Errado</Text>
            </TouchableOpacity>
          </View>

          <TextInput 
            style={styles.input} 
            value={op.resposta_golpista} 
            onChangeText={(v) => {
              const n = [...opcoes] as any;
              n[i].resposta_golpista = v;
              setOpcoes(n);
            }} 
            placeholder="Reação do golpista" 
          />
          <TextInput 
            style={[styles.input, {marginTop: 10, height: 60}]} 
            value={op.explicacao} 
            onChangeText={(v) => {
              const n = [...opcoes] as any;
              n[i].explicacao = v;
              setOpcoes(n);
            }} 
            placeholder="Explicação educativa" 
            multiline
          />
        </View>
      ))}
      <TouchableOpacity style={styles.btnSecundario} onPress={() => setOpcoes([...opcoes, { texto: '', tipo: 'errado', resposta_golpista: '', explicacao: '' }])}>
        <Text style={styles.btnTextWhite}>+ ADICIONAR OPÇÃO</Text>
      </TouchableOpacity>

      {/* BOTÕES DE AÇÃO FINAL */}
      <View style={styles.footerActions}>
        <TouchableOpacity style={styles.btnSalvar} onPress={salvarMissao}>
          <Ionicons name="cloud-upload" size={24} color="white" />
          <Text style={styles.btnSalvarTexto}>SALVAR ALTERAÇÕES</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnExcluir} onPress={excluirMissao}>
          <MaterialCommunityIcons name="delete-forever" size={24} color="white" />
          <Text style={styles.btnTextWhite}>EXCLUIR MISSÃO</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#075E54' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#444' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 3 },
  cardCorreto: { borderLeftWidth: 6, borderLeftColor: '#22c55e' },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, color: '#075E54' },
  input: { borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#fdfdfd' },
  rowSearch: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  row: { flexDirection: 'row', gap: 12, marginVertical: 12 },
  btnBuscar: { backgroundColor: '#075E54', borderRadius: 8, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 5 },
  btnSecundario: { backgroundColor: '#546e7a', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  btnSalvar: { backgroundColor: '#22c55e', flex: 2, padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  btnExcluir: { backgroundColor: '#ef4444', flex: 1, padding: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  footerActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnSalvarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnTextWhite: { color: '#fff', fontWeight: 'bold' },
  chip: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#eee' },
  chipCorreto: { backgroundColor: '#22c55e' },
  chipErrado: { backgroundColor: '#ef4444' }
});