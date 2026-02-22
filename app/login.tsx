import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';

// Required for expo-auth-session OAuth redirect handling
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const { signIn, signUp } = useAuth();

    const [showEmailForm, setShowEmailForm] = useState(false);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // ─── Google OAuth ────────────────────────────────────────────
    const handleGoogleSignIn = async () => {
        setError('');
        setGoogleLoading(true);

        try {
            // Build the redirect URL — auto-detects the correct scheme:
            // In Expo Go: exp://192.168.x.x:8081/--/auth/callback
            // In production build: signalmobile://auth/callback
            const redirectUrl = AuthSession.makeRedirectUri();

            console.log('[Auth] Redirect URL:', redirectUrl);

            const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (oauthError) {
                setError(oauthError.message);
                setGoogleLoading(false);
                return;
            }

            if (data?.url) {
                // Open the OAuth URL in the system browser
                // The second arg tells WebBrowser what URL pattern to listen for to close the browser
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl,
                );

                if (result.type === 'success' && result.url) {
                    const callbackUrl = result.url;
                    console.log('[Auth] Callback URL received:', callbackUrl);

                    let accessToken: string | null = null;
                    let refreshToken: string | null = null;
                    let oauthError: string | null = null;

                    // Manual parsing to be more robust across different environments
                    const paramsPart = callbackUrl.includes('#')
                        ? callbackUrl.split('#')[1]
                        : callbackUrl.includes('?')
                            ? callbackUrl.split('?')[1]
                            : '';

                    if (paramsPart) {
                        const pairs = paramsPart.split('&');
                        for (const pair of pairs) {
                            const [key, value] = pair.split('=');
                            if (key === 'access_token') accessToken = value;
                            if (key === 'refresh_token') refreshToken = value;
                            if (key === 'error_description') oauthError = decodeURIComponent(value.replace(/\+/g, ' '));
                            if (key === 'error' && !oauthError) oauthError = value;
                        }
                    }

                    if (accessToken && refreshToken) {
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (sessionError) {
                            logger.error(sessionError, { tags: { service: 'auth', method: 'setSession' } });
                            setError(`Session error: ${sessionError.message}`);
                        }
                    } else if (oauthError) {
                        setError(`Google Sign-in: ${oauthError}`);
                    } else {
                        logger.warn('No tokens found in callback URL', { extra: { callbackUrl } });
                        setError('Sign-in completed but no session was returned. Please check your Supabase configuration.');
                    }
                } else if (result.type === 'cancel' || result.type === 'dismiss') {
                    console.log('[Auth] User cancelled Google sign-in');
                } else if (result.type === 'error') {
                    setError('The login browser failed to open. Please try again.');
                }
            }
        } catch (err) {
            logger.error(err, { tags: { service: 'auth', method: 'googleSignIn' } });
            setError('Google sign-in failed. Please try again.');
        } finally {
            setGoogleLoading(false);
        }
    };

    // ─── Email/Password ──────────────────────────────────────────
    const validate = () => {
        if (!email.trim()) { setError('Email is required'); return false; }
        if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return false; }
        if (!password) { setError('Password is required'); return false; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return false; }
        if (mode === 'signup' && password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleEmailSubmit = async () => {
        setError('');
        setSuccess('');
        if (!validate()) return;

        setLoading(true);
        try {
            if (mode === 'signup') {
                const { error: signUpError } = await signUp(email, password);
                if (signUpError) {
                    setError(signUpError);
                } else {
                    setSuccess('Check your email to verify your account, then sign in.');
                    setMode('signin');
                    setPassword('');
                    setConfirmPassword('');
                }
            } else {
                const { error: signInError } = await signIn(email, password);
                if (signInError) {
                    setError(signInError);
                }
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Brand Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="pulse" size={32} color="#ec4899" />
                        </View>
                        <Text style={styles.brandTitle}>Signal</Text>
                        <Text style={styles.brandSubtitle}>
                            Because knowing where you stand{'\n'}feels better than wondering.
                        </Text>
                    </View>

                    {/* Error / Success Messages */}
                    {error ? (
                        <View style={styles.errorBanner}>
                            <Ionicons name="alert-circle" size={16} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}
                    {success ? (
                        <View style={styles.successBanner}>
                            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                            <Text style={styles.successText}>{success}</Text>
                        </View>
                    ) : null}

                    {/* ────── Primary: Google Sign In ────── */}
                    <TouchableOpacity
                        style={[styles.googleButton, googleLoading && { opacity: 0.6 }]}
                        onPress={handleGoogleSignIn}
                        disabled={googleLoading || loading}
                        activeOpacity={0.8}
                    >
                        {googleLoading ? (
                            <ActivityIndicator size="small" color="#1C1C1E" />
                        ) : (
                            <>
                                <View style={styles.googleIconWrap}>
                                    <Text style={styles.googleG}>G</Text>
                                </View>
                                <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* ────── Secondary: Email/Password ────── */}
                    {!showEmailForm ? (
                        <TouchableOpacity
                            style={styles.emailToggleButton}
                            onPress={() => setShowEmailForm(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="mail-outline" size={18} color="#1C1C1E" />
                            <Text style={styles.emailToggleText}>CONTINUE WITH EMAIL</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.emailForm}>
                            {/* Mode Toggle */}
                            <View style={styles.toggleContainer}>
                                <TouchableOpacity
                                    style={[styles.toggleButton, mode === 'signin' && styles.toggleActive]}
                                    onPress={() => { setMode('signin'); setError(''); setSuccess(''); }}
                                >
                                    <Text style={[styles.toggleText, mode === 'signin' && styles.toggleTextActive]}>
                                        SIGN IN
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.toggleButton, mode === 'signup' && styles.toggleActive]}
                                    onPress={() => { setMode('signup'); setError(''); setSuccess(''); }}
                                >
                                    <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                                        CREATE ACCOUNT
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>EMAIL</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="you@example.com"
                                placeholderTextColor="#C7C7CC"
                                value={email}
                                onChangeText={(t) => { setEmail(t); setError(''); }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                selectionColor="#1C1C1E"
                            />

                            <Text style={styles.label}>PASSWORD</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    placeholder="••••••••"
                                    placeholderTextColor="#C7C7CC"
                                    value={password}
                                    onChangeText={(t) => { setPassword(t); setError(''); }}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    selectionColor="#1C1C1E"
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#8E8E93"
                                    />
                                </TouchableOpacity>
                            </View>

                            {mode === 'signup' && (
                                <>
                                    <Text style={styles.label}>CONFIRM PASSWORD</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#C7C7CC"
                                        value={confirmPassword}
                                        onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        selectionColor="#1C1C1E"
                                    />
                                </>
                            )}

                            <TouchableOpacity
                                style={[styles.emailSubmitButton, loading && { opacity: 0.6 }]}
                                onPress={handleEmailSubmit}
                                disabled={loading || googleLoading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.emailSubmitText}>
                                        {mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => { setShowEmailForm(false); setError(''); setSuccess(''); }}
                            >
                                <Text style={styles.backButtonText}>BACK</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            By continuing, you agree to Signal's{'\n'}
                            <Text style={styles.footerLink}>Terms of Service</Text> and <Text style={styles.footerLink}>Privacy Policy</Text>.
                        </Text>
                        <Text style={[styles.footerText, { marginTop: 12, opacity: 0.6 }]}>
                            Notice: Signal uses artificial intelligence to analyze relationship dynamics. AI-generated content can be inaccurate; use it as a tool for reflection, not as absolute fact.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    footer: {
        marginTop: 40,
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    footerText: {
        fontSize: 11,
        color: '#C7C7CC',
        textAlign: 'center',
        lineHeight: 18,
    },
    footerLink: {
        color: '#8E8E93',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 28,
        paddingBottom: 40,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
        marginTop: 80,
    },
    logoContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    brandTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 44,
        color: '#1C1C1E',
        marginBottom: 12,
    },
    brandSubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 22,
    },

    // Error / Success
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEF2F2',
        padding: 14,
        borderRadius: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        fontSize: 13,
        color: '#EF4444',
        flex: 1,
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F0FDF4',
        padding: 14,
        borderRadius: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    successText: {
        fontSize: 13,
        color: '#16A34A',
        flex: 1,
    },

    // Google Button (Primary)
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#FFFFFF',
        height: 56,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    googleIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    googleG: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    googleButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: 1,
    },

    // Divider
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#F2F2F7',
    },
    dividerText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#C7C7CC',
        letterSpacing: 2,
        marginHorizontal: 16,
    },

    // Email Toggle Button
    emailToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#1C1C1E',
        height: 56,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    emailToggleText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
    },

    // Email Form
    emailForm: {
        marginBottom: 8,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        padding: 3,
        marginBottom: 24,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 17,
        alignItems: 'center',
    },
    toggleActive: {
        backgroundColor: '#1C1C1E',
    },
    toggleText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        color: '#8E8E93',
    },
    toggleTextActive: {
        color: '#FFFFFF',
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1.5,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#F2F2F7',
        marginBottom: 8,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    eyeButton: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    emailSubmitButton: {
        backgroundColor: '#1C1C1E',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    emailSubmitText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    backButton: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    backButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
    },
});
