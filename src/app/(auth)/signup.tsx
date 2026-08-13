// src/app/(auth)/signup.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconArrowLeft, IconEye, IconEyeOff } from '@tabler/icons-react-native';
import { supabase } from '@/lib/supabase';
import { Colors, Radius, FontSize } from '@/constants/theme';

function parseSignUpError(err: any): string {
  const msg: string = err?.message ?? '';
  const code: string = err?.code ?? '';
  if (code === 'user_already_exists' || msg.includes('User already registered'))
    return 'Este e-mail já está cadastrado.';
  if (msg.includes('Password should be') || msg.includes('password'))
    return 'Senha deve ter pelo menos 8 caracteres.';
  if (msg.includes('Unable to validate email') || msg.includes('invalid email'))
    return 'Endereço de e-mail inválido.';
  if (code === 'too_many_requests' || msg.includes('rate limit'))
    return 'Muitas tentativas. Aguarde e tente novamente.';
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Sem conexão. Verifique sua rede.';
  return 'Não foi possível criar a conta. Tente novamente.';
}

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSignUp() {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!name.trim())   { setErrorMsg('Informe seu nome.'); return; }
    if (!email.trim())  { setErrorMsg('Informe seu e-mail.'); return; }
    if (!password.trim()) { setErrorMsg('Informe uma senha.'); return; }
    if (password.length < 8) { setErrorMsg('A senha deve ter pelo menos 8 caracteres.'); return; }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email:    email.trim().toLowerCase(),
        password,
        options:  { data: { name: name.trim() } },
      });
      if (error) throw error;
      setSuccessMsg('Conta criada! Verifique seu e-mail para confirmar.');
    } catch (err: any) {
      setErrorMsg(parseSignUpError(err));
    } finally {
      setLoading(false);
    }
  }

  const clear = () => { setErrorMsg(null); setSuccessMsg(null); };
  const isWeb = Platform.OS === 'web';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bgPage }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow:          1,
          paddingTop:        isWeb ? 0 : insets.top + 24,
          paddingBottom:     insets.bottom + 32,
          paddingHorizontal: 24,
          justifyContent:    'center',
          alignItems:        'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{
          width:           '100%',
          maxWidth:        400,
          backgroundColor: Colors.bgCard,
          borderRadius:    Radius.xl,
          borderWidth:     1,
          borderColor:     Colors.border,
          padding:         32,
        }}>
          {/* Voltar */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flexDirection:   'row',
              alignItems:      'center',
              gap:             6,
              marginBottom:    24,
            }}
          >
            <IconArrowLeft size={16} color={Colors.muted} />
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>Voltar</Text>
          </TouchableOpacity>

          {/* Título */}
          <Text style={{
            color:         Colors.text,
            fontSize:      22,
            fontWeight:    '600',
            letterSpacing: -0.5,
            marginBottom:  6,
          }}>
            Criar conta
          </Text>
          <Text style={{
            color:        Colors.muted,
            fontSize:     FontSize.sm,
            marginBottom: 28,
          }}>
            É grátis, leva menos de 1 minuto.
          </Text>

          {/* Feedback */}
          {errorMsg ? (
            <View style={{
              backgroundColor: Colors.errorBg,
              borderWidth:     1,
              borderColor:     Colors.error + '60',
              borderRadius:    Radius.md,
              padding:         12,
              marginBottom:    20,
            }}>
              <Text style={{ color: Colors.error, fontSize: FontSize.sm }}>{errorMsg}</Text>
            </View>
          ) : null}
          {successMsg ? (
            <View style={{
              backgroundColor: Colors.successBg,
              borderWidth:     1,
              borderColor:     Colors.success + '60',
              borderRadius:    Radius.md,
              padding:         12,
              marginBottom:    20,
            }}>
              <Text style={{ color: Colors.success, fontSize: FontSize.sm }}>{successMsg}</Text>
            </View>
          ) : null}

          {/* Campo helper */}
          {(
            [
              { label: 'Nome', value: name, setValue: setName, placeholder: 'Como quer ser chamado?', type: 'default' as const, autoCapitalize: 'words' as const },
              { label: 'E-mail', value: email, setValue: setEmail, placeholder: 'seu@email.com', type: 'email-address' as const, autoCapitalize: 'none' as const },
            ] as Array<{label:string;value:string;setValue:(v:string)=>void;placeholder:string;type:any;autoCapitalize:any}>
          ).map(({ label, value, setValue, placeholder, type, autoCapitalize }) => (
            <View key={label} style={{ marginBottom: 14 }}>
              <Text style={{
                color:         Colors.muted,
                fontSize:      FontSize.xs,
                fontWeight:    '500',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom:  6,
              }}>
                {label}
              </Text>
              <View style={{
                backgroundColor:   Colors.bgPage,
                borderRadius:      Radius.md,
                borderWidth:       1,
                borderColor:       Colors.border,
                paddingHorizontal: 14,
                height:            46,
                justifyContent:    'center',
              }}>
                <TextInput
                  value={value}
                  onChangeText={(v) => { setValue(v); clear(); }}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType={type}
                  autoCapitalize={autoCapitalize}
                  style={{ color: Colors.text, fontSize: FontSize.md }}
                />
              </View>
            </View>
          ))}

          {/* Senha */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              color:         Colors.muted,
              fontSize:      FontSize.xs,
              fontWeight:    '500',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom:  6,
            }}>
              Senha
            </Text>
            <View style={{
              backgroundColor:   Colors.bgPage,
              borderRadius:      Radius.md,
              borderWidth:       1,
              borderColor:       Colors.border,
              paddingHorizontal: 14,
              height:            46,
              flexDirection:     'row',
              alignItems:        'center',
            }}>
              <TextInput
                value={password}
                onChangeText={(v) => { setPassword(v); clear(); }}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={Colors.textDisabled}
                secureTextEntry={!showPw}
                style={{ flex: 1, color: Colors.text, fontSize: FontSize.md }}
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)} style={{ padding: 4 }}>
                {showPw
                  ? <IconEyeOff size={18} color={Colors.muted} />
                  : <IconEye    size={18} color={Colors.muted} />
                }
              </TouchableOpacity>
            </View>
            <Text style={{ color: Colors.textDisabled, fontSize: FontSize.xs, marginTop: 5 }}>
              Use letras, números e símbolos para uma senha segura.
            </Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
            style={{
              backgroundColor: Colors.primary,
              borderRadius:    Radius.md,
              height:          46,
              alignItems:      'center',
              justifyContent:  'center',
              opacity:         loading ? 0.65 : 1,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: FontSize.md, fontWeight: '600' }}>
              {loading ? 'Criando conta…' : 'Criar conta'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
