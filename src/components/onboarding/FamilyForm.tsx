// src/components/onboarding/FamilyForm.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface FamilyFormProps {
  onSubmit: (name: string, photoUri?: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

/**
 * FamilyForm - Componente para criar família
 * UC007: Criar Família
 */
export const FamilyForm: React.FC<FamilyFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
}) => {
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const validateName = (value: string) => {
    if (value.length < 2) {
      setFieldError('Nome deve ter no mínimo 2 caracteres');
      return false;
    }
    if (value.length > 100) {
      setFieldError('Nome deve ter no máximo 100 caracteres');
      return false;
    }
    setFieldError('');
    return true;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (value.length > 0) {
      validateName(value);
    }
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
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
      }
    } catch (err) {
      Alert.alert('Erro', 'Falha ao selecionar imagem');
    }
  };

  const handleSubmit = async () => {
    if (!validateName(name)) return;

    try {
      setSubmitting(true);
      await onSubmit(name, photoUri);
    } catch (err) {
      console.error('Erro ao criar família:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="gap-4">
      {/* Name Input */}
      <View>
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Nome da Família
        </Text>
        <TextInput
          placeholder="Ex: Família Silva"
          value={name}
          onChangeText={handleNameChange}
          editable={!isLoading && !submitting}
          className={`border px-4 py-3 rounded-lg text-base ${
            fieldError ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          placeholderTextColor="#999"
        />
        {!!fieldError && (
          <Text className="text-xs text-red-500 mt-1">{fieldError}</Text>
        )}
      </View>

      {/* Photo Upload */}
      <View>
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Foto da Família (opcional)
        </Text>

        {photoUri ? (
          <View className="gap-2">
            {/* Preview */}
            <Image
              source={{ uri: photoUri }}
              className="w-full h-48 rounded-lg bg-gray-100"
            />

            {/* Remove Button */}
            <TouchableOpacity
              onPress={() => setPhotoUri(undefined)}
              disabled={isLoading || submitting}
              className="border border-red-300 bg-red-50 p-3 rounded-lg"
            >
              <Text className="text-red-600 font-semibold text-center">
                Remover Foto
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={pickImage}
            disabled={isLoading || submitting}
            className="border border-dashed border-gray-400 bg-gray-50 p-8 rounded-lg items-center justify-center"
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#3b82d4" />
            ) : (
              <>
                <Text className="text-3xl mb-2">📷</Text>
                <Text className="text-gray-600 font-semibold">
                  Selecionar Foto
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {!!error && (
        <View className="bg-red-50 border border-red-200 p-3 rounded-lg">
          <Text className="text-red-700 text-sm">{error}</Text>
        </View>
      )}
    </View>
  );
};
