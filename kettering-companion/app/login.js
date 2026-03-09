import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  getMultiFactorResolver,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthContext } from '../context/AuthProvider';
import { auth, db } from "../lib/firebase";

export default function AuthScreen() {

  const [isLogin, setIsLogin] = useState(true);
  const { setUser } = useContext(AuthContext);
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [verificationId, setVerificationId] = useState('');
  const [resolver, setResolver] = useState(null);

  const [forceEnroll, setForceEnroll] = useState(false);
  const [is2FALogin, setIs2FALogin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const recaptchaRef = useRef(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: false,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  // Correct reCAPTCHA setup (Web Only)
  useEffect(() => {
    if (Platform.OS === "web" && !recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
      recaptchaRef.current.render();
    }
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
      setLoading(true);
      setError(null);

      if (isLogin) {

        const userCredential =
          await signInWithEmailAndPassword(auth, email, password);

        await userCredential.user.reload();

        if (!userCredential.user.emailVerified) {
          setError("Please verify your email before logging in.");
          return;
        }

        // Force SMS enrollment if none exists
        if (multiFactor(userCredential.user).enrolledFactors.length === 0) {
          setUser(userCredential.user);
          setForceEnroll(true);
          return;
        }

        setUser(userCredential.user);
        router.replace('/(tabs)/mainCalendar');

      } else {

        const userCredential =
          await createUserWithEmailAndPassword(auth, email, password);

        try {
          await setDoc(doc(db, "users", userCredential.user.uid), {
            name: fullName,
            email: email.toLowerCase(),
            role: "student",
            clubsManaging: [],
            createdAt: serverTimestamp(),
          });

          console.log("User document created successfully");
        } catch (err) {
          console.error("Failed to create user document:", err);
        }
        
        await sendEmailVerification(userCredential.user);

        alert("Verification email sent. Please verify before logging in.");
      }

    } catch (error) {

      if (error.code === "auth/multi-factor-auth-required") {

        const multiFactorResolver =
          getMultiFactorResolver(auth, error);

        setResolver(multiFactorResolver);

        const phoneAuthProvider = new PhoneAuthProvider(auth);

        const id =
          await phoneAuthProvider.verifyPhoneNumber(
            {
              multiFactorHint: multiFactorResolver.hints[0],
              session: multiFactorResolver.session,
            },
            recaptchaRef.current
          );

        setVerificationId(id);
        setIs2FALogin(true);

      } else {
        setError(error.message);
      }

    } finally {
      setLoading(false);
    }
  };

  // Start Enrollment
  const handleEnroll = async () => {

    const session =
      await multiFactor(auth.currentUser).getSession();

    const phoneAuthProvider = new PhoneAuthProvider(auth);

    const id =
      await phoneAuthProvider.verifyPhoneNumber(
        { phoneNumber, session },
        recaptchaRef.current
      );

    setVerificationId(id);
  };

  // Confirm Enrollment
  const confirmEnrollment = async () => {

    const credential =
      PhoneAuthProvider.credential(verificationId, verificationCode);

    const assertion =
      PhoneMultiFactorGenerator.assertion(credential);

    await multiFactor(auth.currentUser).enroll(
      assertion,
      "Primary Phone"
    );

    router.replace('/(tabs)/mainCalendar');
  };

  // Verify Login Challenge
  const handleVerifyLogin2FA = async () => {

    const credential =
      PhoneAuthProvider.credential(verificationId, verificationCode);

    const assertion =
      PhoneMultiFactorGenerator.assertion(credential);

    await resolver.resolveSignIn(assertion);

    setUser(auth.currentUser);
    router.replace('/(tabs)/mainCalendar');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert('Please enter your email to reset password.');
      return;
    }

    await sendPasswordResetEmail(auth, email);
    alert('Password reset email sent!');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >

      {Platform.OS === "web" && (
       <View id="recaptcha-container" style={{ display: "none" }} />
      )}
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Text style={styles.appName}>Kettering Companion</Text>
      </Animated.View>

      <Animated.View style={[styles.form, { opacity: formAnim }]}>

        {!forceEnroll && !is2FALogin && (
          <>
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

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholder="user@kettering.edu"
              placeholderTextColor="#888"
            />
            
            {!isLogin && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#888"
                />
              </>
            )}

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#888"
            />

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

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.button} onPress={handleAuth}>
              <Text style={styles.buttonText}>
                {loading ? 'Please wait...' : isLogin ? "Log In" : "Sign Up"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {forceEnroll && (
          <>
            <Text style={styles.label}>Enter Phone Number</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              style={styles.input}
              placeholder="+11234567890"
              placeholderTextColor="#888"
            />

            <TouchableOpacity style={styles.button} onPress={handleEnroll}>
              <Text style={styles.buttonText}>Send Code</Text>
            </TouchableOpacity>

            <TextInput
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              style={styles.input}
              placeholder="Enter SMS Code"
              placeholderTextColor="#888"
            />

            <TouchableOpacity style={styles.button} onPress={confirmEnrollment}>
              <Text style={styles.buttonText}>Confirm 2FA</Text>
            </TouchableOpacity>
          </>
        )}

        {is2FALogin && (
          <>
            <Text style={styles.label}>Enter SMS Code</Text>
            <TextInput
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              style={styles.input}
              placeholder="123456"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.button} onPress={handleVerifyLogin2FA}>
              <Text style={styles.buttonText}>Verify Code</Text>
            </TouchableOpacity>
          </>
        )}

      </Animated.View>

      {isLogin && !forceEnroll && !is2FALogin && (
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

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
    forgotPasswordText: {
        color: "#4BA3C7",
        fontWeight: "600",
        textAlign: "right",
        marginBottom: 15,
        marginTop: 15,}
});