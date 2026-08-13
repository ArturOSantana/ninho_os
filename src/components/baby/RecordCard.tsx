import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  IconBabyBottle, IconDroplet, IconMoon, IconPill,
  IconWeight, IconRuler, IconThermometer, IconNote,
} from '@tabler/icons-react-native';
import { BabyRecord } from '@/types';
import { Colors } from '@/constants/theme';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RECORD_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  feeding:     { icon: <IconBabyBottle  size={16} color={Colors.primary}   />, label: 'Mamada',      color: Colors.primary   },
  diaper:      { icon: <IconDroplet     size={16} color={Colors.secondary} />, label: 'Fralda',       color: Colors.secondary },
  sleep:       { icon: <IconMoon        size={16} color={Colors.info}      />, label: 'Sono',         color: Colors.info      },
  medication:  { icon: <IconPill        size={16} color={Colors.cream}     />, label: 'Medicamento',  color: Colors.cream     },
  weight:      { icon: <IconWeight      size={16} color={Colors.tertiary}  />, label: 'Peso',         color: Colors.tertiary  },
  height:      { icon: <IconRuler       size={16} color={Colors.tertiary}  />, label: 'Altura',       color: Colors.tertiary  },
  temperature: { icon: <IconThermometer size={16} color={Colors.warning}   />, label: 'Temperatura',  color: Colors.warning   },
  note:        { icon: <IconNote        size={16} color={Colors.muted}     />, label: 'Observação',   color: Colors.muted     },
};

function getRecordDescription(record: BabyRecord): string {
  switch (record.type) {
    case 'feeding': {
      const typeMap: Record<string, string> = {
        breast_left: 'Peito esquerdo',
        breast_right: 'Peito direito',
        bottle: 'Mamadeira',
        solid: 'Sólido',
      };
      const label = record.feeding_type ? typeMap[record.feeding_type] ?? '' : '';
      const ml = record.feeding_amount_ml ? ` · ${record.feeding_amount_ml}ml` : '';
      return `${label}${ml}`;
    }
    case 'diaper': {
      const typeMap: Record<string, string> = { pee: 'Xixi', poo: 'Cocô', both: 'Xixi e Cocô' };
      return record.diaper_type ? typeMap[record.diaper_type] ?? '' : '';
    }
    case 'sleep':
      return record.sleep_type === 'night' ? 'Sono noturno' : 'Cochilo';
    case 'weight':
      return record.weight_kg ? `${record.weight_kg} kg` : '';
    case 'height':
      return record.height_cm ? `${record.height_cm} cm` : '';
    case 'temperature':
      return record.temperature_c ? `${record.temperature_c}°C` : '';
    case 'medication':
      return `${record.medication_name ?? ''}${record.medication_dose ? ` · ${record.medication_dose}` : ''}`;
    default:
      return record.notes ?? '';
  }
}

interface RecordCardProps {
  record: BabyRecord;
  onPress?: () => void;
}

export function RecordCard({ record, onPress }: RecordCardProps) {
  const meta = RECORD_META[record.type] ?? {
    icon: <IconNote size={16} color={Colors.muted} />,
    label: record.type,
    color: Colors.muted,
  };
  const desc = getRecordDescription(record);
  const ago = formatDistanceToNow(new Date(record.started_at), { addSuffix: true, locale: ptBR });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: meta.color + '22',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {meta.icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.text, fontSize: 14, fontWeight: '600' }}>{meta.label}</Text>
        {desc ? (
          <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 1 }}>{desc}</Text>
        ) : null}
      </View>
      <Text style={{ color: Colors.muted, fontSize: 11 }}>{ago}</Text>
    </TouchableOpacity>
  );
}
