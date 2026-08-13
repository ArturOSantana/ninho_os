// src/components/onboarding/InviteUI.tsx
// Paleta dark do handoff — onboarding/convidar parceiro

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { IconCopy } from '@tabler/icons-react-native';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

interface InviteUIProps {
  familyId:  string;
  link:      string;
  deeplink:  string;
  expiresAt: string;
  onComplete: () => void;
}

/**
 * InviteUI — UC009: Convidar Parceiro
 * Segue spec do handoff: card tracejado, CTA primário, link "pular" discreto.
 */
export const InviteUI: React.FC<InviteUIProps> = ({
  link,
  deeplink,
  expiresAt,
  onComplete,
}) => {
  const [showQR, setShowQR] = useState(false);

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(link);
      Alert.alert('Pronto', 'Link copiado para a área de transferência!');
    } catch {
      Alert.alert('Erro', 'Falha ao copiar link');
    }
  };

  const handleShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Clipboard.setStringAsync(`Entra na nossa família no Ninho!\n\n${link}`);
        Alert.alert('Pronto!', 'Mensagem copiada. Cole onde quiser compartilhar.');
      } else {
        await Clipboard.setStringAsync(link);
        Alert.alert('Pronto!', 'Link copiado para a área de transferência.');
      }
    } catch {
      Alert.alert('Erro', 'Falha ao compartilhar');
    }
  };

  return (
    <View style={{ gap: Spacing.md }}>
      {/* Card do link de convite */}
      <View style={{
        backgroundColor: Colors.card,
        borderRadius:    Radius.md,
        padding:         Spacing.lg,
        borderWidth:     1,
        borderColor:     Colors.border,
      }}>
        <Text style={{ fontSize: FontSize.xs, color: Colors.muted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm }}>
          link de convite
        </Text>

        {/* Link copiável */}
        <TouchableOpacity
          onPress={handleCopyLink}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Toque para copiar o link de convite"
          style={{
            backgroundColor: Colors.bg,
            borderRadius:    Radius.sm,
            padding:         Spacing.md,
            marginBottom:    Spacing.sm,
            flexDirection:   'row',
            alignItems:      'center',
            justifyContent:  'space-between',
            borderWidth:     1,
            borderColor:     Colors.border,
          }}
        >
          <Text style={{ color: Colors.secondary, fontSize: FontSize.xs, flex: 1, fontFamily: 'monospace' }} numberOfLines={1}>
            {link}
          </Text>
          <IconCopy size={18} color={Colors.muted} style={{ marginLeft: Spacing.sm }} />
        </TouchableOpacity>

        {/* Botão copiar */}
        <TouchableOpacity
          onPress={handleCopyLink}
          accessible
          accessibilityRole="button"
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary,
            borderRadius:    Radius.md,
            paddingVertical: Spacing.md,
            alignItems:      'center',
            marginBottom:    Spacing.sm,
          }}
        >
          <Text style={{ color: Colors.onLight, fontWeight: '500', fontSize: FontSize.base }}>
            copiar link
          </Text>
        </TouchableOpacity>

        {/* Botão compartilhar */}
        <TouchableOpacity
          onPress={handleShare}
          accessible
          accessibilityRole="button"
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.secondary,
            borderRadius:    Radius.md,
            paddingVertical: Spacing.md,
            alignItems:      'center',
          }}
        >
          <Text style={{ color: Colors.onLight, fontWeight: '500', fontSize: FontSize.base }}>
            compartilhar
          </Text>
        </TouchableOpacity>
      </View>

      {/* QR Code */}
      <View style={{ gap: Spacing.xs }}>
        <TouchableOpacity
          onPress={() => setShowQR(!showQR)}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${showQR ? 'Ocultar' : 'Mostrar'} QR Code`}
          style={{
            backgroundColor: Colors.card,
            borderRadius:    Radius.md,
            padding:         Spacing.lg,
            borderWidth:     1,
            borderColor:     Colors.border,
            flexDirection:   'row',
            alignItems:      'center',
            justifyContent:  'space-between',
          }}
        >
          <View>
            <Text style={{ fontSize: FontSize.xs, color: Colors.muted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
              qr code
            </Text>
            <Text style={{ fontSize: FontSize.base, color: Colors.text, fontWeight: '500' }}>
              {showQR ? 'ocultar' : 'mostrar'} QR Code
            </Text>
          </View>
          <Text style={{ color: Colors.muted, fontSize: 18 }}>{showQR ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showQR && (
          <View style={{
            alignItems:      'center',
            paddingVertical: Spacing.xl,
            backgroundColor: Colors.card,
            borderRadius:    Radius.md,
            borderWidth:     1,
            borderColor:     Colors.border,
          }}>
            <QRCode
              value={deeplink}
              size={192}
              color="#000000"
              backgroundColor="#FFFFFF"
              ecl="H"
            />
            <Text style={{ fontSize: FontSize.xs, color: Colors.muted, marginTop: Spacing.md, textAlign: 'center', paddingHorizontal: Spacing.lg }}>
              seu parceiro pode escanear este código com a câmera
            </Text>
          </View>
        )}
      </View>

      {/* Info de expiração */}
      <View style={{
        backgroundColor: Colors.primary + '18',
        borderRadius:    Radius.sm,
        padding:         Spacing.md,
        borderWidth:     1,
        borderColor:     Colors.primary + '44',
      }}>
        <Text style={{ fontSize: FontSize.xs, color: Colors.primary, fontWeight: '500', marginBottom: 2 }}>
          INFORMAÇÃO
        </Text>
        <Text style={{ fontSize: FontSize.sm, color: Colors.text }}>
          este convite expira em{' '}
          {new Date(expiresAt).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      {/* Botão continuar */}
      <TouchableOpacity
        onPress={onComplete}
        accessible
        accessibilityRole="button"
        activeOpacity={0.85}
        style={{
          backgroundColor: Colors.bg,
          borderRadius:    Radius.lg,
          paddingVertical: Spacing.lg,
          alignItems:      'center',
          borderWidth:     1,
          borderColor:     Colors.border,
        }}
      >
        <Text style={{ color: Colors.text, fontWeight: '500', fontSize: FontSize.base }}>
          continuar
        </Text>
      </TouchableOpacity>
    </View>
  );
};
