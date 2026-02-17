import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthProvider';
import { auth } from "./firebase";

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const { setUser } = useContext(AuthContext);
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setloading] = useState(false);
    const [error, setError] = useState(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const formAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 700,
                useNativeDriver: true,
            }),
            Animated.timing(formAnim, {
                toValue: 1,
                duration: 700,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleAuth = async () => {
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        
        if (!isLogin && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {

            setloading(true);
            
            const userCredential = isLogin
                ? await signInWithEmailAndPassword(auth, email, password)
                : await createUserWithEmailAndPassword(auth, email, password);

            setUser(userCredential.user);
            router.replace('/(tabs)/explore');

        } catch (error) {
            switch(error.message){
                case 'auth/user-not-found':
                    setError('No user found with this email.');
                    break;
                case 'auth/wrong-password':
                    setError('Incorrect password.');
                    break;
                case 'auth/email-already-in-use':
                    setError('This email is already in use.');
                    break;
                case 'auth/invalid-email':
                    setError('Invalid email address.');
                    break;   
                default:
                    setError('An error occurred. Please try again.');
            }
        } finally {
            setloading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
            <Text style={styles.appName}>Kettering Companion</Text>
        </Animated.View>

        <Animated.View style={[styles.form, { opacity: formAnim }]}>
            {/* Tab Toggle */}
            <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, isLogin && styles.activeTab]}
                onPress={() => setIsLogin(true)}
            >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                Log In
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, !isLogin && styles.activeTab]}
                onPress={() => setIsLogin(false)}
            >
                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                Sign Up
                </Text>
            </TouchableOpacity>
            </View>

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#888"
            />

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#888"
            />

            {/* Confirm password for signup */}
            {!isLogin && (
            <>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#888"
                />
            </>
            )}
            {error ? (<text style={styles.errorText}>{error}</text>) : null}

            <TouchableOpacity style={styles.button} onPress={handleAuth} activeOpacity={0.8}>
            <Text style={styles.buttonText}>{loading ? 'Please wait...' :isLogin ? "Log In" : "Sign Up"}</Text>
            </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>
            {isLogin
            ? "Welcome back! Enter your credentials to continue."
            : "Create a new account to get started."}
        </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6F0F3",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1D3D47",
    textAlign: "center",
  },
  form: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#E6F0F3",
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#4BA3C7",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D3D47",
  },
  activeTabText: {
    color: "#fff",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D3D47",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: "#1D3D47",
  },
  button: {
    backgroundColor: "#4BA3C7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  footer: {
    marginTop: 20,
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  errorText: {
    fontFamily: 'arial',
    color: '#D64545',
    marginBottom: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});