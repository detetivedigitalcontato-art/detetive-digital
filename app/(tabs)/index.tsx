import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../constants/firebaseConfig';

export default function HomeScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = () => {
    Alert.alert(
      "Encerrar Sessão",
      "Agente, tem certeza que deseja sair do QG?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive",
          onPress: () => {
            signOut(auth)
              .then(() => {
                // Ao deslogar, o router nos joga de volta para a tela de login
                router.replace('/login');
              })
              .catch(() => Alert.alert("Erro", "Não foi possível encerrar a sessão."));
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Bem-vindo, Agente</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.info}>Sua conexão está segura e persistente.</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Encerrar Sessão</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
    justifyContent: 'space-between'
  },
  header: {
    marginTop: 60,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  userEmail: {
    color: '#eab308',
    fontSize: 16,
    marginTop: 5,
  },
  content: {
    alignItems: 'center',
  },
  info: {
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    marginBottom: 30,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});