// src/components/baby/AddChildForm.tsx
// UC043 — formulário "adicionar filho"
// Chip "+" no seletor → este modal → cria registro em `babies` (bebê) ou
// profile com role=child (criança/adolescente) → novo filho aparece selecionado.

import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import {
  IconBabyBottle,
  IconStar,
  IconCalendar,
  IconX,
} from '@tabler/icons-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

// ─── Tipos ────────────────────────────────────────────────────────
export type ChildType = 'baby' | 'child';

export interface AddChildResult {
  type: ChildType;
  name: string;
  birthDate: string; // YYYY-MM-DD
}

interface Props {
  visible: boolean;
  saving?: boolean;
  onClose: () => void;
  /** Chamado quando o usuário confirma. O formulário não fecha sozinho —
   *  quem usa é responsável por fechar via `onClose` após salvar. */
  onSubmit: (result: AddChildResult) => void;
}

// ─── TypeCard ────────────────────────────────────────────────────
function TypeCard({
  type,
  selected,
  onPress,
}: {
  type: ChildType;
  selected: boolean;
  onPress: () => void;
}) {
  const isBaby = type === 'baby';
  const accent = isBaby ? Colors.primary : Colors.secondary;
  const icon   = isBaby ? IconBabyBottle : IconStar;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={
        isBaby
          ? 'bebê — rotina, sono, mamada'
          : 'criança ou adolescente — tarefas, pontos, escola'
      }
      style={{
        flex: 1,
        backgroundColor: selected ? accent : Colors.bgCard,
        borderRadius: Radius.lg,
        borderWidth: 2,
        borderColor: selected ? accent : Colors.border,
        paddingVertical: Spacing.xl,
        paddingHorizontal: Spacing.md,
        alignItems: 'center',
        gap: Spacing.sm,
      }}
    >
      {React.createElement(icon, {
        size: 28,
        color: selected ? Colors.textOnLight : Colors.muted,
        strokeWidth: 1.8,
      })}
      <Text
        style={{
          color: selected ? Colors.textOnLight : Colors.text,
          fontSize: FontSize.lg,
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {isBaby ? 'bebê' : 'criança /\nadolescente'}
      </Text>
      <Text
        style={{
          color: selected ? Colors.textOnLight : Colors.muted,
          fontSize: FontSize.xs,
          textAlign: 'center',
          lineHeight: 16,
        }}
        numberOfLines={2}
      >
        {isBaby
          ? 'rotina, sono, mamada'
          : 'tarefas, pontos, escola'}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Formata Date → "dd/mm/aaaa" ─────────────────────────────────
function formatDisplay(d: Date): string {
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function toISO(d: Date): string {
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Componente principal ─────────────────────────────────────────
export function AddChildForm({ visible, saving = false, onClose, onSubmit }: Props) {
  const [childType,    setChildType]    = useState<ChildType>('baby');
  const [name,         setName]         = useState('');
  const [birthDate,    setBirthDate]    = useState<Date | null>(null);
  const [showPicker,   setShowPicker]   = useState(false);
  const [nameError,    setNameError]    = useState('');
  const [dateError,    setDateError]    = useState('');

  // Limpa o formulário quando o modal reabre
  const handleShow = useCallback(() => {
    setChildType('baby');
    setName('');
    setBirthDate(null);
    setShowPicker(false);
    setNameError('');
    setDateError('');
  }, []);

  const canSubmit = name.trim().length > 0 && birthDate !== null;

  const validate = (): boolean => {
    let ok = true;
    if (!name.trim()) {
      setNameError('nome é obrigatório');
      ok = false;
    } else {
      setNameError('');
    }
    if (!birthDate) {
      setDateError('data de nascimento é obrigatória');
      ok = false;
    } else if (birthDate > new Date()) {
      setDateError('data não pode ser no futuro');
      ok = false;
    } else {
      setDateError('');
    }
    return ok;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      type: childType,
      name: name.trim(),
      birthDate: toISO(birthDate!),
    });
  };

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (selected) setBirthDate(selected);
  };

  const handleDateValueChange = (_: any, selected?: Date) => {
    setShowPicker(false);
    if (selected) setBirthDate(selected);
  };

  const handleDateDismiss = () => setShowPicker(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Overlay escuro — toque fora fecha */}
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sheet */}
        <View
          style={{
            backgroundColor: Colors.bgCard,
            borderTopLeftRadius:  Radius['2xl'],
            borderTopRightRadius: Radius['2xl'],
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: Colors.border,
            paddingBottom: 40,
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: Spacing['2xl'] }}
          >
            {/* Cabeçalho */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: 'Georgia',
                    color: Colors.text,
                    fontSize: FontSize.xxl,
                    lineHeight: 28,
                  }}
                >
                  adicionar filho
                </Text>
                <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 4 }}>
                  escolha o tipo pra personalizar a experiência
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="fechar"
              >
                <IconX size={20} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Seleção de tipo — radiogroup */}
            <View
              accessibilityRole="radiogroup"
              style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl }}
            >
              <TypeCard type="baby"  selected={childType === 'baby'}  onPress={() => setChildType('baby')}  />
              <TypeCard type="child" selected={childType === 'child'} onPress={() => setChildType('child')} />
            </View>

            {/* Campo: nome */}
            <View style={{ marginBottom: Spacing.lg }}>
              <Text
                style={{
                  color: Colors.muted,
                  fontSize: FontSize.xs,
                  fontWeight: '500',
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                nome
              </Text>
              <TextInput
                value={name}
                onChangeText={(t) => { setName(t); if (nameError) setNameError(''); }}
                placeholder="ex: João"
                placeholderTextColor={Colors.border}
                autoCapitalize="words"
                returnKeyType="next"
                accessibilityLabel="nome da criança"
                style={{
                  backgroundColor: Colors.bg,
                  borderRadius: Radius.md,
                  borderWidth: 1.5,
                  borderColor: nameError ? Colors.error : Colors.border,
                  color: Colors.text,
                  fontSize: FontSize.md,
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: 14,
                }}
              />
              {nameError ? (
                <Text style={{ color: Colors.error, fontSize: FontSize.xs, marginTop: 4 }}>
                  {nameError}
                </Text>
              ) : null}
            </View>

            {/* Campo: data de nascimento */}
            <View style={{ marginBottom: Spacing['2xl'] }}>
              <Text
                style={{
                  color: Colors.muted,
                  fontSize: FontSize.xs,
                  fontWeight: '500',
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                data de nascimento
              </Text>
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                accessibilityLabel="selecionar data de nascimento"
                style={{
                  backgroundColor: Colors.bg,
                  borderRadius: Radius.md,
                  borderWidth: 1.5,
                  borderColor: dateError ? Colors.error : Colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color: birthDate ? Colors.text : Colors.border,
                    fontSize: FontSize.md,
                  }}
                >
                  {birthDate ? formatDisplay(birthDate) : 'dd/mm/aaaa'}
                </Text>
                <IconCalendar size={18} color={Colors.muted} strokeWidth={1.8} />
              </TouchableOpacity>
              {dateError ? (
                <Text style={{ color: Colors.error, fontSize: FontSize.xs, marginTop: 4 }}>
                  {dateError}
                </Text>
              ) : null}
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="confirmar adição de filho"
              accessibilityState={{ disabled: saving || !canSubmit }}
              activeOpacity={0.82}
              style={{
                backgroundColor: canSubmit && !saving ? Colors.primary : Colors.border,
                borderRadius: Radius.lg,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.textOnLight} />
              ) : (
                <Text
                  style={{
                    color: canSubmit ? Colors.textOnLight : Colors.muted,
                    fontSize: FontSize.lg,
                    fontWeight: '600',
                  }}
                >
                  adicionar
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* DateTimePicker nativo */}
        {showPicker && (
          <DateTimePicker
            value={birthDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            {...(Platform.OS === 'android'
              ? { onValueChange: handleDateValueChange, onDismiss: handleDateDismiss }
              : { onChange: handleDateChange })}
            textColor={Colors.text}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
