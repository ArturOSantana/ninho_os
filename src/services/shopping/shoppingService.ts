// src/services/shopping/shoppingService.ts

import { supabase } from '@/lib/supabase';
import { ShoppingItem, CreateShoppingItemInput, UUID } from '@/types';

/**
 * Shopping Service - CRUD de itens de compras (shopping_items)
 * UC021: Criar lista | UC022: Comprar item | UC023: Compartilhar lista
 */
export const shoppingService = {
  /**
   * Listar itens de compras da família
   */
  async listItems(familyId: UUID, onlyPending = false): Promise<ShoppingItem[]> {
    let query = supabase
      .from('shopping_items')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (onlyPending) {
      query = query.eq('checked', false);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as ShoppingItem[];
  },

  /**
   * Adicionar item — UC021
   */
  async addItem(familyId: UUID, input: CreateShoppingItemInput): Promise<ShoppingItem> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) throw new Error('Usuário não autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', auth.user.id)
      .single();

    if (profileError || !profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('shopping_items')
      .insert({
        family_id: familyId,
        name: input.name,
        quantity: input.quantity ?? null,
        unit: input.unit ?? null,
        category: input.category ?? null,
        checked: false,
        added_by: profile.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ShoppingItem;
  },

  /**
   * Marcar item como comprado — UC022
   */
  async checkItem(id: UUID): Promise<ShoppingItem> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) throw new Error('Usuário não autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', auth.user.id)
      .single();

    if (profileError || !profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('shopping_items')
      .update({ checked: true, checked_by: profile.id })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ShoppingItem;
  },

  /**
   * Excluir item
   */
  async deleteItem(id: UUID): Promise<void> {
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};
