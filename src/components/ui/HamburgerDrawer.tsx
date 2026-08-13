// src/components/ui/HamburgerDrawer.tsx
// Bottom drawer que aparece ao tocar no ícone "Mais" da tab bar no mobile
import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  IconShoppingCart,
  IconScale,
  IconHeart,
  IconUsers,
  IconUser,
  IconBell,
  IconFileReport,
  IconX,
  IconBabyBottle,
  IconChevronRight,
} from '@tabler/icons-react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useFamily } from '@/hooks';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';

type DrawerItem = {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  requiresPartner?: boolean;
};

const DRAWER_ITEMS: DrawerItem[] = [
  {
    key: 'shopping',
    label: 'Lista de Compras',
    description: 'Gerencie compras em família',
    icon: <IconShoppingCart size={20} color={Colors.primary} />,
    route: '/(app)/(shopping)',
  },
  {
    key: 'mental-load',
    label: 'Carga Mental',
    description: 'Equilíbrio de tarefas do casal',
    icon: <IconScale size={20} color={Colors.amber} />,
    route: '/(app)/(mental-load)',
    requiresPartner: true,
  },
  {
    key: 'couple',
    label: 'Casal',
    description: 'Check-in e conexão com o parceiro',
    icon: <IconHeart size={20} color={Colors.error} />,
    route: '/(app)/(couple)',
    requiresPartner: true,
  },
  {
    key: 'kids',
    label: 'Filhos',
    description: 'Escola, pontos e atividades',
    icon: <IconBabyBottle size={20} color={Colors.secondary} />,
    route: '/(app)/(kids)',
  },
  {
    key: 'family',
    label: 'Família',
    description: 'Membros e convites',
    icon: <IconUsers size={20} color={Colors.success} />,
    route: '/(app)/(family)',
  },
  {
    key: 'notifications',
    label: 'Notificações',
    description: 'Alertas e preferências',
    icon: <IconBell size={20} color={Colors.amber} />,
    route: '/(app)/(notifications)',
  },
  {
    key: 'report',
    label: 'Relatório Familiar',
    description: 'Resumo e exportação PDF',
    icon: <IconFileReport size={20} color={Colors.muted} />,
    route: '/(app)/(more)/report',
  },
  {
    key: 'profile',
    label: 'Perfil e Conta',
    description: 'Editar dados, senha, idioma',
    icon: <IconUser size={20} color={Colors.muted} />,
    route: '/(app)/(more)',
  },
];

interface HamburgerDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function HamburgerDrawer({ visible, onClose }: HamburgerDrawerProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const { family } = useFamily();
  const { members, load: loadMembers } = useFamilyMembers(family?.id);
  useEffect(() => { if (family?.id) loadMembers(); }, [family?.id, loadMembers]);
  const hasPartner = useMemo(
    () => members.filter((m) => m.role === 'admin' || m.role === 'parent').length >= 2,
    [members],
  );
  const visibleItems = useMemo(
    () => DRAWER_ITEMS.filter((item) => !item.requiresPartner || hasPartner),
    [hasPartner],
  );

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 400,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity]);

  function handleNavigate(route: string) {
    onClose();
    // Pequeno delay para o drawer fechar antes de navegar
    setTimeout(() => {
      router.push(route as never);
    }, 180);
  }

  if (!visible && Platform.OS !== 'web') return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', opacity: backdropOpacity }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={{
          position:        'absolute',
          left:            0,
          right:           0,
          bottom:          0,
          backgroundColor: Colors.bgCard,
          borderTopLeftRadius:  Radius['2xl'],
          borderTopRightRadius: Radius['2xl'],
          borderTopWidth:  1,
          borderColor:     Colors.border,
          transform:       [{ translateY }],
          maxHeight:       '85%',
        }}
      >
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{
            width:           40,
            height:          4,
            borderRadius:    2,
            backgroundColor: Colors.border,
          }} />
        </View>

        {/* Header */}
        <View style={{
          flexDirection:     'row',
          alignItems:        'center',
          justifyContent:    'space-between',
          paddingHorizontal: Spacing.xl,
          paddingVertical:   Spacing.md,
        }}>
          <Text style={{
            color:      Colors.text,
            fontSize:   FontSize.lg,
            fontWeight: '600',
          }}>
            Módulos
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width:           30,
              height:          30,
              borderRadius:    Radius.md,
              backgroundColor: Colors.border,
              alignItems:      'center',
              justifyContent:  'center',
            }}
          >
            <IconX size={15} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Lista de itens */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingBottom:     insets.bottom + Spacing.xl,
          }}
        >
          {visibleItems.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.7}
              style={{
                flexDirection:   'row',
                alignItems:      'center',
                paddingVertical: Spacing.md,
                borderBottomWidth: index < visibleItems.length - 1 ? 1 : 0,
                borderBottomColor: Colors.border,
                gap:             14,
              }}
            >
              <View style={{
                width:           40,
                height:          40,
                borderRadius:    Radius.md,
                backgroundColor: Colors.bgPage,
                alignItems:      'center',
                justifyContent:  'center',
              }}>
                {item.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color:      Colors.text,
                  fontSize:   FontSize.md,
                  fontWeight: '500',
                }}>
                  {item.label}
                </Text>
                <Text style={{
                  color:     Colors.muted,
                  fontSize:  FontSize.xs,
                  marginTop: 1,
                }}>
                  {item.description}
                </Text>
              </View>
              <IconChevronRight size={14} color={Colors.textDisabled} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
