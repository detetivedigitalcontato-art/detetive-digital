import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Importe funções do Firestore
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity, View
} from 'react-native';
import { auth, db } from '../constants/firebaseConfig'; // Importe o db aqui

const { height, width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); 
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [forcaSenha, setForcaSenha] = useState(0);
  
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.replace('/(tabs)');
      else setCheckingAuth(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let nivel = 0;
    if (senha.length > 5) nivel += 1;
    if (/[A-Z]/.test(senha)) nivel += 1;
    if (/[0-9]/.test(senha)) nivel += 1;
    if (/[^A-Za-z0-9]/.test(senha)) nivel += 1;
    setForcaSenha(nivel);
  }, [senha]);

  const getCorForca = () => {
    if (forcaSenha === 0) return '#334155';
    if (forcaSenha <= 2) return '#ef4444';
    if (forcaSenha === 3) return '#eab308';
    return '#22c55e';
  };

  const handleEsqueciSenha = async () => {
    if (!email) return Alert.alert("Atenção", "Digite seu e-mail.");
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Sucesso", "Link enviado!");
    } catch (e) { Alert.alert("Erro", "Falha ao enviar e-mail."); }
  };

  const handleAuth = async () => {
    if (!email || !senha) return Alert.alert("Erro", "Preencha tudo.");
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, senha);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // CRIAR PERFIL AUTOMÁTICO NO CADASTRO
        await setDoc(doc(db, "usuarios", user.uid), {
          email: user.email,
          xp: 0,
          nivel: 1,
          missoes_concluidas: [],
          dataCriacao: new Date()
        });

        Alert.alert("Sucesso", "Recrutamento concluído!");
        setIsLogin(true);
      }
    } catch (e) { 
      Alert.alert("Falha", "Verifique suas credenciais."); 
    } finally { setLoading(false); }
  };

  if (checkingAuth) return null;

  return (
    <View style={styles.mainContainer}>
      <ImageBackground source={require('../assets/images/TelaLogin.png')} style={styles.backgroundImage} resizeMode="cover">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
            <View style={styles.overlay}>
              <View style={styles.card}>
                <Text style={styles.title}>{isLogin ? 'Acesso ao QG' : 'Recrutamento'}</Text>
                <Text style={styles.label}>E-mail</Text>
                <TextInput style={styles.input} placeholder="agente@detetive.com" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} autoCapitalize="none" />
                <Text style={styles.label}>Senha Secreta</Text>
                <View style={styles.passwordContainer}>
                  <TextInput style={styles.inputSenha} placeholder="••••••••" placeholderTextColor="#64748b" secureTextEntry={!mostrarSenha} value={senha} onChangeText={setSenha} />
                  <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)} style={{paddingRight: 15}}>
                    <Ionicons name={mostrarSenha ? "eye-off" : "eye"} size={22} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
                {!isLogin && senha.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={[styles.strengthBar, { width: `${(forcaSenha / 4) * 100}%`, backgroundColor: getCorForca() }]} />
                    <Text style={[styles.strengthText, { color: getCorForca() }]}>
                      {forcaSenha <= 2 ? 'Senha Fraca' : forcaSenha === 3 ? 'Senha Média' : 'Senha Forte'}
                    </Text>
                  </View>
                )}
                {isLogin && (
                  <TouchableOpacity onPress={handleEsqueciSenha} style={styles.forgotButton}>
                    <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
                  {loading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.buttonText}>{isLogin ? 'ENTRAR' : 'CADASTRAR'}</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsLogin(!isLogin)}>
                  <Text style={styles.secondaryButtonText}>{isLogin ? 'Não tem conta? Registre-se' : 'Já é um agente? Login'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#0f172a' },
  backgroundImage: { width: width, height: height, flex: 1 },
  scrollContent: { flexGrow: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', padding: 25 },
  card: { backgroundColor: 'rgba(30, 41, 59, 0.94)', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
  title: { fontSize: 26, color: '#fff', textAlign: 'center', fontWeight: 'bold', marginBottom: 25 },
  label: { color: '#e2e8f0', marginBottom: 6, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 14, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  inputSenha: { flex: 1, color: '#fff', padding: 14 },
  strengthContainer: { marginTop: 10, marginBottom: 15 },
  strengthBar: { height: 4, borderRadius: 2, marginBottom: 5 },
  strengthText: { fontSize: 11, fontWeight: 'bold', textAlign: 'right' },
  forgotButton: { alignSelf: 'flex-end', marginTop: 10, marginBottom: 20 },
  forgotText: { color: '#eab308', fontSize: 13, textDecorationLine: 'underline' },
  button: { backgroundColor: '#eab308', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#0f172a', fontWeight: 'bold' },
  secondaryButton: { marginTop: 20, alignItems: 'center' },
  secondaryButtonText: { color: '#94a3b8', fontSize: 13 },
});