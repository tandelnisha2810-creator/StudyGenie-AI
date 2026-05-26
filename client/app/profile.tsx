import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

import { signOut } from 'firebase/auth';

import { auth } from '../firebase';
import { router } from 'expo-router';
import { clearAuthStorage } from '@/utils/authStorage';

export default function ProfileScreen() {
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    await clearAuthStorage();
    router.replace('/auth' as any);
  };

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri:
            user?.photoURL ||
            'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        }}
        style={styles.image}
      />

      <Text style={styles.name}>
        {user?.displayName || 'Student'}
      </Text>

      <Text style={styles.email}>
        {user?.email}
      </Text>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
    padding: 20,
  },

  image: {
    width: 140,
    height: 140,
    borderRadius: 100,
  },

  name: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
    color: '#111827',
  },

  email: {
    color: '#6B7280',
    marginTop: 10,
    fontSize: 16,
  },

  logoutButton: {
    backgroundColor: '#EF4444',
    marginTop: 40,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 18,
  },

  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

