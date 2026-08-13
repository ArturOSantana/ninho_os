// src/components/onboarding/BabyForm.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { IconGenderMale, IconGenderFemale, IconCamera } from '@tabler/icons-react-native';
import { BabyGender } from '@/types';

interface BabyFormProps {
  onSubmit: (baby: {
    name: string;
    birth_date: string;
    sex: BabyGender;
    photo_url?: string;
  }) => Promise<void>;
  onRegisterSubmit?: (fn: () => void) => void;
  isLoading?: boolean;
  error?: string;
}

/**
 * BabyForm - Componente para adicionar bebê
 * UC008: Adicionar Bebê
 */
export const BabyForm: React.FC<BabyFormProps> = ({
  onSubmit,
  onRegisterSubmit,
  isLoading = false,
  error,
}) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<Date>(new Date(2024, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<BabyGender>('male');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateName = (value: string) => {
    if (value.length < 2) {
      return 'Nome deve ter no mínimo 2 caracteres';
    }
    if (value.length > 50) {
      return 'Nome deve ter no máximo 50 caracteres';
    }
    return '';
  };

  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const minDate = new Date(today); minDate.setFullYear(today.getFullYear() - 6);

  const validateBirthDate = (date: Date) => {
    if (date > today) {
      return 'A data de nascimento não pode ser no futuro';
    }
    if (date < minDate) {
      return 'O módulo bebê é para crianças de até 6 anos';
    }
    return '';
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Limpa o erro enquanto o usuário digita (só valida no blur ou submit)
    if (fieldErrors.name) {
      setFieldErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const handleNameBlur = () => {
    const error = validateName(name);
    setFieldErrors((prev) => ({ ...prev, name: error }));
  };

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setBirthDate(selectedDate);
      const error = validateBirthDate(selectedDate);
      setFieldErrors((prev) => ({
        ...prev,
        birthDate: error,
      }));
    }
    setShowDatePicker(false);
  };

  const handleDateValueChange = (_event: any, selectedDate?: Date) => {
    handleDateChange(_event, selectedDate);
  };

  const handleDateDismiss = () => {
    setShowDatePicker(false);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Erro', 'Falha ao selecionar imagem');
    }
  };

  const handleSubmit = useCallback(async () => {
    const nameError = validateName(name);
    const dateError = validateBirthDate(birthDate);

    if (nameError || dateError) {
      setFieldErrors({
        name: nameError,
        birthDate: dateError,
      });
      return;
    }

    try {
      setSubmitting(true);

      const birthDateString = birthDate.toISOString().split('T')[0]; // YYYY-MM-DD

      await onSubmit({
        name,
        birth_date: birthDateString,
        sex: gender,
        photo_url: photoUri,
      });
    } catch (err) {
      console.error('Erro ao criar bebê:', err);
    } finally {
      setSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, birthDate, gender, photoUri]);

  // Expõe handleSubmit para o pai (botão "Próximo" do OnboardingStep)
  React.useEffect(() => {
    onRegisterSubmit?.(handleSubmit);
  }, [onRegisterSubmit, handleSubmit]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="gap-4">
      {/* Name Input */}
      <View>
        <Text className="text-sm font-semibold text-white mb-2">
          Nome do Bebê
        </Text>
        <TextInput
          placeholder="Ex: João"
          value={name}
          onChangeText={handleNameChange}
          onBlur={handleNameBlur}
          editable={!isLoading && !submitting}
          className={`border px-4 py-3 rounded-lg text-base ${
            fieldErrors.name ? 'border-red-400' : 'border-white/30'
          }`}
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={{ color: '#ffffff' }}
          accessibilityLabel="Nome do bebê"
          accessibilityHint="Digite o nome do bebê, mínimo 2 caracteres"
        />
        {!!fieldErrors.name && (
          <Text className="text-xs text-red-400 mt-1">{fieldErrors.name}</Text>
        )}
      </View>

      {/* Gender Selection */}
      <View>
        <Text className="text-sm font-semibold text-white mb-2">
          Gênero
        </Text>
        <View className="flex-row gap-3">
          {(['male', 'female'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g)}
              disabled={isLoading || submitting}
              accessibilityRole="button"
              accessibilityLabel={g === 'male' ? 'Menino' : 'Menina'}
              accessibilityState={{ selected: gender === g }}
              className={`flex-1 p-3 rounded-lg border-2 items-center ${
                gender === g ? 'border-blue-400 bg-blue-900/40' : 'border-white/30'
              }`}
            >
              {g === 'male'
                ? <IconGenderMale size={22} color={gender === g ? '#93c5fd' : 'rgba(255,255,255,0.5)'} style={{ marginBottom: 4 }} />
                : <IconGenderFemale size={22} color={gender === g ? '#93c5fd' : 'rgba(255,255,255,0.5)'} style={{ marginBottom: 4 }} />
              }
              <Text
                className={`font-semibold text-xs ${
                  gender === g ? 'text-blue-300' : 'text-white/70'
                }`}
              >
                {g === 'male' ? 'Menino' : 'Menina'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Birth Date */}
      <View>
        <Text className="text-sm font-semibold text-white mb-2">
          Data de Nascimento
        </Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          disabled={isLoading || submitting}
          accessibilityRole="button"
          accessibilityLabel={`Data de nascimento: ${birthDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}. Toque para alterar.`}
          className={`border px-4 py-3 rounded-lg ${
            fieldErrors.birthDate ? 'border-red-400' : 'border-white/30'
          }`}
        >
          <Text className="text-base" style={{ color: '#ffffff' }}>
            {birthDate.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </Text>
        </TouchableOpacity>
        {!!fieldErrors.birthDate && (
          <Text className="text-xs text-red-400 mt-1">
            {fieldErrors.birthDate}
          </Text>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={birthDate}
            mode="date"
            display="spinner"
            {...(Platform.OS === 'android'
              ? { onValueChange: handleDateValueChange, onDismiss: handleDateDismiss }
              : { onChange: handleDateChange })}
            minimumDate={minDate}
            maximumDate={today}
          />
        )}
      </View>

      {/* Photo Upload */}
      <View>
        <Text className="text-sm font-semibold text-white mb-2">
          Foto (opcional)
        </Text>

        {photoUri ? (
          <View className="gap-2">
            <Image
              source={{ uri: photoUri }}
              className="w-full h-48 rounded-lg bg-white/10"
            />
            <TouchableOpacity
              onPress={() => setPhotoUri(undefined)}
              disabled={isLoading || submitting}
              className="border border-red-400/60 bg-red-900/30 p-3 rounded-lg"
            >
              <Text className="text-red-400 font-semibold text-center">
                Remover Foto
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={pickImage}
            disabled={isLoading || submitting}
            accessibilityRole="button"
            accessibilityLabel="Selecionar foto do bebê"
            className="border border-dashed border-white/30 bg-white/5 p-8 rounded-lg items-center justify-center"
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#3b82d4" />
            ) : (
              <>
                <IconCamera size={28} color="rgba(255,255,255,0.5)" style={{ marginBottom: 8 }} />
                <Text className="text-white/70 font-semibold">
                  Selecionar Foto
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {!!error && (
        <View className="bg-red-900/30 border border-red-400/60 p-3 rounded-lg">
          <Text className="text-red-400 text-sm">{error}</Text>
        </View>
      )}
    </ScrollView>
  );
};
